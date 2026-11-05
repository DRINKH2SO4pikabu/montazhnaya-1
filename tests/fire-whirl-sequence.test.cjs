"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "src/renderer/index.html"), "utf8");
const start = html.indexOf("function fireWhirlPairForClip(track, clip, time) {");
const end = html.indexOf("\nfunction renderSequenceAtTime(", start);
assert.ok(start >= 0 && end > start, "Fire Whirl pair resolver must exist in renderer");
const resolverSource = html.slice(start, end);

function makeResolver(overlapOverride) {
  const sandbox = {
    findPreviousClip(track, incoming) {
      return track.clips
        .filter(clip => clip.id !== incoming.id && clip.timelineStart < incoming.timelineStart + 1e-6)
        .sort((a, b) => (b.timelineStart + b.duration) - (a.timelineStart + a.duration))[0] || null;
    },
    isIntentionalTransitionOverlap: overlapOverride || ((outgoing, incoming) => {
      const overlap = outgoing.timelineStart + outgoing.duration - incoming.timelineStart;
      if (!incoming.transIn || incoming.transIn.mode !== "fire-whirl") return false;
      if (incoming.transIn.placement === "pre-roll") return Math.abs(overlap) <= 0.001;
      return Math.abs(overlap - Number(incoming.transIn.duration)) <= 0.001;
    }),
    makeTransitionPrerollRenderClip(clip) {
      const duration = Number(clip.transIn.duration);
      return { ...clip, timelineStart: clip.timelineStart - duration, duration: clip.duration + duration };
    }
  };
  vm.runInNewContext(resolverSource + "\nglobalThis.resolve = findActiveFireWhirlPairs; globalThis.resolveForClip = fireWhirlPairForClip;", sandbox);
  return { resolve: sandbox.resolve, resolveForClip: sandbox.resolveForClip };
}

function pairFixture() {
  const outgoing = { id: "out", timelineStart: 0, duration: 2 };
  const incoming = { id: "in", timelineStart: 1.5, duration: 3, transIn: { mode: "fire-whirl", duration: 0.5 } };
  const track = { clips: [outgoing, incoming] };
  const active = [{ clip: outgoing, state: {} }, { clip: incoming, state: {} }];
  return { outgoing, incoming, track, active };
}

test("Fire Whirl pairs the outgoing and incoming clips only within their intentional overlap", () => {
  const { resolve } = makeResolver();
  const fixture = pairFixture();
  const pairs = resolve(fixture.track, fixture.active, 1.75);
  assert.equal(pairs.size, 1);
  const pair = pairs.get("out");
  assert.equal(pair.outgoing.id, "out");
  assert.equal(pair.incoming.id, "in");
  assert.equal(pair.duration, 0.5);
});

test("Fire Whirl does not activate before or after its overlap window", () => {
  const { resolve } = makeResolver();
  const fixture = pairFixture();
  assert.equal(resolve(fixture.track, fixture.active, 1.49).size, 0);
  assert.equal(resolve(fixture.track, fixture.active, 2.0).size, 0);
});

test("Fire Whirl rejects a nominal transition whose two clips do not form a valid overlap", () => {
  const { resolve } = makeResolver(() => false);
  const fixture = pairFixture();
  assert.equal(resolve(fixture.track, fixture.active, 1.75).size, 0);
});

test("sequence renderer retains both Fire Whirl sources even when a boundary fade reaches zero", () => {
  assert.match(html, /A Fire Whirl transition owns both sources for its entire pre-roll window/);
  assert.match(html, /if \(!activeIds\.has\(outgoing\.id\)\)\s*\{[\s\S]*?active\.push\(\{ clip: outgoing, state: outgoingState \}\)/);
  assert.match(html, /if \(!activeIds\.has\(incoming\.id\)\)\s*\{[\s\S]*?active\.push\(\{ clip: incoming, state: incomingState \}\)/);
});


test("Fire Whirl pair participant resolver includes both source clips during the overlap", () => {
  const { resolveForClip } = makeResolver();
  const fixture = pairFixture();
  assert.equal(resolveForClip(fixture.track, fixture.outgoing, 1.75).incoming.id, "in");
  assert.equal(resolveForClip(fixture.track, fixture.incoming, 1.75).outgoing.id, "out");
  assert.equal(resolveForClip(fixture.track, fixture.outgoing, 2.1), null);
});

test("export source maps never fall back to preview frames for a missing clip", () => {
  assert.match(html, /if \(videoEls && videoEls !== Preview\.clipVideoEls && !source\) return false/);
});


test("Fire Whirl pre-roll starts before the edit and reaches the cut without moving either clip", () => {
  const { resolveForClip } = makeResolver();
  const outgoing = { id: "out", timelineStart: 0, duration: 3 };
  const incoming = { id: "in", timelineStart: 3, duration: 3.033, sourceIn: 3,
    transIn: { mode: "fire-whirl", duration: 0.667, placement: "pre-roll" } };
  const track = { clips: [outgoing, incoming] };
  const pair = resolveForClip(track, incoming, 2.5);
  assert.ok(pair);
  assert.equal(pair.transitionStart, 2.333);
  assert.equal(pair.incomingRenderClip.timelineStart, 2.333);
  assert.equal(incoming.timelineStart, 3);
  assert.equal(outgoing.timelineStart + outgoing.duration, 3);
  assert.ok(!resolveForClip(track, incoming, 3), "the transition is complete at the original edit point");
});
