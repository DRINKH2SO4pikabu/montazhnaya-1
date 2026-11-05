const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'src', 'renderer', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractBetween(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1, `Missing source marker: ${start}`);
  const to = html.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return html.slice(from, to);
}

test('video thumbnail is embedded in its video asset and is not imported as a separate file', () => {
  const thumbnail = extractBetween('function grabThumbnail(videoEl, asset) {', '\nasync function prepareAudioPreviewFallback');
  assert.match(thumbnail, /asset\.thumb\s*=\s*canvas\.toDataURL\("image\/jpeg"/);
  assert.doesNotMatch(thumbnail, /project\.media\.push|importFiles\s*\(|new File\s*\(|URL\.createObjectURL/);
});

test('import diagnostics record every input file and map it to the created asset', () => {
  const importer = extractBetween('async function importFiles(fileList, importSource = "unknown") {', '\nfunction removeMedia');
  assert.match(importer, /const files = Array\.from\(fileList \|\| \[\]\)/);
  assert.match(importer, /name: String\(file && file\.name/);
  assert.match(importer, /type: String\(file && file\.type/);
  assert.match(importer, /sizeBytes: Number\(file && file\.size\)/);
  assert.match(importer, /\[IMPORT_DIAGNOSTIC\] FileList received/);
  assert.match(importer, /\[IMPORT_DIAGNOSTIC\] Media item added/);
  assert.match(importer, /\[IMPORT_DIAGNOSTIC\] Import finished/);
  assert.match(importer, /uiT\("status\.media\.imported", \{ countLabel: uiCount\("mediaFile", okCount\) \}\)/);
});

test('all import entry points identify their source', () => {
  assert.match(html, /importFiles\(fileInput\.files, "file-picker"\)/);
  assert.match(html, /importFiles\(files, "window-drop"\)/);
  assert.match(html, /importFiles\(files, "timeline-drop"\)/);
});

test('declining autosave recovery clears the autosave and returns without deserializing it', () => {
  const startup = extractBetween('async function checkAutosaveOnStartup() {', '\n/* ============================================================\n   МОДУЛЬ 14. ЭКСПОРТ');
  const declined = startup.indexOf('if (!restore) { clearAutosave(); return false; }');
  const deserialize = startup.indexOf('deserializeProject(json);');
  assert.notEqual(declined, -1);
  assert.ok(deserialize > declined, 'project deserialization must happen only after recovery is accepted');
});
