/*
 * Montazhnaya — Fire Whirl transition compositor (Stage 2 integration)
 * WebGL2 renderer shared by the timeline preview and sequence export compositor.
 */
(function attachFireWhirl(global) {
  "use strict";

  const VERTEX_SHADER = `#version 300 es
  precision highp float;
  in vec2 aPosition;
  out vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }`;

  // The same shader produces both the final composite and a grayscale alpha
  // matte (uMaskOnly). A single implementation is used by preview and export.
  const FRAGMENT_SHADER = `#version 300 es
  precision highp float;
  precision highp int;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uResolution;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSeed;
  uniform float uMaskOnly;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32 + uSeed);
    return fract(p.x * p.y);
  }
  float noise21(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  void main() {
    vec2 uv = vUv;
    vec2 centered = uv - 0.5;
    float aspect = uResolution.x / max(1.0, uResolution.y);
    vec2 q = vec2(centered.x * aspect, centered.y);
    float radius = length(q) / max(0.5, length(vec2(aspect, 1.0)) * 0.5);
    float angle = atan(q.y, q.x);
    float p = clamp(uProgress, 0.0, 1.0);

    // A rotating, multi-arm spiral distorts the expanding reveal boundary.
    float spiral = sin(angle * 3.0 - radius * 20.0 + p * 10.5 + uTime * 0.65);
    float turbulence = noise21(uv * vec2(18.0, 11.0) + vec2(uTime * 0.12, -uTime * 0.08));
    float warpedRadius = radius + spiral * 0.075 + (turbulence - 0.5) * 0.045;
    float frontier = -0.10 + p * 1.30;
    float edgeWidth = 0.018 + 0.012 * (1.0 - abs(p - 0.5) * 2.0);
    float reveal = 1.0 - smoothstep(frontier - edgeWidth, frontier + edgeWidth, warpedRadius);
    reveal = clamp(reveal, 0.0, 1.0);

    if (uMaskOnly > 0.5) {
      outColor = vec4(vec3(reveal), reveal);
      return;
    }

    vec4 fromColor = texture(uFrom, uv);
    vec4 toColor = texture(uTo, uv);
    float baseAlpha = mix(fromColor.a, toColor.a, reveal);
    vec3 basePremultiplied = mix(fromColor.rgb * fromColor.a, toColor.rgb * toColor.a, reveal);

    // A narrow hot edge, orange outer flame and small deterministic sparks.
    float edgeDistance = (warpedRadius - frontier) / 0.035;
    float edge = exp(-(edgeDistance * edgeDistance));
    float flameNoise = noise21(uv * vec2(42.0, 27.0) + vec2(0.0, -uTime * 1.8));
    float flame = edge * (0.45 + 0.55 * flameNoise);
    vec3 fireColor = mix(vec3(1.0, 0.16, 0.015), vec3(1.0, 0.78, 0.20), clamp(edge * 1.5, 0.0, 1.0));

    vec2 sparkCell = floor(uv * vec2(34.0, 20.0));
    float sparkRandom = hash21(sparkCell);
    float sparkPhase = fract(sparkRandom + uTime * (0.35 + sparkRandom * 0.8));
    vec2 sparkPos = (sparkCell + vec2(hash21(sparkCell + 3.1), sparkPhase)) / vec2(34.0, 20.0);
    float sparkDistance = length((uv - sparkPos) * vec2(aspect, 1.0));
    float spark = (1.0 - smoothstep(0.002, 0.009, sparkDistance)) * step(0.91, sparkRandom) * (1.0 - smoothstep(0.78, 1.0, p));
    float fireAlpha = clamp(flame * 0.68 + spark * 0.82, 0.0, 1.0);
    vec3 outputPremultiplied = basePremultiplied * (1.0 - fireAlpha) + fireColor * fireAlpha;
    float outputAlpha = fireAlpha + baseAlpha * (1.0 - fireAlpha);
    vec3 outputColor = outputPremultiplied / max(outputAlpha, 0.0001);
    outColor = vec4(outputColor, outputAlpha);
  }`;

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error";
      gl.deleteShader(shader);
      throw new Error("FireWhirl shader compilation failed: " + message);
    }
    return shader;
  }

  class FireWhirlWebGL {
    constructor(canvas, options = {}) {
      if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("A canvas is required");
      const gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: true,
        powerPreference: options.powerPreference || "default"
      });
      if (!gl) throw new Error("WebGL 2 is unavailable");
      this.canvas = canvas;
      this.gl = gl;
      this.disposed = false;
      this.program = null;
      this.textures = [];
      this.uniforms = {};
      this.capabilities = this._readCapabilities();
      this._init();
    }

    _readCapabilities() {
      const gl = this.gl;
      let viewport = [0, 0];
      try { viewport = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || viewport); } catch (_) {}
      let maxTextureSize = 0;
      try { maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0; } catch (_) {}
      return Object.freeze({
        maxTextureSize,
        maxViewportWidth: Number(viewport[0]) || 0,
        maxViewportHeight: Number(viewport[1]) || 0
      });
    }

    validateDimensions(width, height) {
      const w = Math.max(1, Math.floor(Number(width) || 1));
      const h = Math.max(1, Math.floor(Number(height) || 1));
      const caps = this.capabilities || {};
      const maxWidth = Math.min(caps.maxTextureSize || Infinity, caps.maxViewportWidth || Infinity);
      const maxHeight = Math.min(caps.maxTextureSize || Infinity, caps.maxViewportHeight || Infinity);
      if (w > maxWidth || h > maxHeight) {
        return { ok: false, width: w, height: h, maxWidth, maxHeight };
      }
      return { ok: true, width: w, height: h, maxWidth, maxHeight };
    }

    _init() {
      const gl = this.gl;
      const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program) || "Unknown program link error";
        gl.deleteProgram(program);
        throw new Error("FireWhirl program link failed: " + message);
      }
      this.program = program;
      this.uniforms = Object.fromEntries([
        "uFrom", "uTo", "uResolution", "uProgress", "uTime", "uSeed", "uMaskOnly"
      ].map(name => [name, gl.getUniformLocation(program, name)]));
      this.position = gl.getAttribLocation(program, "aPosition");
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
      ]), gl.STATIC_DRAW);
      this.textures = [this._createTexture(), this._createTexture()];
      this.textureSizes = [null, null];
    }

    _createTexture() {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    }

    render(fromSource, toSource, options = {}) {
      if (this.disposed) throw new Error("FireWhirl renderer has been disposed");
      if (!fromSource || !toSource) throw new TypeError("Both transition source frames are required");
      const gl = this.gl;
      const width = Math.max(1, Math.floor(options.width || this.canvas.width || 1));
      const height = Math.max(1, Math.floor(options.height || this.canvas.height || 1));
      const sizeCheck = this.validateDimensions(width, height);
      if (!sizeCheck.ok) {
        const error = new RangeError(`Fire Whirl target ${width}x${height} exceeds WebGL limits ${sizeCheck.maxWidth}x${sizeCheck.maxHeight}`);
        error.code = "FIRE_WHIRL_UNSUPPORTED_RESOLUTION";
        throw error;
      }
      if (this.canvas.width !== width) this.canvas.width = width;
      if (this.canvas.height !== height) this.canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.position);
      gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      for (let i = 0; i < 2; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
        const source = i === 0 ? fromSource : toSource;
        const sourceWidth = Number(source.width || source.videoWidth || source.naturalWidth) || width;
        const sourceHeight = Number(source.height || source.videoHeight || source.naturalHeight) || height;
        const previousSize = this.textureSizes[i];
        if (previousSize && previousSize.width === sourceWidth && previousSize.height === sourceHeight && typeof gl.texSubImage2D === "function") {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
          this.textureSizes[i] = { width: sourceWidth, height: sourceHeight };
        }
      }
      gl.uniform1i(this.uniforms.uFrom, 0);
      gl.uniform1i(this.uniforms.uTo, 1);
      gl.uniform2f(this.uniforms.uResolution, width, height);
      gl.uniform1f(this.uniforms.uProgress, Math.min(1, Math.max(0, Number(options.progress) || 0)));
      gl.uniform1f(this.uniforms.uTime, Math.max(0, Number(options.time) || 0));
      gl.uniform1f(this.uniforms.uSeed, Number(options.seed) || 0);
      gl.uniform1f(this.uniforms.uMaskOnly, options.maskOnly ? 1 : 0);
      gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return this.canvas;
    }

    dispose() {
      if (this.disposed) return;
      const gl = this.gl;
      for (const texture of this.textures) gl.deleteTexture(texture);
      if (this.buffer) gl.deleteBuffer(this.buffer);
      if (this.program) gl.deleteProgram(this.program);
      this.textures = [];
      this.textureSizes = [null, null];
      this.disposed = true;
    }
  }

  global.MontazhnayaFireWhirl = Object.freeze({
    create: (canvas, options) => new FireWhirlWebGL(canvas, options),
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    version: "0.3.0-stage3"
  });
})(typeof window !== "undefined" ? window : globalThis);
