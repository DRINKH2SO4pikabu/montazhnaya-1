"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { startManagedProcess, parseProgressBlock, timeToSeconds } = require("../electron/managed-process.cjs");
const process = require("node:process");

test("parses FFmpeg progress blocks and media time", () => {
  assert.deepEqual(parseProgressBlock("frame=30\nout_time=00:00:01.000\nprogress=continue\n"), {
    frame: "30", out_time: "00:00:01.000", progress: "continue"
  });
  assert.equal(timeToSeconds("00:01:02.500"), 62.5);
  assert.equal(timeToSeconds("N/A"), null);
});

test("managed process reports progress and resolves successful exit", async () => {
  const reports = [];
  const script = "process.stdout.write('frame=10\\nout_time=00:00:01.000\\nprogress=continue\\n');";
  const job = startManagedProcess(process.execPath, ["-e", script], {
    timeoutMs: 5000,
    onProgress: value => reports.push(value)
  });
  const result = await job.promise;
  assert.equal(result.code, 0);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].frame, "10");
  assert.equal(reports[0].progress, "continue");
});

test("managed process accepts graceful cancellation and waits for process close", async () => {
  const script = "process.stdin.setEncoding('utf8'); process.stdin.on('data', d => { if (d.includes('q')) process.exit(0); }); setInterval(() => {}, 1000);";
  const job = startManagedProcess(process.execPath, ["-e", script], { timeoutMs: 5000, killGraceMs: 1000 });
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(job.cancel(), true);
  await assert.rejects(job.promise, error => error.code === "PROCESS_CANCELLED");
  assert.equal(job.settled, true);
});


test("managed process writes binary stdin with awaited backpressure and closes the input", async () => {
  const reports = [];
  const script = "let n=0; process.stdin.on('data', chunk => { n += chunk.length; }); process.stdin.on('end', () => process.stdout.write('frame='+n+'\\nprogress=end\\n'));";
  const job = startManagedProcess(process.execPath, ["-e", script], {
    timeoutMs: 5000, stdinMode: "binary", onProgress: value => reports.push(value)
  });
  const first = Buffer.from([0, 1, 2, 255]);
  const second = Buffer.alloc(128 * 1024, 7);
  await job.writeInput(first);
  await job.writeInput(second);
  await job.endInput();
  const result = await job.promise;
  assert.equal(result.code, 0);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].frame, String(first.length + second.length));
  assert.equal(reports[0].progress, "end");
  assert.equal(job.settled, true);
});

test("binary stdin cancellation never writes a textual q marker into the media stream", async () => {
  const script = "process.stdin.on('data', () => {}); setInterval(() => {}, 1000);";
  const job = startManagedProcess(process.execPath, ["-e", script], { timeoutMs: 5000, killGraceMs: 500, stdinMode: "binary" });
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(job.cancel(), true);
  await assert.rejects(job.promise, error => error.code === "PROCESS_CANCELLED");
  assert.equal(job.settled, true);
});
