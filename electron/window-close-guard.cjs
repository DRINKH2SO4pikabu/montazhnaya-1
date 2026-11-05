"use strict";

/**
 * Intercepts a BrowserWindow close request, checks renderer dirty state, and
 * asks for explicit discard confirmation before allowing unsaved work to go.
 * The renderer's beforeunload handler must perform cleanup only; it must not
 * block the close with a second browser-native prompt.
 */
function installWindowCloseGuard(window, options = {}) {
  if (!window || typeof window.on !== "function" || typeof window.close !== "function") {
    throw new TypeError("A BrowserWindow-like object is required.");
  }
  if (typeof options.getDirtyState !== "function" || typeof options.confirmDiscard !== "function") {
    throw new TypeError("getDirtyState and confirmDiscard callbacks are required.");
  }

  let closeApproved = false;
  let promptPending = false;

  const onClose = event => {
    if (closeApproved) return;
    event.preventDefault();
    if (promptPending) return;
    promptPending = true;

    Promise.resolve()
      .then(() => options.getDirtyState())
      .then(async isDirty => {
        if (isDirty && !(await options.confirmDiscard())) return;
        closeApproved = true;
        window.close();
      })
      .catch(async error => {
        try {
          if (typeof options.onError === "function") options.onError(error);
        } catch (_) {}
        // If the renderer is still loading or crashed, prefer an explicit
        // discard confirmation over leaving the close button unresponsive.
        try {
          if (await options.confirmDiscard()) {
            closeApproved = true;
            window.close();
          }
        } catch (promptError) {
          try {
            if (typeof options.onError === "function") options.onError(promptError);
          } catch (_) {}
        }
      })
      .finally(() => { promptPending = false; });
  };

  window.on("close", onClose);
  return {
    allowClose() { closeApproved = true; },
    dispose() { window.removeListener?.("close", onClose); }
  };
}

module.exports = { installWindowCloseGuard };
