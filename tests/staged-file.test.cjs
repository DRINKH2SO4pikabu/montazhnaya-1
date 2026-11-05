"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { MAX_STAGED_CHUNK_BYTES, createStagedFileManager } = require("../electron/staged-file.cjs");

function makeManager(tempRoot) {
  let counter = 0;
  return createStagedFileManager({
    tempRoot,
    randomUUID: () => `upload-${++counter}`
  });
}

test("staged file transfer writes ordered bounded chunks and verifies final size", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-staged-test-"));
  const manager = makeManager(tempRoot);
  try {
    const content = Buffer.from("source-media-chunked-payload");
    const started = await manager.begin(12, { fileName: "clip.mp4", fileSize: content.length });
    assert.equal(started.status, "ready");
    assert.equal(started.chunkBytes, MAX_STAGED_CHUNK_BYTES);
    const first = await manager.write(12, { uploadId: started.uploadId, chunkIndex: 0, chunkData: content.subarray(0, 10) });
    assert.equal(first.bytesWritten, 10);
    await assert.rejects(
      manager.write(12, { uploadId: started.uploadId, chunkIndex: 2, chunkData: content.subarray(10) }),
      /Ожидался фрагмент 1/
    );
    const second = await manager.write(12, { uploadId: started.uploadId, chunkIndex: 1, chunkData: content.subarray(10) });
    assert.equal(second.bytesWritten, content.length);
    const finished = await manager.finish(12, { uploadId: started.uploadId });
    assert.equal(finished.size, content.length);
    const filePath = manager.getPath(12, started.uploadId);
    assert.deepEqual(await fs.readFile(filePath), content);
    assert.throws(() => manager.getPath(99, started.uploadId), /принадлежит другому окну/);
    await manager.cleanup(12, started.uploadId);
    await assert.rejects(fs.stat(filePath), { code: "ENOENT" });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("staged transfer accepts source files larger than the former 128 MiB cap", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-staged-large-test-"));
  const manager = makeManager(tempRoot);
  const expectedSize = 128 * 1024 * 1024 + 1024 * 1024;
  try {
    const started = await manager.begin(7, { fileName: "large.mov", fileSize: expectedSize });
    const chunk = Buffer.alloc(MAX_STAGED_CHUNK_BYTES, 0x5a);
    let index = 0;
    let total = 0;
    while (total < expectedSize) {
      const amount = Math.min(chunk.length, expectedSize - total);
      const payload = amount === chunk.length ? chunk : chunk.subarray(0, amount);
      const result = await manager.write(7, { uploadId: started.uploadId, chunkIndex: index++, chunkData: payload });
      total = result.bytesWritten;
    }
    const finish = await manager.finish(7, { uploadId: started.uploadId });
    assert.equal(finish.size, expectedSize);
    const stat = await fs.stat(manager.getPath(7, started.uploadId));
    assert.equal(stat.size, expectedSize);
    await manager.cleanup(7, started.uploadId);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("staged file upload enforces per-chunk bound and owner isolation", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-staged-guards-test-"));
  const manager = makeManager(tempRoot);
  try {
    const started = await manager.begin(4, { fileName: "clip.mkv", fileSize: 10 });
    await assert.rejects(manager.write(5, { uploadId: started.uploadId, chunkIndex: 0, chunkData: Buffer.from("x") }), /принадлежит другому окну/);
    await assert.rejects(manager.write(4, { uploadId: started.uploadId, chunkIndex: 0, chunkData: Buffer.alloc(MAX_STAGED_CHUNK_BYTES + 1) }), /Размер фрагмента/);
    await manager.cleanup(4, started.uploadId);
    assert.equal(manager.pendingCount, 0);
    assert.equal(manager.readyCount, 0);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
