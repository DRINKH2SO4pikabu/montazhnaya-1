const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'index.html'), 'utf8');

function section(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1, `Missing source marker: ${start}`);
  const to = html.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return html.slice(from, to);
}

test('embedded media thumbnails cannot start a native image/file drag', () => {
  const library = section('function renderMediaLibrary() {', '\n/* ============================================================\n   МОДУЛЬ 12. СВОЙСТВА');
  assert.match(library, /thumbnailImage\.draggable\s*=\s*false/);
  assert.match(library, /thumbnailImage\.setAttribute\("draggable",\s*"false"\)/);
  assert.match(html, /\.mi-thumb img\{[^}]*pointer-events:none[^}]*-webkit-user-drag:none/);
});

test('internal media cards publish a dedicated MIME type and retain plain-text fallback', () => {
  const library = section('function renderMediaLibrary() {', '\n/* ============================================================\n   МОДУЛЬ 12. СВОЙСТВА');
  const dragId = section('function getDragMediaId(event) {', '\nasync function importAndPlaceFilesOnTrack');
  assert.match(library, /setData\("application\/x-montazhnaya-media",\s*media\.id\)/);
  assert.match(library, /setData\("text\/plain",\s*media\.id\)/);
  assert.ok(dragId.indexOf('application/x-montazhnaya-media') < dragId.indexOf('text/plain'));
  assert.match(dragId, /return explicit/);
});

test('timeline dragover recognizes internal media before external Files payloads', () => {
  const dragover = section('content.addEventListener("dragover", ev => {', '\n  content.addEventListener("dragleave"');
  assert.ok(dragover.indexOf('const mediaId = getDragMediaId(ev)') < dragover.indexOf('const carriesFiles ='));
  assert.match(dragover, /if \(media\)\s*\{[\s\S]*?return;[\s\S]*?const carriesFiles/);
});

test('timeline drop places an existing media asset before processing external dropped files', () => {
  const drop = section('content.addEventListener("drop", async ev => {', '\n  });\n}\n\nfunction bindGlobalEvents');
  const internalMedia = drop.indexOf('const mediaId = getDragMediaId(ev)');
  const externalFiles = drop.indexOf('const droppedFiles = Array.from');
  assert.notEqual(internalMedia, -1);
  assert.notEqual(externalFiles, -1);
  assert.ok(internalMedia < externalFiles, 'internal media must be resolved before DataTransfer.files');
  assert.match(drop, /await addMediaToTimeline\(mediaId, track\.id/);
  assert.match(drop, /await importAndPlaceFilesOnTrack\(droppedFiles, track, time\)/);
});

test('the external Explorer-to-timeline import path remains enabled', () => {
  const dragover = section('content.addEventListener("dragover", ev => {', '\n  content.addEventListener("dragleave"');
  const drop = section('content.addEventListener("drop", async ev => {', '\n  });\n}\n\nfunction bindGlobalEvents');
  assert.match(dragover, /includes\("Files"\)/);
  assert.match(drop, /await importAndPlaceFilesOnTrack\(droppedFiles, track, time\)/);
});
