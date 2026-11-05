const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'index.html'), 'utf8');
const start = html.indexOf('const History = {');
const end = html.indexOf('\n\n/* ============================================================\n   МОДУЛЬ 4.', start);
assert.notEqual(start, -1, 'History module must exist');
assert.notEqual(end, -1, 'History module end marker must exist');
const historySource = html.slice(start, end).trim();

function createHistoryFixture() {
  const clip = {
    id: 'clip-1', timelineStart: 0, duration: 5, sourceIn: 0, sourceOut: 5,
    transIn: { duration: 2, mode: 'crossfade' },
    transOut: { duration: 3, mode: 'wipe-left' }
  };
  const project = {
    fps: 30, width: 1920, height: 1080, aspect: '16:9', media: [], markers: [],
    tracks: [{
      id: 'V1', kind: 'video', label: 'V1', title: 'Video', locked: false,
      muted: false, hidden: false, volume: 1, clips: [clip]
    }]
  };
  const AppState = {
    selection: { type: 'clip', id: 'clip-1' }, selectedMarkerId: null, playhead: 0
  };
  const elements = new Map();
  const sandbox = {
    project, AppState, DEFAULT_FPS: 30,
    $: selector => {
      if (!elements.has(selector)) elements.set(selector, {});
      return elements.get(selector);
    },
    markDirty() {}, syncProjectSettingsUI() {}, pause() {},
    Preview: { reconcileClipElements() {} },
    applyProjectCanvasSize() {}, renderMediaLibrary() {}, renderTimeline() {},
    renderProperties() {}, updateTransportUI() {}, updateTimeDisplay() {}, updatePreview() {}
  };
  vm.runInNewContext(`${historySource}\nglobalThis.__History = History;`, sandbox);
  return { History: sandbox.__History, project, clip };
}

test('undo restores transition durations after an in-place trim edit', () => {
  const { History, project, clip } = createHistoryFixture();
  History.reset();

  // This mirrors the trim/property-edit path, which mutates duration in place.
  clip.transIn.duration = 1.25;
  clip.transOut.duration = 1.5;
  History.record();

  assert.equal(History.undo(), true);
  const restored = project.tracks[0].clips[0];
  assert.equal(restored.transIn.duration, 2);
  assert.equal(restored.transOut.duration, 3);
});

test('redo restores the edited transition durations after undo', () => {
  const { History, project, clip } = createHistoryFixture();
  History.reset();
  clip.transIn.duration = 1.25;
  clip.transOut.duration = 1.5;
  History.record();

  History.undo();
  assert.equal(History.redo(), true);
  const restored = project.tracks[0].clips[0];
  assert.equal(restored.transIn.duration, 1.25);
  assert.equal(restored.transOut.duration, 1.5);
});

test('restored live clips do not share nested transition objects with retained history snapshots', () => {
  const { History, project, clip } = createHistoryFixture();
  History.reset();
  clip.transIn.duration = 1.25;
  History.record();

  History.undo();
  // An in-progress edit before its next record must not corrupt the redo state.
  project.tracks[0].clips[0].transIn.duration = 0.75;
  assert.equal(History.redo(), true);
  assert.equal(project.tracks[0].clips[0].transIn.duration, 1.25);
});

test('history snapshots retain null transitions without manufacturing objects', () => {
  const { History, project, clip } = createHistoryFixture();
  clip.transIn = null;
  clip.transOut = null;
  History.reset();
  assert.equal(History.stack[0].tracks[0].clips[0].transIn, null);
  assert.equal(History.stack[0].tracks[0].clips[0].transOut, null);
});
