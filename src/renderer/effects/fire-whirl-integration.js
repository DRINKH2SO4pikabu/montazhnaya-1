/*
 * Montazhnaya — Fire Whirl shared preview/export integration (Stage 2).
 * Owns the offscreen source surfaces and one WebGL2 compositor per output canvas.
 * The caller supplies source-frame drawing callbacks, so preview and every export
 * backend use the exact same sequence compositor and shader implementation.
 */
(function attachFireWhirlIntegration(global) {
  "use strict";

  const sessions = new WeakMap();
  const liveSessions = new Set();
  const config = { powerPreference: "high-performance" };
  const ESTIMATED_BYTES_PER_PIXEL = 24;

  function estimateWorkingSet(width, height) {
    const w = Math.max(1, Math.floor(Number(width) || 1));
    const h = Math.max(1, Math.floor(Number(height) || 1));
    const pixels = w * h;
    const estimatedBytes = pixels * ESTIMATED_BYTES_PER_PIXEL;
    return Object.freeze({
      width: w,
      height: h,
      pixels,
      estimatedBytes,
      estimatedMiB: estimatedBytes / (1024 * 1024),
      bytesPerPixel: ESTIMATED_BYTES_PER_PIXEL,
      note: "Approximate lower-bound estimate for two source surfaces, two WebGL textures, the WebGL output surface and the 2D destination. Driver/browser overhead is excluded."
    });
  }

  function makeCanvas() {
    if (!global.document || typeof global.document.createElement !== "function") {
      throw new Error("Canvas creation is unavailable");
    }
    return global.document.createElement("canvas");
  }

  function createRenderer(canvas) {
    const api = global.MontazhnayaFireWhirl;
    if (!api || typeof api.create !== "function") throw new Error("Fire Whirl WebGL core is unavailable");
    return api.create(canvas, { powerPreference: config.powerPreference });
  }

  function configure(options = {}) {
    const requested = options.powerPreference;
    if (requested !== undefined && !["default", "low-power", "high-performance"].includes(requested)) {
      throw new TypeError("powerPreference must be default, low-power or high-performance");
    }
    if (requested && requested !== config.powerPreference) {
      releaseAll();
      config.powerPreference = requested;
    }
    return Object.freeze({ powerPreference: config.powerPreference });
  }

  function getDiagnostics(width = 1920, height = 1080) {
    let canvas = null;
    let gl = null;
    let supported = false;
    let reason = null;
    let vendor = "Unknown";
    let renderer = "Unknown";
    let version = "Unknown";
    let shadingLanguageVersion = "Unknown";
    let maxTextureSize = 0;
    let maxViewportDims = [0, 0];
    let rendererUnmasked = null;
    let vendorUnmasked = null;
    const size = estimateWorkingSet(width, height);
    try {
      canvas = makeCanvas();
      gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: true,
        powerPreference: config.powerPreference
      });
      if (!gl) {
        reason = "webgl2-unavailable";
      } else {
        supported = true;
        try { vendor = String(gl.getParameter(gl.VENDOR) || vendor); } catch (_) {}
        try { renderer = String(gl.getParameter(gl.RENDERER) || renderer); } catch (_) {}
        try { version = String(gl.getParameter(gl.VERSION) || version); } catch (_) {}
        try { shadingLanguageVersion = String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || shadingLanguageVersion); } catch (_) {}
        try { maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0; } catch (_) {}
        try { maxViewportDims = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || maxViewportDims); } catch (_) {}
        try {
          const debug = gl.getExtension("WEBGL_debug_renderer_info");
          if (debug) {
            vendorUnmasked = String(gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) || "") || null;
            rendererUnmasked = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) || "") || null;
          }
        } catch (_) {}
        const maxWidth = Math.min(maxTextureSize || Infinity, Number(maxViewportDims[0]) || Infinity);
        const maxHeight = Math.min(maxTextureSize || Infinity, Number(maxViewportDims[1]) || Infinity);
        if (Number(width) > maxWidth || Number(height) > maxHeight) reason = "target-exceeds-webgl-limits";
      }
    } catch (error) {
      supported = false;
      reason = error && error.message ? String(error.message) : "diagnostics-failed";
    } finally {
      if (gl) {
        try { gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (_) {}
      }
      if (canvas) {
        try { canvas.width = 1; canvas.height = 1; } catch (_) {}
      }
    }
    return Object.freeze({
      supported,
      reason,
      powerPreference: config.powerPreference,
      vendor,
      renderer,
      vendorUnmasked,
      rendererUnmasked,
      version,
      shadingLanguageVersion,
      maxTextureSize,
      maxViewportWidth: Number(maxViewportDims[0]) || 0,
      maxViewportHeight: Number(maxViewportDims[1]) || 0,
      target: size,
      targetWithinLimits: supported && !reason
    });
  }

  function releaseCanvasSurface(canvas, loseWebGl = false) {
    if (!canvas) return;
    if (loseWebGl) {
      try {
        const gl = canvas.getContext && canvas.getContext("webgl2");
        gl && gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (_) {}
    }
    try { canvas.width = 1; canvas.height = 1; } catch (_) {}
  }

  function createSession(outputCanvas) {
    const fromCanvas = makeCanvas();
    const toCanvas = makeCanvas();
    const effectCanvas = makeCanvas();
    const fromContext = fromCanvas.getContext("2d", { alpha: true, colorSpace: "srgb" });
    const toContext = toCanvas.getContext("2d", { alpha: true, colorSpace: "srgb" });
    if (!fromContext || !toContext) throw new Error("Unable to create Fire Whirl source surfaces");

    const session = {
      outputCanvas,
      fromCanvas,
      toCanvas,
      effectCanvas,
      fromContext,
      toContext,
      renderer: null,
      contextLost: false,
      disposed: false
    };

    effectCanvas.addEventListener("webglcontextlost", event => {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      session.contextLost = true;
      session.renderer = null;
    });
    effectCanvas.addEventListener("webglcontextrestored", () => {
      if (session.disposed) return;
      try {
        session.renderer = createRenderer(effectCanvas);
        session.contextLost = false;
      } catch (_) {
        session.renderer = null;
        session.contextLost = true;
      }
    });

    try {
      session.renderer = createRenderer(effectCanvas);
    } catch (error) {
      // A constructor can acquire a real WebGL context before shader compilation
      // or program linking fails. Release it immediately instead of leaving an
      // unreachable context alive until browser garbage collection.
      releaseCanvasSurface(effectCanvas, true);
      releaseCanvasSurface(fromCanvas);
      releaseCanvasSurface(toCanvas);
      session.disposed = true;
      throw error;
    }
    sessions.set(outputCanvas, session);
    liveSessions.add(session);
    return session;
  }

  function getSession(outputCanvas) {
    let session = sessions.get(outputCanvas);
    if (!session || session.disposed) session = createSession(outputCanvas);
    if (session.contextLost) throw new Error("Fire Whirl WebGL context was lost");
    if (!session.renderer) session.renderer = createRenderer(session.effectCanvas);
    return session;
  }

  function resizeCanvas(canvas, width, height) {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  }

  function clearSurface(context, canvas) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    if ("filter" in context) context.filter = "none";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function render(outputContext, outputCanvas, drawFrom, drawTo, options = {}) {
    if (!outputContext || !outputCanvas || typeof drawFrom !== "function" || typeof drawTo !== "function") {
      return { ok: false, reason: "invalid-arguments" };
    }
    try {
      const width = Math.max(1, Math.floor(Number(options.width) || outputCanvas.width || 1));
      const height = Math.max(1, Math.floor(Number(options.height) || outputCanvas.height || 1));
      const session = getSession(outputCanvas);
      if (session.renderer && typeof session.renderer.validateDimensions === "function") {
        const sizeCheck = session.renderer.validateDimensions(width, height);
        if (!sizeCheck.ok) {
          return { ok: false, reason: "unsupported-resolution", maxWidth: sizeCheck.maxWidth, maxHeight: sizeCheck.maxHeight };
        }
      }
      resizeCanvas(session.fromCanvas, width, height);
      resizeCanvas(session.toCanvas, width, height);
      clearSurface(session.fromContext, session.fromCanvas);
      clearSurface(session.toContext, session.toCanvas);

      // A source callback may return false while a preview decoder is still seeking.
      // Do not composite stale or half-decoded pixels into the output frame.
      const fromReady = drawFrom(session.fromContext, session.fromCanvas) !== false;
      const toReady = drawTo(session.toContext, session.toCanvas) !== false;
      if (!fromReady || !toReady) return { ok: false, reason: "source-frame-not-ready" };

      session.renderer.render(session.fromCanvas, session.toCanvas, {
        width,
        height,
        progress: options.progress,
        time: options.time,
        seed: options.seed,
        // Optional alpha matte output for callers that need a reusable mask.
        maskOnly: options.maskOnly === true
      });
      outputContext.save();
      outputContext.globalAlpha = 1;
      outputContext.globalCompositeOperation = "source-over";
      outputContext.drawImage(session.effectCanvas, 0, 0, width, height);
      outputContext.restore();
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: "webgl-unavailable", error };
    }
  }

  function probe() {
    let renderer = null;
    let probeGl = null;
    let effectCanvas = null;
    try {
      const fromCanvas = makeCanvas();
      const toCanvas = makeCanvas();
      effectCanvas = makeCanvas();
      fromCanvas.width = toCanvas.width = 2;
      fromCanvas.height = toCanvas.height = 2;
      const fromContext = fromCanvas.getContext("2d");
      const toContext = toCanvas.getContext("2d");
      if (!fromContext || !toContext) return false;
      fromContext.fillStyle = "#d34b20";
      fromContext.fillRect(0, 0, 2, 2);
      toContext.fillStyle = "#203f9b";
      toContext.fillRect(0, 0, 2, 2);
      renderer = createRenderer(effectCanvas);
      probeGl = effectCanvas.getContext("webgl2");
      renderer.render(fromCanvas, toCanvas, { width: 2, height: 2, progress: 0.5, time: 0.5, seed: 17 });
      return true;
    } catch (_) {
      return false;
    } finally {
      if (renderer) {
        try { renderer.dispose(); } catch (_) {}
      }
      // A failed renderer constructor can still have created a WebGL context.
      // Recover it from the disposable canvas so even shader-compile failures
      // release the preflight context.
      if (!probeGl && effectCanvas) {
        try { probeGl = effectCanvas.getContext("webgl2"); } catch (_) {}
      }
      // The preflight probe is disposable. Do not leave a second WebGL context
      // alive for the entire export when the real compositor will create its
      // own context on the output canvas.
      try { probeGl && probeGl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (_) {}
    }
  }

  function release(outputCanvas) {
    const session = outputCanvas && sessions.get(outputCanvas);
    if (!session) return;
    session.disposed = true;
    if (session.renderer) {
      try { session.renderer.dispose(); } catch (_) {}
    }
    session.renderer = null;
    session.fromCanvas.width = session.fromCanvas.height = 1;
    session.toCanvas.width = session.toCanvas.height = 1;
    session.effectCanvas.width = session.effectCanvas.height = 1;
    try {
      const gl = session.effectCanvas.getContext("webgl2");
      gl && gl.getExtension("WEBGL_lose_context")?.loseContext();
    } catch (_) {}
    sessions.delete(outputCanvas);
    liveSessions.delete(session);
  }

  function releaseAll() {
    for (const session of Array.from(liveSessions)) release(session.outputCanvas);
  }

  if (global.addEventListener) global.addEventListener("beforeunload", releaseAll, { once: true });

  global.MontazhnayaFireWhirlIntegration = Object.freeze({
    render,
    probe,
    configure,
    getDiagnostics,
    estimateWorkingSet,
    release,
    releaseAll,
    version: "0.3.0-stage3"
  });
})(typeof window !== "undefined" ? window : globalThis);
