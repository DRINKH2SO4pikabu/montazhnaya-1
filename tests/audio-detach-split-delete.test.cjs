"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "src", "renderer", "index.html"), "utf8");

function extract(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, "missing renderer source: " + startMarker);
  return html.slice(start, end);
}

const ownershipHelpers = [
  extract("function hasSeparatedAudioForVideo(videoClip) {", "\nfunction createSeparatedAudioClip(videoClip) {"),
  extract("function findSourceVideoClipForSeparatedAudio(audioClip) {", "\nfunction createSeparatedAudioClip(videoClip) {"),
  extract("function restoreVideoAudioIfNoSeparatedClip(videoClip) {", "\nasync function splitVideoAudioForSelectedClip() {")
].join("\n");

const createSeparatedAudio = extract("function createSeparatedAudioClip(videoClip) {", "\n// Связь представлена отдельным идентификатором пары.");
const findLinkedPartner = extract("function findLinkedAVPartner(clip) {", "\nfunction avClipRole(clip) {");
const unlinkPair = extract("function unlinkAVGroup(linkId) {", "\nfunction unlinkAVForClip(clip) {");
const splitAtPlayhead = extract("function splitClipAtPlayhead() {", "\nfunction beginClipMove(");
const detachSelectedAudio = extract("async function splitVideoAudioForSelectedClip() {", "\nfunction addMediaToDefaultTrack(");
const deleteSelected = extract("function deleteSelectedClip() {", "\nfunction rippleDeleteSelectedClip() {");
const rippleDeleteSelected = extract("function rippleDeleteSelectedClip() {", "\nfunction nudgeSelectedClip(");

function makeSandbox(tracks) {
  let nextId = 0;
  const messages = [];
  const media = {
    id: "media-1",
    kind: "video",
    name: "source-video.mp4",
    embeddedAudioPreviewUnavailable: false
  };
  const sandbox = {
    project: { tracks },
    AppState: {
      selection: { type: null, id: null },
      playhead: 5,
      playing: false
    },
    MIN_CLIP_DURATION: 1 / 30,
    frameDur: () => 1 / 30,
    roundToFrame: value => Math.round(value * 30) / 30,
    getClipSpeed: clip => Number(clip.speed) > 0 ? Number(clip.speed) : 1,
    uid: prefix => prefix + "-" + (++nextId),
    getTrack: id => tracks.find(track => track.id === id) || null,
    getClipById: id => tracks.flatMap(track => track.clips).find(clip => clip.id === id) || null,
    getMedia: id => id === media.id ? media : null,
    AudioEngine: { removeClipNode() {} },
    FallbackAudioEls: new Map(),
    History: { record() {} },
    Preview: { reconcileClipElements() {} },
    renderTimeline() {},
    renderProperties() {},
    updateTransportUI() {},
    updatePreview() {},
    refreshAfterTimelineEdit() {},
    toastKey: (...args) => messages.push(args),
    uiText: value => String(value),
    detectEmbeddedAudio: async () => true,
    getAvailableAudioTrack: () => tracks.find(track => track.id === "A2")
  };
  vm.createContext(sandbox);
  vm.runInContext([
    ownershipHelpers,
    findLinkedPartner,
    unlinkPair,
    splitAtPlayhead,
    deleteSelected,
    rippleDeleteSelected
  ].join("\n") + "\n" +
    "globalThis.splitNow = splitClipAtPlayhead;\n" +
    "globalThis.unlinkNow = unlinkAVGroup;\n" +
    "globalThis.deleteNow = deleteSelectedClip;\n" +
    "globalThis.rippleDeleteNow = rippleDeleteSelectedClip;\n" +
    "globalThis.hasDetachedAudio = hasSeparatedAudioForVideo;\n" +
    "globalThis.findSourceVideo = findSourceVideoClipForSeparatedAudio;\n" +
    "globalThis.restoreSourceVideoAudio = restoreVideoAudioIfNoSeparatedClip;\n",
    sandbox,
    { filename: "audio-detach-test-harness.js" }
  );
  sandbox.messages = messages;
  return sandbox;
}

function makeLinkedPair() {
  const video = {
    id: "video-left",
    mediaId: "media-1",
    trackId: "V1",
    timelineStart: 0,
    duration: 10,
    sourceIn: 0,
    sourceOut: 10,
    speed: 1,
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
    transIn: null,
    transOut: null,
    audioOnlyFromVideo: false,
    audioMutedBySplit: true,
    audioSplitGroupId: "source-group",
    sourceVideoClipId: null,
    avLinkId: "pair-left",
    avLinkEnabled: true,
    name: "source-video.mp4"
  };
  const audio = {
    id: "audio-left",
    mediaId: "media-1",
    trackId: "A1",
    timelineStart: 0,
    duration: 10,
    sourceIn: 0,
    sourceOut: 10,
    speed: 1,
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
    transIn: null,
    transOut: null,
    audioOnlyFromVideo: true,
    audioMutedBySplit: false,
    audioSplitGroupId: "source-group",
    sourceVideoClipId: "video-left",
    avLinkId: "pair-left",
    avLinkEnabled: true,
    name: "Звук: source-video.mp4"
  };
  const videoTrack = { id: "V1", kind: "video", locked: false, clips: [video] };
  const audioTrack = { id: "A1", kind: "audio", locked: false, clips: [audio] };
  const sandbox = makeSandbox([videoTrack, audioTrack]);
  sandbox.AppState.selection = { type: "clip", id: video.id };
  sandbox.splitNow();
  const rightVideo = videoTrack.clips.find(clip => clip.id !== video.id);
  const rightAudio = audioTrack.clips.find(clip => clip.id !== audio.id);
  assert.ok(rightVideo && rightAudio, "the linked A/V pair must split into two paired segments");
  return { sandbox, videoTrack, audioTrack, leftVideo: video, leftAudio: audio, rightVideo, rightAudio };
}

for (const [label, removeMethod] of [
  ["Delete", "deleteNow"],
  ["Ripple Delete", "rippleDeleteNow"]
]) {
  test(label + " of one unlinked split-audio segment restores only its matching video segment", () => {
    const fixture = makeLinkedPair();
    const { sandbox, videoTrack, audioTrack, leftVideo, leftAudio, rightVideo, rightAudio } = fixture;

    assert.equal(leftAudio.sourceVideoClipId, leftVideo.id);
    assert.equal(rightAudio.sourceVideoClipId, rightVideo.id);
    assert.equal(leftAudio.audioSplitGroupId, rightAudio.audioSplitGroupId,
      "split segments intentionally retain a common source group");
    assert.notEqual(leftAudio.avLinkId, rightAudio.avLinkId,
      "each split segment must have its own A/V pair identity");

    assert.equal(sandbox.unlinkNow(rightAudio.avLinkId), true);
    sandbox.AppState.selection = { type: "clip", id: rightAudio.id };
    sandbox[removeMethod]();

    assert.equal(audioTrack.clips.includes(rightAudio), false, "the selected detached audio segment is removed");
    assert.equal(videoTrack.clips.includes(rightVideo), true, "unlinking lets the video segment remain");
    assert.equal(audioTrack.clips.includes(leftAudio), true, "the sibling audio segment remains");
    assert.equal(leftVideo.audioMutedBySplit, true, "the sibling video remains muted because its own audio still exists");
    assert.equal(rightVideo.audioMutedBySplit, false,
      "the matching video segment must resume its embedded audio even while sibling audio remains in the source group");
    assert.equal(rightVideo.audioSplitGroupId, null, "the restored segment leaves the old source group");
    assert.equal(rightVideo.avLinkEnabled, false, "the deleted segment's stale A/V link is cleared");
  });
}

test("re-detaching a split video segment is not blocked by another segment's detached audio", async () => {
  const fixture = makeLinkedPair();
  const { sandbox, videoTrack, audioTrack, leftAudio, rightVideo, rightAudio } = fixture;

  assert.equal(sandbox.unlinkNow(rightAudio.avLinkId), true);
  sandbox.AppState.selection = { type: "clip", id: rightAudio.id };
  sandbox.deleteNow();

  assert.equal(rightVideo.audioMutedBySplit, false);
  const newAudioTrack = {
    id: "A2",
    kind: "audio",
    locked: false,
    muted: false,
    hidden: false,
    volume: 1,
    clips: []
  };
  sandbox.project.tracks.push(newAudioTrack);
  sandbox.getAvailableAudioTrack = () => newAudioTrack;
  vm.runInContext(createSeparatedAudio + "\n" + detachSelectedAudio + "\n" +
    "globalThis.detachNow = splitVideoAudioForSelectedClip;\n",
    sandbox,
    { filename: "audio-detach-handler-test.js" }
  );

  sandbox.AppState.selection = { type: "clip", id: rightVideo.id };
  await sandbox.detachNow();

  assert.equal(newAudioTrack.clips.length, 1, "a new detached audio clip is created for the selected video segment");
  assert.equal(newAudioTrack.clips[0].sourceVideoClipId, rightVideo.id);
  assert.equal(newAudioTrack.clips[0].audioSplitGroupId, rightVideo.audioSplitGroupId);
  assert.equal(rightVideo.audioMutedBySplit, true);
  assert.equal(audioTrack.clips.includes(leftAudio), true, "the other segment remains untouched");
  assert.equal(videoTrack.clips.includes(rightVideo), true);
  assert.ok(sandbox.messages.some(message => message[0] === "notification.audio.detachedToTrack"),
    "the command must report successful detachment rather than 'already detached'");
});

test("deleting a still-linked detached audio clip deletes its video partner but preserves other split pairs", () => {
  const fixture = makeLinkedPair();
  const { sandbox, videoTrack, audioTrack, leftVideo, leftAudio, rightVideo, rightAudio } = fixture;

  sandbox.AppState.selection = { type: "clip", id: rightAudio.id };
  sandbox.deleteNow();

  assert.equal(audioTrack.clips.includes(rightAudio), false);
  assert.equal(videoTrack.clips.includes(rightVideo), false);
  assert.equal(audioTrack.clips.includes(leftAudio), true);
  assert.equal(videoTrack.clips.includes(leftVideo), true);
  assert.equal(leftVideo.audioMutedBySplit, true);
  assert.equal(sandbox.messages.at(-1)[0], "notification.clip.linkedPairDeleted");
});

test("legacy audio clips without pair IDs are matched only to an identical split segment", () => {
  const videoA = {
    id: "video-a", mediaId: "media-1", trackId: "V1", timelineStart: 0,
    duration: 5, sourceIn: 0, sourceOut: 5, audioSplitGroupId: "legacy-group",
    audioMutedBySplit: true, audioOnlyFromVideo: false
  };
  const videoB = {
    id: "video-b", mediaId: "media-1", trackId: "V1", timelineStart: 5,
    duration: 5, sourceIn: 5, sourceOut: 10, audioSplitGroupId: "legacy-group",
    audioMutedBySplit: true, audioOnlyFromVideo: false
  };
  const oldAudioA = {
    id: "old-audio-a", mediaId: "media-1", trackId: "A1", timelineStart: 0,
    duration: 5, sourceIn: 0, sourceOut: 5, audioSplitGroupId: "legacy-group",
    audioOnlyFromVideo: true
  };
  const sandbox = makeSandbox([
    { id: "V1", kind: "video", clips: [videoA, videoB] },
    { id: "A1", kind: "audio", clips: [oldAudioA] }
  ]);
  sandbox.videoA = videoA;
  sandbox.videoB = videoB;
  vm.runInContext(
    "globalThis.legacyMatchA = hasSeparatedAudioForVideo(videoA);\n" +
    "globalThis.legacyMatchB = hasSeparatedAudioForVideo(videoB);\n",
    sandbox
  );
  assert.equal(sandbox.legacyMatchA, true);
  assert.equal(sandbox.legacyMatchB, false,
    "a sibling fragment with the same source group is not the same detached audio clip");
});
