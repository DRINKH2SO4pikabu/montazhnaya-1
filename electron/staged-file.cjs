"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const MAX_STAGED_CHUNK_BYTES = 8 * 1024 * 1024;
const ALLOWED_MEDIA_EXTENSIONS = new Set([
  ".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".mpeg", ".mpg",
  ".wmv", ".ts", ".mts", ".m2ts", ".flv", ".3gp", ".ogv", ".mp3",
  ".wav", ".ogg", ".m4a", ".aac", ".flac", ".mp4v"
]);

function getSafeExtension(fileName) {
  const extension = path.extname(String(fileName || "").split(/[\\/]/).pop()).toLowerCase();
  return ALLOWED_MEDIA_EXTENSIONS.has(extension) ? extension : ".media";
}

function toChunkBuffer(value) {
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  throw new Error("Фрагмент файла должен передаваться как бинарные данные.");
}

function createStagedFileManager(options = {}) {
  const fsApi = options.fs || fs;
  const tempRoot = options.tempRoot || os.tmpdir();
  const uuid = options.randomUUID || randomUUID;
  const pending = new Map();
  const ready = new Map();

  async function begin(ownerId, request) {
    if (!Number.isInteger(ownerId) || ownerId < 0) throw new Error("Некорректный владелец операции загрузки файла.");
    if (!request || typeof request !== "object" || Array.isArray(request) ||
        !Number.isSafeInteger(request.fileSize) || request.fileSize < 1) {
      throw new Error("Не удалось определить корректный размер исходного файла.");
    }
    const uploadId = uuid();
    const directory = await fsApi.mkdtemp(path.join(tempRoot, "montazhnaya-source-stage-"));
    const filePath = path.join(directory, `source${getSafeExtension(request.fileName)}`);
    let handle;
    try {
      handle = await fsApi.open(filePath, "wx");
      pending.set(uploadId, {
        ownerId,
        expectedBytes: request.fileSize,
        bytesWritten: 0,
        nextChunkIndex: 0,
        directory,
        filePath,
        handle
      });
      return { status: "ready", uploadId, chunkBytes: MAX_STAGED_CHUNK_BYTES };
    } catch (error) {
      try { await handle?.close(); } catch (_) {}
      try { await fsApi.rm(directory, { recursive: true, force: true }); } catch (_) {}
      throw error;
    }
  }

  function getPending(ownerId, uploadId) {
    if (typeof uploadId !== "string" || !uploadId) throw new Error("Некорректный идентификатор временной загрузки.");
    const item = pending.get(uploadId);
    if (!item || item.ownerId !== ownerId) throw new Error("Временная загрузка не найдена или принадлежит другому окну.");
    return item;
  }

  async function write(ownerId, request) {
    const item = getPending(ownerId, request && request.uploadId);
    if (!Number.isInteger(request.chunkIndex) || request.chunkIndex !== item.nextChunkIndex) {
      throw new Error(`Ожидался фрагмент ${item.nextChunkIndex}, получен ${request.chunkIndex}.`);
    }
    const buffer = toChunkBuffer(request.chunkData);
    if (buffer.length < 1 || buffer.length > MAX_STAGED_CHUNK_BYTES) {
      throw new Error(`Размер фрагмента должен быть от 1 байта до ${MAX_STAGED_CHUNK_BYTES} байт.`);
    }
    if (item.bytesWritten + buffer.length > item.expectedBytes) {
      throw new Error("Передано больше данных, чем заявленный размер исходного файла.");
    }

    let written = 0;
    while (written < buffer.length) {
      const result = await item.handle.write(buffer, written, buffer.length - written, item.bytesWritten + written);
      if (!result.bytesWritten) throw new Error("Не удалось записать очередной фрагмент исходного файла на диск.");
      written += result.bytesWritten;
    }
    item.bytesWritten += written;
    item.nextChunkIndex++;
    return { status: "success", bytesWritten: item.bytesWritten, nextChunkIndex: item.nextChunkIndex };
  }

  async function finish(ownerId, request) {
    const uploadId = request && request.uploadId;
    const item = getPending(ownerId, uploadId);
    if (item.bytesWritten !== item.expectedBytes) {
      throw new Error(`Исходный файл передан не полностью: ${item.bytesWritten} из ${item.expectedBytes} байт.`);
    }
    await item.handle.sync();
    await item.handle.close();
    pending.delete(uploadId);
    let stat;
    try {
      stat = await fsApi.stat(item.filePath);
      if (!stat.isFile() || stat.size !== item.expectedBytes) {
        throw new Error("Проверка временного файла после записи не пройдена.");
      }
    } catch (error) {
      try { await fsApi.rm(item.directory, { recursive: true, force: true }); } catch (_) {}
      throw error;
    }
    ready.set(uploadId, { ownerId, directory: item.directory, filePath: item.filePath, size: stat.size });
    return { status: "ready", uploadId, size: stat.size };
  }

  function getPath(ownerId, uploadId) {
    const item = ready.get(uploadId);
    if (!item || item.ownerId !== ownerId) throw new Error("Подготовленный временный файл не найден или принадлежит другому окну.");
    return item.filePath;
  }

  async function cleanup(ownerId, uploadId) {
    const pendingItem = pending.get(uploadId);
    if (pendingItem && pendingItem.ownerId === ownerId) {
      pending.delete(uploadId);
      try { await pendingItem.handle.close(); } catch (_) {}
      try { await fsApi.rm(pendingItem.directory, { recursive: true, force: true }); } catch (_) {}
      return { status: "cleaned" };
    }
    const readyItem = ready.get(uploadId);
    if (readyItem && readyItem.ownerId === ownerId) {
      ready.delete(uploadId);
      try { await fsApi.rm(readyItem.directory, { recursive: true, force: true }); } catch (_) {}
      return { status: "cleaned" };
    }
    return { status: "not-found" };
  }

  async function cleanupOwner(ownerId) {
    const ids = [];
    for (const [id, item] of pending) if (item.ownerId === ownerId) ids.push(id);
    for (const [id, item] of ready) if (item.ownerId === ownerId) ids.push(id);
    for (const id of ids) await cleanup(ownerId, id);
    return ids.length;
  }

  return {
    begin,
    write,
    finish,
    getPath,
    cleanup,
    cleanupOwner,
    get pendingCount() { return pending.size; },
    get readyCount() { return ready.size; }
  };
}

module.exports = { MAX_STAGED_CHUNK_BYTES, createStagedFileManager, getSafeExtension };
