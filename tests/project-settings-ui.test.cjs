"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const renderer = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");

function readFunctionBlock(startName, endName) {
  const start = renderer.indexOf(`function ${startName}(`);
  const end = renderer.indexOf(`\nfunction ${endName}(`, start);
  assert.ok(start >= 0 && end > start, `${startName} source block must exist`);
  return renderer.slice(start, end);
}

function createSelect() {
  return {
    options: [],
    _value: "",
    set innerHTML(value) { if (value === "") this.options = []; },
    get innerHTML() { return ""; },
    appendChild(option) { this.options.push(option); return option; },
    removeChild(option) { const index = this.options.indexOf(option); if (index >= 0) this.options.splice(index, 1); return option; },
    set value(value) { this._value = String(value); },
    get value() { return this._value; }
  };
}

function createElement() {
  return { value: "", textContent: "", dataset: {} };
}

const presetsMatch = renderer.match(/const RESOLUTION_PRESETS = (\{[\s\S]*?\n\});/);
assert.ok(presetsMatch, "resolution presets must be defined");
const resolutionPresets = vm.runInNewContext(`(${presetsMatch[1]})`);
const settingsFunctions = readFunctionBlock("updateProjectProfileUI", "copySelectedClip");

function buildSettingsSandbox(projectOverrides = {}) {
  const fpsSelect = createSelect();
  for (const fps of [24, 25, 30, 50, 60]) fpsSelect.appendChild({ value: String(fps), textContent: String(fps), dataset: {} });
  fpsSelect.value = "30";
  const aspectSelect = createSelect();
  for (const aspect of ["16:9", "9:16", "1:1", "4:3", "21:9"]) aspectSelect.appendChild({ value: aspect, textContent: aspect, dataset: {} });
  aspectSelect.value = "16:9";
  const resSelect = createSelect();
  const profile = { textContent: "", title: "", dataset: {} };
  const elements = { "#fpsSelect": fpsSelect, "#aspectSelect": aspectSelect, "#resSelect": resSelect, "#projectProfile": profile };
  const project = {
    width: 1280, height: 720, aspect: "16:9", fps: 30,
    tracks: [{ id: "V1", clips: [{ id: "clip-1", timelineStart: 2.25, duration: 5.5 }] }],
    markers: [{ id: "marker-1", time: 2.237 }],
    ...projectOverrides
  };
  const appState = { playhead: 2.237 };
  const calls = [];
  const sandbox = {
    project,
    AppState: appState,
    DEFAULT_FPS: 30,
    uiT: key => key === "profile.custom" ? "Пользовательский" : key,
    RESOLUTION_PRESETS: resolutionPresets,
    document: { createElement },
    $: selector => elements[selector] || null,
    pause: () => calls.push("pause"),
    applyProjectCanvasSize: () => calls.push("canvas"),
    History: { record: () => calls.push("history") },
    renderTimeline: () => calls.push("timeline"),
    updateTimeDisplay: () => calls.push("time"),
    renderProperties: () => calls.push("properties"),
    updatePreview: () => calls.push("preview"),
    calls,
    elements
  };
  vm.createContext(sandbox);
  vm.runInContext(settingsFunctions, sandbox);
  return sandbox;
}

test("Dark Premium native select popup uses a dark color scheme and high-contrast options", () => {
  assert.match(renderer, /body\.theme-dark-premium select\s*\{[^}]*color-scheme:\s*dark/s);
  assert.match(renderer, /body\.theme-dark-premium select option[\s\S]*?color:\s*#f0f7fa[\s\S]*?background-color:\s*#172d39/s);
  assert.match(renderer, /body\.theme-dark-premium select option:checked[\s\S]*?background-color:\s*#75401f/s);
  assert.match(renderer, /body\.theme-dark-premium select option:disabled[\s\S]*?color:\s*#8fa2ac/s);
});

test("disabled project controls are visually distinct without dimming enabled options", () => {
  assert.match(renderer, /body\.theme-dark-premium select:enabled\s*\{[^}]*opacity:\s*1/s);
  assert.match(renderer, /body\.theme-dark-premium select:disabled\s*\{[^}]*cursor:\s*not-allowed/s);
  for (const id of ["fpsSelect", "aspectSelect", "resSelect"]) {
    const tag = renderer.match(new RegExp(`<select id="${id}"[^>]*>`));
    assert.ok(tag, `${id} must exist`);
    assert.doesNotMatch(tag[0], /\bdisabled\b/, `${id} must remain editable in normal project state`);
  }
});

test("preview header displays the current project resolution and FPS", () => {
  assert.match(renderer, /id="projectProfile" role="status" aria-live="polite"/);
  assert.match(renderer, /function updateProjectProfileUI\(\)[\s\S]*?profile\.textContent = numberText\(width[\s\S]*?fps \+ " fps"/);
  const sandbox = buildSettingsSandbox({ width: 1920, height: 1080, fps: 60 });
  sandbox.updateProjectProfileUI();
  assert.equal(sandbox.elements["#projectProfile"].textContent, "1920 × 1080 · 16:9 · 60 fps");
});

test("loading a custom project resolution and FPS preserves them as explicit custom options", () => {
  const sandbox = buildSettingsSandbox({ width: 1672, height: 941, fps: 29.97, aspect: "16:9" });
  sandbox.syncProjectSettingsUI();
  assert.equal(sandbox.project.width, 1672);
  assert.equal(sandbox.project.height, 941);
  assert.equal(sandbox.elements["#resSelect"].value, "1672x941");
  assert.ok(sandbox.elements["#resSelect"].options.some(option => option.textContent.includes("Пользовательский")));
  assert.equal(sandbox.elements["#fpsSelect"].value, "29.97");
  assert.ok(sandbox.elements["#fpsSelect"].options.some(option => option.textContent === "29.97 FPS (Пользовательский)"));
  assert.equal(sandbox.elements["#projectProfile"].textContent, "1672 × 941 · 16:9 · 29.97 fps");
});

test("switching projects removes stale custom FPS and aspect entries", () => {
  const sandbox = buildSettingsSandbox({ width: 1672, height: 941, fps: 29.97, aspect: "16:9" });
  sandbox.syncProjectSettingsUI();
  assert.ok(sandbox.elements["#fpsSelect"].options.some(option => option.value === "29.97"));
  sandbox.project.width = 1920;
  sandbox.project.height = 1080;
  sandbox.project.fps = 30;
  sandbox.project.aspect = "16:9";
  sandbox.syncProjectSettingsUI();
  assert.equal(sandbox.elements["#fpsSelect"].options.some(option => option.value === "29.97"), false);
  assert.equal(sandbox.elements["#aspectSelect"].options.filter(option => option.dataset && option.dataset.custom).length, 0);
});

test("changing aspect ratio keeps the nearest resolution tier instead of resetting to the smallest preset", () => {
  const sandbox = buildSettingsSandbox({ width: 1920, height: 1080, aspect: "16:9" });
  sandbox.rebuildResolutionSelect("9:16", false);
  assert.equal(sandbox.project.width, 1080);
  assert.equal(sandbox.project.height, 1920);
  assert.equal(sandbox.elements["#resSelect"].value, "1080x1920");
});

test("project format changes preserve clips, marker timestamps and playhead time", () => {
  const sandbox = buildSettingsSandbox({ width: 1280, height: 720, fps: 30 });
  const clipsBefore = JSON.parse(JSON.stringify(sandbox.project.tracks));
  const markersBefore = JSON.parse(JSON.stringify(sandbox.project.markers));
  const playheadBefore = sandbox.AppState.playhead;
  sandbox.project.fps = 60;
  sandbox.applyProjectSettingsChange();
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.project.tracks)), clipsBefore);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.project.markers)), markersBefore);
  assert.equal(sandbox.AppState.playhead, playheadBefore);
  assert.deepEqual(sandbox.calls, ["pause", "canvas", "history", "timeline", "time", "properties", "preview"]);
  assert.doesNotMatch(readFunctionBlock("applyProjectSettingsChange", "copySelectedClip"), /roundToFrame|project\.markers\s*=/);
});
