const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Exporter defines prepareVideoElements used by start()", () => {
  const sourcePath = path.join(__dirname, "..", "src", "renderer", "index.html");
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /await\s+this\.prepareVideoElements\s*\(\s*\)\s*;/,
    "Export start() must call the video preparation method");
  assert.match(source, /async\s+prepareVideoElements\s*\(\s*\)\s*\{/,
    "Exporter must implement prepareVideoElements");

  const start = source.indexOf("async prepareVideoElements() {");
  const end = source.indexOf("async waitForVideoData(el, timeoutMs)", start);
  assert.ok(start >= 0 && end > start, "prepareVideoElements must be defined before waitForVideoData");
  const method = source.slice(start, end);
  assert.match(method, /this\.state\.exportVideoEls\.set\(clip\.id,\s*el\)/,
    "Each video clip must be registered for timeline rendering");
  assert.match(method, /await this\.waitForVideoData\(el,/,
    "Preparation must wait for decoded video data");
  assert.match(method, /await this\.seekVideoElement\(el,/,
    "Preparation must align the decoder to clip sourceIn");
  assert.match(method, /const cadenceProbe = document\.createElement\("video"\)/,
    "Source cadence must be measured on a separate probe element, not the render element");
  assert.match(method, /await this\.measureSourceFrameInterval\(cadenceProbe,/,
    "Preparation must measure cadence on the isolated probe");
  assert.doesNotMatch(method, /await this\.measureSourceFrameInterval\(el,/,
    "The render element must not be played for cadence measurement before first-frame preparation");
  assert.ok(method.indexOf("await this.measureSourceFrameInterval(cadenceProbe,") < method.indexOf("await this.seekVideoElement(el,"),
    "Cadence measurement on the probe should complete before aligning the untouched render element");
});
