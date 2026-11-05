"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { installWindowCloseGuard } = require("../electron/window-close-guard.cjs");

class FakeWindow extends EventEmitter {
  constructor() { super(); this.closed = false; this.closeRequests = 0; }
  close() {
    this.closeRequests += 1;
    let prevented = false;
    this.emit("close", { preventDefault() { prevented = true; } });
    if (!prevented) this.closed = true;
  }
}

async function flush() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

test("clean project closes immediately without confirmation", async () => {
  const win = new FakeWindow();
  let prompts = 0;
  installWindowCloseGuard(win, { getDirtyState: async () => false, confirmDiscard: async () => { prompts += 1; return true; } });
  win.close();
  await flush();
  assert.equal(win.closed, true);
  assert.equal(prompts, 0);
  assert.equal(win.closeRequests, 2);
});

test("dirty project stays open when user cancels close", async () => {
  const win = new FakeWindow();
  let prompts = 0;
  installWindowCloseGuard(win, { getDirtyState: async () => true, confirmDiscard: async () => { prompts += 1; return false; } });
  win.close();
  await flush();
  assert.equal(win.closed, false);
  assert.equal(prompts, 1);
  assert.equal(win.closeRequests, 1);
});

test("dirty project closes only after explicit discard confirmation", async () => {
  const win = new FakeWindow();
  installWindowCloseGuard(win, { getDirtyState: async () => true, confirmDiscard: async () => true });
  win.close();
  await flush();
  assert.equal(win.closed, true);
  assert.equal(win.closeRequests, 2);
});

test("repeated close clicks do not open duplicate confirmations", async () => {
  const win = new FakeWindow();
  let releasePrompt;
  let prompts = 0;
  const prompt = new Promise(resolve => { releasePrompt = resolve; });
  installWindowCloseGuard(win, { getDirtyState: async () => true, confirmDiscard: async () => { prompts += 1; return prompt; } });
  win.close();
  win.close();
  await flush();
  assert.equal(prompts, 1);
  releasePrompt(false);
  await flush();
  assert.equal(win.closed, false);
});

test("close guard falls back to explicit discard confirmation when renderer state is unavailable", async () => {
  const win = new FakeWindow();
  let reported = false;
  let prompts = 0;
  installWindowCloseGuard(win, { getDirtyState: async () => { throw new Error("renderer unavailable"); }, confirmDiscard: async () => { prompts += 1; return false; }, onError: () => { reported = true; } });
  win.close();
  await flush();
  assert.equal(reported, true);
  assert.equal(prompts, 1);
  assert.equal(win.closed, false);
});
