#!/usr/bin/env node
'use strict';

/**
 * Generate disposable, synthetic FFmpeg test clips for manual export validation.
 * Inputs are FFmpeg lavfi testsrc2 and sine generators; no external media is used.
 * Generated files are ignored by git and should not be included in releases.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function parseArgs(argv) {
  const result = { outputDir: path.join(__dirname, '..', 'tests', 'fixtures') };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--output-dir') {
      if (!argv[index + 1]) throw new Error('--output-dir requires a path');
      result.outputDir = path.resolve(argv[++index]);
    } else if (argv[index] === '--help' || argv[index] === '-h') {
      result.help = true;
      return result;
    } else {
      throw new Error(`Unknown argument: ${argv[index]}`);
    }
  }
  return result;
}

function findFfmpeg() {
  const executable = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const probe = spawnSync(executable, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (probe.error || probe.status !== 0) {
    throw new Error(`FFmpeg is unavailable. Set FFMPEG_PATH or add FFmpeg to PATH. ${probe.error?.message || probe.stderr || ''}`);
  }
  return executable;
}

function generate(ffmpeg, outputDir, fps) {
  const output = path.join(outputDir, `synthetic-${fps}fps-audiomarkers.mp4`);
  const audioFilter = "volume='if(between(t,0.20,0.40)+between(t,3.50,3.70)+between(t,6.80,7.00),0.6,0)':eval=frame";
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', `testsrc2=size=640x360:rate=${fps}:duration=7`,
    '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000:duration=7',
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', `fps=${fps}`,
    '-af', audioFilter,
    '-t', '7',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-ac', '1',
    '-movflags', '+faststart', output
  ];
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error(`FFmpeg failed to generate ${path.basename(output)}: ${result.error?.message || result.stderr || 'unknown error'}`);
  }
  return output;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node tools/generate-synthetic-fixtures.cjs [--output-dir PATH]');
    process.exit(0);
  }
  fs.mkdirSync(args.outputDir, { recursive: true });
  const ffmpeg = findFfmpeg();
  for (const fps of [25, 30]) {
    const output = generate(ffmpeg, args.outputDir, fps);
    console.log(`Generated ${output}`);
  }
} catch (error) {
  console.error(error.message || String(error));
  process.exitCode = 1;
}
