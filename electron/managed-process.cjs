"use strict";

const { spawn } = require("node:child_process");

function parseProgressBlock(block) {
  const values = {};
  for (const line of block.split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return values;
}

function timeToSeconds(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) +
    (match[4] ? Number(`0.${match[4]}`) : 0);
}

/**
 * Start an external process without a shell. The returned job can be cancelled
 * with the process' graceful stdin command first, followed by a hard stop after
 * the configured grace period. Promise settlement waits for stdio to close.
 */
function startManagedProcess(executable, args, options = {}) {
  if (typeof executable !== "string" || !executable || !Array.isArray(args) ||
      args.some(argument => typeof argument !== "string")) {
    throw new TypeError("Некорректные параметры внешнего процесса.");
  }

  const spawnImpl = options.spawnImpl || spawn;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(0, options.timeoutMs) : 0;
  const killGraceMs = Number.isFinite(options.killGraceMs) ? Math.max(100, options.killGraceMs) : 7000;
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};
  const binaryStdin = options.stdinMode === "binary";
  let child;
  try {
    child = spawnImpl(executable, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
  } catch (error) {
    throw error;
  }

  let settled = false;
  let cancelRequested = false;
  let timedOut = false;
  let killTimer = null;
  let timeoutTimer = null;
  let progressBuffer = "";
  let progressValues = {};
  let stderrTail = "";

  const promise = new Promise((resolve, reject) => {
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (killTimer) clearTimeout(killTimer);
      if (error) reject(error);
      else resolve(result);
    };

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", chunk => {
      progressBuffer += chunk;
      let newline;
      while ((newline = progressBuffer.indexOf("\n")) >= 0) {
        const line = progressBuffer.slice(0, newline).trim();
        progressBuffer = progressBuffer.slice(newline + 1);
        const separator = line.indexOf("=");
        if (separator > 0) progressValues[line.slice(0, separator)] = line.slice(separator + 1);
        if (line.startsWith("progress=")) {
          try { onProgress({ ...progressValues, progress: line.slice(9) }); } catch (_) {}
          progressValues = {};
        }
      }
    });
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", chunk => {
      stderrTail = (stderrTail + chunk).slice(-64 * 1024);
    });
    child.stdin?.on("error", () => { /* EPIPE is expected if the child exits first. */ });
    child.once("error", error => finish(error));
    child.once("close", (code, signal) => {
      const details = stderrTail.trim();
      if (timedOut) {
        const error = new Error(`Внешний процесс не завершился за ${timeoutMs} мс.`);
        error.code = "ETIMEDOUT";
        error.stderr = details;
        finish(error);
      } else if (cancelRequested) {
        const error = new Error("Экспорт отменён пользователем.");
        error.code = "PROCESS_CANCELLED";
        error.stderr = details;
        finish(error);
      } else if (code !== 0) {
        const error = new Error(`${executable} завершился с кодом ${code == null ? signal || "неизвестен" : code}${details ? `: ${details.slice(-4000)}` : ""}`);
        error.code = code;
        error.signal = signal;
        error.stderr = details;
        finish(error);
      } else {
        finish(null, { code, signal, stderr: details });
      }
    });

    if (timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        requestCancel();
      }, timeoutMs);
      timeoutTimer.unref?.();
    }
  });

  function requestCancel() {
    if (settled || cancelRequested) return false;
    cancelRequested = true;
    let gracefulSent = false;
    if (!binaryStdin) {
      try {
        if (child.stdin && !child.stdin.destroyed && child.stdin.writable) {
          gracefulSent = true;
          child.stdin.write("q\n");
          child.stdin.end();
        }
      } catch (_) {}
    }
    // stdin carries PNG bytes in streaming export, so a textual "q" would
    // corrupt the image2pipe stream. Terminate the process instead.
    if (!gracefulSent) {
      try { child.kill("SIGTERM"); } catch (_) { try { child.kill(); } catch (_) {} }
    }
    killTimer = setTimeout(() => {
      if (!settled) {
        try { child.kill("SIGKILL"); }
        catch (_) { try { child.kill(); } catch (_) {} }
      }
    }, killGraceMs);
    killTimer.unref?.();
    return true;
  }

  function writeInput(data) {
    if (!Buffer.isBuffer(data) && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer)) {
      return Promise.reject(new TypeError("Данные для stdin должны быть бинарным буфером."));
    }
    if (settled || cancelRequested || !child.stdin || child.stdin.destroyed || !child.stdin.writable) {
      return Promise.reject(new Error("Входной поток FFmpeg уже закрыт или остановлен."));
    }
    const buffer = Buffer.isBuffer(data) ? data : data instanceof ArrayBuffer
      ? Buffer.from(data) : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    return new Promise((resolve, reject) => {
      let done = false;
      const cleanup = () => child.removeListener("close", onClose);
      const fail = error => { if (done) return; done = true; cleanup(); reject(error); };
      const onClose = (code, signal) => fail(new Error(`FFmpeg закрыл входной поток до подтверждения кадра (код ${code == null ? signal || "неизвестен" : code}).`));
      child.once("close", onClose);
      try {
        child.stdin.write(buffer, error => {
          if (error) return fail(error);
          if (settled || cancelRequested) return fail(new Error("Передача кадра прервана вместе с процессом FFmpeg."));
          if (done) return;
          done = true;
          cleanup();
          resolve();
        });
      } catch (error) { fail(error); }
    });
  }

  function endInput() {
    if (!child.stdin || child.stdin.destroyed) return Promise.resolve();
    if (child.stdin.writableEnded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      try {
        child.stdin.end(error => error ? reject(error) : resolve());
      } catch (error) { reject(error); }
    });
  }

  return {
    child,
    promise,
    cancel: requestCancel,
    writeInput,
    endInput,
    get cancelRequested() { return cancelRequested; },
    get settled() { return settled; }
  };
}

module.exports = { parseProgressBlock, timeToSeconds, startManagedProcess };
