# Montazhnaya Beta 3.6.45 — Stage 4: структурированные ошибки Electron IPC

**Дата:** 4 ноября 2026 г.
**Основа:** Localization Stage 3
**Область:** ошибки, возвращаемые главным процессом Electron через IPC.

## Итог

Все 19 каналов `ipcMain.handle` теперь регистрируются через общий обработчик `registerStructuredIpcHandler`. На границе IPC ошибки преобразуются в стабильный машинно-читаемый контракт:

```js
{
  status: "error",
  error: {
    code: "EXPORT_VALIDATION_FAILED",
    key: "error.export.validationFailed",
    params: {},
    retryable: true
  }
}
```

Главный процесс больше не передаёт пользователю готовую русскую/английскую фразу через IPC. Старые внутренние обработчики пока могут создавать `Error` и возвращать временную legacy-форму `{ status: "error", message }`, но общий IPC boundary нормализует её и удаляет `message` до отправки renderer-процессу. Неизвестные исключения также перехватываются общей границей.

## Что сделано

1. Создан `electron/ipc-errors.cjs` — единый реестр кодов, ключей, правил классификации и fallback-ключей для каналов.
2. Все 19 IPC-регистраций в `electron/main.cjs`, включая `ui:set-locale`, переведены на `registerStructuredIpcHandler`.
3. Добавлена нормализация legacy error-ответов и исключений; сохраняются дополнительные безопасные поля ответов, например флаги доступности кодеков.
4. Добавлена проверка и ограничение параметров: разрешены только простые строки (до 240 символов), конечные числа и логические значения. Объекты, массивы, `NaN` и потенциально неограниченные значения не пересылаются.
5. Добавлены 30 постоянных ключей ошибок с парой русская исходная формулировка / английский эталон в `src/renderer/locales/notifications.js`.
6. `electron/preload.cjs` получает язык и семантические каталоги через `setUiLocale`, форматирует структурированную ошибку через `formatSemanticMessage` и добавляет локализованное поле `message` только как слой обратной совместимости для существующих renderer-вызовов.
7. Вызовы IPC из preload централизованы через `invokeIpc`; только сама функция-обёртка обращается к `ipcRenderer.invoke`.
8. Добавлены регрессионные тесты для всех ключей, каналов, безопасных параметров, классификации типовых ошибок, отсутствия raw message в IPC-ответе и фактического разрешения русской/английской fallback-фразы в preload.

## Реестр ключей

Всего добавлено **30** ключей. Основные группы:

- Безопасность и язык: `error.ipc.untrustedRequest`, `error.locale.syncFailed`.
- Общий fallback: `error.operation.failed`.
- Носители и анализ: `error.media.stageFailed`, `error.media.inspectFailed`, `error.media.invalidFile`, `error.media.probeFailed`.
- Экспорт: `error.export.capabilitiesFailed`, `error.export.beginFailed`, `error.export.writeFrameFailed`, `error.export.startFailed`, `error.export.prepareSourceFramesFailed`, `error.export.readSourceFrameFailed`, `error.export.finishFailed`, `error.export.cancelFailed`, `error.export.validationFailed`, `error.export.sessionInvalid`, `error.export.busy`.
- Аудио: `error.audio.extractFailed`, `error.audio.inspectFailed`, `error.audio.prepareFailed`, `error.audio.trackMissing`.
- Системные инструменты: `error.tool.ffmpegMissing`, `error.tool.ffprobeMissing`, `error.tool.notFound`, `error.process.timeout`, `error.process.permissionDenied`.
- Диск и кадр: `error.storage.insufficientSpace`, `error.frame.saveFailed`.
- Диагностика: `error.diagnostics.failed`.

У каждой записи есть отдельный стабильный `code` (например, `EXPORT_VALIDATION_FAILED`) и признак `retryable`. Тексты не используются как API-идентификаторы.

## Как устроен fallback

Главный процесс получает из renderer текущую локаль, локальный семантический пакет и английский fallback. Preload сохраняет эти данные в изолированном контексте. При ответе `{ status: "error", error: ... }` он ищет `error.key` в выбранном языке; если записи нет, использует английский пакет.

Для русского и английского 30 новых ошибок готовы локально. Для остальных 34 preview-локалей новые сообщения пока получают английскую fallback-формулировку. Русский текст не должен протекать в интерфейс при переключении на эти языки. Перевод на каждый из 34 языков — отдельная языковая работа, не часть данного технического этапа.

## Проверки

| Проверка | Результат |
|---|---:|
| IPC-каналы через общую границу | 19/19 |
| Стабильные error keys | 30 |
| Стабильные error codes | 30 |
| Прямые регистрации `ipcMain.handle` в `main.cjs` вне boundary | 0 |
| Прямые `ipcRenderer.invoke` в preload вне invoke-обёртки | 0 |
| Raw `message` в нормализованном main-process error payload | 0 |
| Неизвестные/пустые каталожные ключи | 0 |
| Полный `npm test` | **351/351 PASS** |
| `npm run qa:locales` | **PASS** |
| CSP SHA-256 | совпадает, inline renderer не менялся |

Проверки выполнены в Linux-среде исходного проекта. Синтаксис `electron/main.cjs`, `electron/preload.cjs`, `electron/ipc-errors.cjs` и каталога уведомлений проверен через `node --check`.

## Ограничения и следующий шаг

- Это source-level реализация; Electron GUI не запускался на Windows, Setup/Portable не собирались.
- Внутренние функции main process пока могут формировать подробные диагностические `Error.message` для локальных логов. Эти строки не проходят через IPC как пользовательский текст: внешний контракт нормализуется на общей границе. Следующий технический проход может постепенно заменить внутренние `throw new Error(...)` на типизированные ошибки в наиболее частых сценариях, чтобы убрать зависимость классификатора от старых формулировок.
- Renderer продолжает получать локализованное compatibility-поле `message`, чтобы не ломать старые обработчики. Новые renderer-компоненты должны использовать `response.error.key` и `response.error.params` напрямую; после миграции legacy-поле можно удалить.
- 34 preview-локали требуют отдельного перевода этих новых текстов и проверки носителями языка.

## Изменённые основные файлы

- `electron/ipc-errors.cjs` (новый)
- `electron/main.cjs`
- `electron/preload.cjs`
- `src/renderer/locales/notifications.js`
- `tests/electron-ipc-errors.test.cjs` (новый)
- обновлены тесты IPC и локализации, `CHANGELOG.md`
- `qa/electron-ipc-error-contract-stage4.json` (структурированный отчёт)
