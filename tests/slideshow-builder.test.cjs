const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'index.html'), 'utf8');

function loadHelper(name, globals = {}) {
  const match = source.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'm'));
  assert.ok(match, `${name} should be defined in renderer`);
  const sandbox = { ...globals };
  vm.runInNewContext(`${match[0]}\nthis.helper = ${name};`, sandbox);
  return sandbox.helper;
}

test('equal slideshow mode ends exactly on target frame duration, accounting for crossfades', () => {
  const plan = loadHelper('calculateSlideshowLayout')({
    count: 12, fps: 30, mode: 'equal', targetDuration: 180,
    transitionMode: 'crossfade', transitionDuration: 0.65
  });
  assert.equal(plan.items.length, 12);
  assert.equal(plan.targetFrames, 5400);
  const last = plan.items.at(-1);
  assert.equal(last.offsetFrames + last.durationFrames, plan.targetFrames);
  for (let i = 1; i < plan.items.length; i++) {
    const previous = plan.items[i - 1];
    assert.equal(previous.offsetFrames + previous.durationFrames - plan.items[i].offsetFrames, plan.transitionFrames);
  }
  assert.equal(plan.transitionFrames, 20);
});

test('equal slideshow without transitions has no overlap and matches soundtrack duration', () => {
  const plan = loadHelper('calculateSlideshowLayout')({
    count: 7, fps: 25, mode: 'equal', targetDuration: 123.4,
    transitionMode: 'none', transitionDuration: 0.7
  });
  assert.equal(plan.transitionFrames, 0);
  assert.equal(plan.items.at(-1).offsetFrames + plan.items.at(-1).durationFrames, plan.targetFrames);
  for (let i = 1; i < plan.items.length; i++) {
    assert.equal(plan.items[i - 1].offsetFrames + plan.items[i - 1].durationFrames, plan.items[i].offsetFrames);
  }
});

test('fixed-time mode keeps all photos at the same duration and calculates total length after overlaps', () => {
  const plan = loadHelper('calculateSlideshowLayout')({
    count: 10, fps: 30, mode: 'fixed', fixedDuration: 8,
    targetDuration: 240, transitionMode: 'crossfade', transitionDuration: 0.65
  });
  assert.equal(plan.items.every(item => item.durationFrames === 240), true);
  assert.equal(plan.targetFrames, 10 * 240 - 9 * 20);
  assert.equal(plan.items.at(-1).offsetFrames + plan.items.at(-1).durationFrames, plan.targetFrames);
});

test('range mode respects selected length and requested start is separate from plan offsets', () => {
  const plan = loadHelper('calculateSlideshowLayout')({
    count: 5, fps: 30, mode: 'range', targetDuration: 47.3,
    transitionMode: 'crossfade', transitionDuration: 0.5
  });
  assert.equal(plan.targetFrames, Math.round(47.3 * 30));
  assert.equal(plan.items.at(-1).offsetFrames + plan.items.at(-1).durationFrames, plan.targetFrames);
});

test('too-short section or invalid number of photos is rejected clearly', () => {
  const planner = loadHelper('calculateSlideshowLayout');
  assert.throws(() => planner({ count: 0, fps: 30, mode: 'equal', targetDuration: 10 }), /фотографию/i);
  assert.throws(() => planner({ count: 40, fps: 30, mode: 'equal', targetDuration: 1 }), /слишком короткий/i);
});

test('Ken Burns motion is smooth and differs at clip start and end', () => {
  const motion = loadHelper('getSlideshowMotionState');
  const start = motion('zoom-in', 0);
  const middle = motion('zoom-in', 0.5);
  const end = motion('zoom-in', 1);
  assert.equal(start.scale, 1);
  assert.ok(middle.scale > start.scale && middle.scale < end.scale);
  assert.equal(end.scale, 1.1);
  const panStart = motion('pan-left', 0);
  const panEnd = motion('pan-left', 1);
  assert.ok(panStart.shiftX > panEnd.shiftX);
});

test('renderer exposes slideshow builder, export-shared motion, and persistent motion properties', () => {
  assert.match(source, /data-action="create-slideshow"/);
  assert.match(source, /function openSlideshowBuilder\(/);
  assert.match(source, /function createSlideshowFromSettings\(/);
  assert.match(source, /const motion = getSlideshowMotionState\(/);
  assert.match(source, /motionPreset: c\.motionPreset \|\| "none"/);
  assert.match(source, /motionPreset: \["none", "zoom-in", "zoom-out", "pan-left", "pan-right", "pan-up", "pan-down"\]/);
});

test('short equal-length slideshow automatically caps excessive crossfade transitions', () => {
  const plan = loadHelper('calculateSlideshowLayout')({
    count: 12, fps: 30, mode: 'equal', targetDuration: 5,
    transitionMode: 'crossfade', transitionDuration: 3
  });
  assert.equal(plan.items.at(-1).offsetFrames + plan.items.at(-1).durationFrames, plan.targetFrames);
  assert.ok(plan.transitionFrames <= Math.floor(plan.targetFrames / (plan.count + 1)));
  assert.ok(plan.items.every(item => item.durationFrames > plan.transitionFrames));
  for (let i = 1; i < plan.items.length; i++) {
    const previous = plan.items[i - 1];
    assert.equal(previous.offsetFrames + previous.durationFrames - plan.items[i].offsetFrames, plan.transitionFrames);
  }
});

test('very short fixed-duration photos retain at least two frames for independent viewing', () => {
  const plan = loadHelper('calculateSlideshowLayout')({
    count: 8, fps: 30, mode: 'fixed', fixedDuration: 0.1,
    transitionMode: 'crossfade', transitionDuration: 3
  });
  assert.equal(plan.items.every(item => item.durationFrames === 3), true);
  assert.ok(plan.transitionFrames <= 1);
  assert.equal(plan.targetFrames, 8 * 3 - 7 * plan.transitionFrames);
});

test('equal and range layouts retain exact frame counts for a range of inputs', () => {
  const planner = loadHelper('calculateSlideshowLayout');
  for (const fps of [24, 25, 30, 50, 60]) {
    for (const count of [1, 2, 5, 12, 30]) {
      const targetFrames = Math.max(count * Math.ceil(0.05 * fps), fps * 8);
      const plan = planner({
        count, fps, mode: 'equal', targetDuration: targetFrames / fps,
        transitionMode: 'crossfade', transitionDuration: 0.65
      });
      const last = plan.items.at(-1);
      assert.equal(last.offsetFrames + last.durationFrames, plan.targetFrames);
      assert.equal(plan.targetFrames, targetFrames);
      for (let i = 1; i < plan.items.length; i++) {
        const previous = plan.items[i - 1];
        assert.equal(previous.offsetFrames + previous.durationFrames - plan.items[i].offsetFrames, plan.transitionFrames);
      }
    }
  }
});

test('audio choices reject an imported music file whose duration is unknown or zero', () => {
  const getChoice = loadHelper('getSlideshowAudioChoice', {
    project: { tracks: [] },
    getMedia: id => ({ id, kind: 'audio', missing: false, duration: 0, name: 'silent-metadata.wav' })
  });
  assert.equal(getChoice('media:bad-audio'), null);
});

test('user-facing and package versions are aligned for the reviewed build', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'));
  assert.equal(pkg.version, '3.6.45');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.match(source, /<title>Монтажная beta 3\.6\.45/);
  assert.match(source, /brand-name[^\n]*beta 3\.6\.45/);
  assert.match(source, /about-modal-version[^>]*>beta 3\.6\.45/);
});

test('muted or zero-volume timeline audio is not treated as a valid soundtrack source', () => {
  const getChoice = loadHelper('getSlideshowAudioChoice', {
    project: { tracks: [{
      id: 'A1', kind: 'audio', muted: true, volume: 1,
      clips: [{ id: 'clip-1', mediaId: 'audio-1', duration: 30, timelineStart: 0, volume: 1, name: 'muted.wav' }]
    }] },
    getMedia: id => ({ id, kind: 'audio', missing: false, duration: 30, name: 'muted.wav' })
  });
  assert.equal(getChoice('clip:clip-1'), null);
});

test('slideshow builder uses only visible unlocked destination tracks and prefers the timeline image source', () => {
  assert.match(source, /const videoTracks = project\.tracks\.filter\(t => t\.kind === "video" && !t\.locked && !t\.hidden\)/);
  assert.match(source, /videoTracks\.find\(t => canPlaceInterval\(t, initialStart, preferredDuration\)\)\s*\|\|\s*videoTracks\[0\]/);
  assert.match(source, /track\.muted \|\| Number\(track\.volume == null \? 1 : track\.volume\) <= 0/);
});


test('slideshow timeline source follows clip start times and ignores non-image or missing media', () => {
  const media = {
    imageA: { id: 'imageA', name: 'first.jpg', kind: 'image' },
    imageB: { id: 'imageB', name: 'second.jpg', kind: 'image' },
    video: { id: 'video', name: 'video.mp4', kind: 'video' },
    missing: { id: 'missing', name: 'gone.jpg', kind: 'image', missing: true }
  };
  const track = { id: 'V1', kind: 'video', clips: [
    { id: 'clip-b', mediaId: 'imageB', timelineStart: 4, trackId: 'V1' },
    { id: 'clip-video', mediaId: 'video', timelineStart: 1, trackId: 'V1' },
    { id: 'clip-a', mediaId: 'imageA', timelineStart: 1, trackId: 'V1' },
    { id: 'clip-missing', mediaId: 'missing', timelineStart: 2, trackId: 'V1' }
  ] };
  const collect = loadHelper('collectSlideshowTimelineImages');
  const result = collect(track, id => media[id]);
  assert.deepEqual(Array.from(result, item => item.clip.id), ['clip-a', 'clip-b']);
  assert.deepEqual(Array.from(result, item => item.media.name), ['first.jpg', 'second.jpg']);
});

test('slideshow keeps timeline order by default and uses numeric filename order only when requested', () => {
  const normalize = loadHelper('normalizeSlideshowPhotoItems');
  const order = loadHelper('buildSlideshowPhotoOrder', { normalizeSlideshowPhotoItems: normalize });
  const photos = [
    { media: { id: 'm10', name: 'photo_10.jpg', kind: 'image' }, clip: { id: 'c10', timelineStart: 0 }, sourceTrackId: 'V1' },
    { media: { id: 'm2', name: 'photo_2.jpg', kind: 'image' }, clip: { id: 'c2', timelineStart: 5 }, sourceTrackId: 'V1' },
    { media: { id: 'm1', name: 'photo_1.jpg', kind: 'image' }, clip: { id: 'c1', timelineStart: 10 }, sourceTrackId: 'V1' }
  ];
  assert.deepEqual(Array.from(order(photos, 'import'), item => item.clip.id), ['c10', 'c2', 'c1']);
  assert.deepEqual(Array.from(order(photos, 'name-asc'), item => item.clip.id), ['c1', 'c2', 'c10']);
});

test('slideshow can reuse its source clips on the destination track without treating them as collisions', () => {
  const canPlace = loadHelper('canPlaceIntervalExcluding');
  const track = { locked: false, clips: [
    { id: 'photo-a', timelineStart: 0, duration: 6 },
    { id: 'photo-b', timelineStart: 5.5, duration: 6 },
    { id: 'other', timelineStart: 20, duration: 2 }
  ] };
  assert.equal(canPlace(track, 0, 12, ['photo-a', 'photo-b']), true);
  assert.equal(canPlace(track, 0, 22, ['photo-a', 'photo-b']), false);
});

test('slideshow builder offers timeline photos and reuses existing timeline clips instead of adding duplicate copies', () => {
  assert.match(source, /collectSlideshowTimelineImages\(track\)/);
  assert.match(source, /Фотографии брать из/);
  assert.match(source, /Существующие клипы будут перестроены без добавления копий/);
  assert.match(source, /if \(track\.kind === "video"\) track\.clips = track\.clips\.filter\(clip => !timelineClipIds\.has\(clip\.id\)\)/);
  assert.match(source, /videoTrack\.clips\.push\(\.\.\.photoClips\)/);
});


test('creating from timeline photos reuses the existing clips and does not create a second set', () => {
  const sourceTrack = { id: 'V1', kind: 'video', label: 'V1', title: 'Видео 1', locked: false, hidden: false, clips: [
    { id: 'photo-b', mediaId: 'media-b', trackId: 'V1', name: 'b.jpg', timelineStart: 5, duration: 2, sourceIn: 0, sourceOut: 2 },
    { id: 'photo-a', mediaId: 'media-a', trackId: 'V1', name: 'a.jpg', timelineStart: 1, duration: 2, sourceIn: 0, sourceOut: 2 }
  ] };
  const project = { fps: 30, tracks: [sourceTrack] };
  const sandbox = {
    project,
    window: { MontazhnayaI18n: { getLocale: () => "ru" } },
    Intl,
    AppState: { selection: { type: null, id: null }, playhead: 0 },
    DEFAULT_FPS: 30,
    getTrack: id => project.tracks.find(track => track.id === id),
    getSlideshowAudioChoice: () => ({ type: 'clip', duration: 8, start: 0, clip: { id: 'music-clip' } }),
    roundToFrame: value => Math.round(value * 30) / 30,
    frameDur: () => 1 / 30,
    shortTime: value => String(value),
    toast: () => {}, toastKey: () => {}, toastSourceOrFallback: () => {},
    uiText: value => String(value), uiNumber: value => String(value), uiCount: (_key, count) => String(count),
    console,
    History: { record: () => {} },
    Preview: { reconcileClipElements: () => {} },
    renderTimeline: () => {}, renderProperties: () => {}, updateTransportUI: () => {},
    updateTimeDisplay: () => {}, updatePreview: () => {}, zoomFit: () => {}, markDirty: () => {}
  };
  for (const helperName of ['normalizeSlideshowPhotoItems', 'calculateSlideshowLayout', 'canPlaceIntervalExcluding', 'chooseSlideshowMotion', 'slideshowFormatDuration']) {
    const match = source.match(new RegExp(`function ${helperName}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'm'));
    assert.ok(match, `${helperName} should be available`);
    vm.runInNewContext(match[0], sandbox);
  }
  const createMatch = source.match(/function createSlideshowFromSettings\(options\)\s*\{[\s\S]*?\n\}/m);
  assert.ok(createMatch, 'createSlideshowFromSettings should be available');
  vm.runInNewContext(`${createMatch[0]}\nthis.createSlideshow = createSlideshowFromSettings;`, sandbox);
  const mediaA = { id: 'media-a', name: 'a.jpg', kind: 'image' };
  const mediaB = { id: 'media-b', name: 'b.jpg', kind: 'image' };
  const result = sandbox.createSlideshow({
    images: [
      { media: mediaB, clip: sourceTrack.clips[0], sourceTrackId: 'V1', sourceIndex: 0 },
      { media: mediaA, clip: sourceTrack.clips[1], sourceTrackId: 'V1', sourceIndex: 1 }
    ],
    audioValue: 'clip:music-clip', mode: 'equal', startTime: 0,
    transitionMode: 'none', transitionDuration: 0, motionMode: 'none', fadeEnds: false,
    videoTrackId: 'V1'
  });
  assert.ok(result, 'slideshow should be created');
  assert.deepEqual(Array.from(result.photoClips, clip => clip.id), ['photo-a', 'photo-b']);
  assert.equal(sourceTrack.clips.length, 2, 'the track must contain no duplicated copies');
  assert.deepEqual(Array.from(sourceTrack.clips, clip => clip.id), ['photo-a', 'photo-b']);
  assert.deepEqual(Array.from(sourceTrack.clips, clip => clip.timelineStart), [0, 4]);
});


test('slideshow moves timeline photo clips to another selected video track without leaving the originals behind', () => {
  const sourceTrack = { id: 'V1', kind: 'video', label: 'V1', title: 'Видео 1', locked: false, hidden: false, clips: [
    { id: 'photo-2', mediaId: 'm2', trackId: 'V1', name: '2.jpg', timelineStart: 3, duration: 1, sourceIn: 0, sourceOut: 1 },
    { id: 'photo-1', mediaId: 'm1', trackId: 'V1', name: '1.jpg', timelineStart: 0, duration: 1, sourceIn: 0, sourceOut: 1 }
  ] };
  const destinationTrack = { id: 'V3', kind: 'video', label: 'V3', title: 'Видео 3', locked: false, hidden: false, clips: [] };
  const project = { fps: 30, tracks: [destinationTrack, sourceTrack] };
  const sandbox = {
    project, window: { MontazhnayaI18n: { getLocale: () => "ru" } }, Intl,
    AppState: { selection: { type: null, id: null }, playhead: 0 }, DEFAULT_FPS: 30,
    getTrack: id => project.tracks.find(track => track.id === id),
    getSlideshowAudioChoice: () => ({ type: 'clip', duration: 6, start: 0, clip: { id: 'music' } }),
    roundToFrame: value => Math.round(value * 30) / 30, frameDur: () => 1 / 30, shortTime: String,
    toast: () => {}, toastKey: () => {}, toastSourceOrFallback: () => {},
    uiText: value => String(value), uiNumber: value => String(value), uiCount: (_key, count) => String(count),
    console, History: { record: () => {} }, Preview: { reconcileClipElements: () => {} },
    renderTimeline: () => {}, renderProperties: () => {}, updateTransportUI: () => {}, updateTimeDisplay: () => {},
    updatePreview: () => {}, zoomFit: () => {}, markDirty: () => {}
  };
  for (const helperName of ['normalizeSlideshowPhotoItems', 'calculateSlideshowLayout', 'canPlaceIntervalExcluding', 'chooseSlideshowMotion', 'slideshowFormatDuration']) {
    const match = source.match(new RegExp(`function ${helperName}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'm'));
    assert.ok(match, `${helperName} should be available`);
    vm.runInNewContext(match[0], sandbox);
  }
  const createMatch = source.match(/function createSlideshowFromSettings\(options\)\s*\{[\s\S]*?\n\}/m);
  assert.ok(createMatch, 'createSlideshowFromSettings should be available');
  vm.runInNewContext(`${createMatch[0]}\nthis.createSlideshow = createSlideshowFromSettings;`, sandbox);
  const photos = sourceTrack.clips.map(clip => ({ media: { id: clip.mediaId, name: clip.name, kind: 'image' }, clip, sourceTrackId: 'V1' }));
  const result = sandbox.createSlideshow({
    images: photos, audioValue: 'clip:music', mode: 'equal', startTime: 0, transitionMode: 'none',
    transitionDuration: 0, motionMode: 'none', fadeEnds: false, videoTrackId: 'V3'
  });
  assert.ok(result, 'slideshow should be created on the selected destination');
  assert.equal(sourceTrack.clips.length, 0, 'source track must not retain duplicate originals');
  assert.equal(destinationTrack.clips.length, 2, 'destination must contain exactly the reused image clips');
  assert.deepEqual(Array.from(destinationTrack.clips, clip => clip.id), ['photo-1', 'photo-2']);
  assert.ok(destinationTrack.clips.every(clip => clip.trackId === 'V3'));
});
