# Dependency security review — Montazhnaya Beta 3.6.45 / Electron 45

**Дата проверки:** 3 ноября 2026 года
**Статус:** обновление Electron, extractor и корневого SRI lockfile выполнено; выпуск заблокирован до полного toolchain lockfile, сетевого npm audit и Windows QA.

## Executive summary

Electron обновлён с неподдерживаемой 37.10.3 до **45.2.1**. На дату проверки 45.2.1 — текущий стабильный выпуск ветки 45.x; Electron Releases указывает Chromium 156.0.8078.75 и встроенный Node.js 24.22.1. Поддержка ветки 45.x запланирована до 27 апреля 2027 года. См. [официальную страницу выпусков](https://releases.electronjs.org/) и [официальный график поддержки](https://www.electronjs.org/docs/latest/tutorial/electron-timelines).

Новый граф зависимостей закреплён в `package-lock.json`. В нём 13 npm-пакетов. **Все 13 записей имеют валидный SRI `integrity`**, включая Electron 45.2.1. SRI сверены по нескольким независимым публичным npm lock-файлам; это не заменяет загрузку архива с npm registry и проверку его хэша при установке.

`npm audit --audit-level=low` запущен повторно 3 ноября 2026 года и завершился с ошибкой `EAI_AGAIN registry.npmjs.org`. Следовательно, **нет достоверного результата полного npm audit**; статус всего dependency tree не может считаться «0 vulnerabilities».

## Изменения в проекте

| Компонент | Было | Стало | Причина |
|---|---:|---:|---|
| Electron | 37.10.3 | **45.2.1** | Переход с EOL-ветки на поддерживаемую stable-ветку |
| Node.js engine | `>=22.0.0` | `>=22.12.0` | Минимум нового Electron package/tooling |
| CI Node.js | 22 | **24** | Совместимость с актуальной веткой Electron и типами |
| `@electron/get` | старый graph | **5.1.0** | Текущая совместимая версия; содержит правку выбора недоступных платформ/архитектур |
| `@electron-internal/extract-zip` | отсутствовал/legacy graph | **1.0.8** | Актуальный совместимый Electron extractor с hardening для ZIP extraction |
| `undici` | отсутствовал/старый graph | **7.30.1** | Закрывает известные advisories осени 2026 года |

Изменён процесс установки Electron 42+:

1. `npm ci --ignore-scripts` устанавливает фиксированный граф без запуска lifecycle scripts зависимостей.
2. `npm run electron:install` отдельно скачивает runtime Electron.
3. `npm run electron:version` проверяет исполняемый файл Electron.

Это соответствует [официальной документации Electron по установке](https://www.electronjs.org/docs/latest/tutorial/installation) и [описанию изменения postinstall](https://www.electronjs.org/docs/latest/breaking-changes). Для runtime ZIP Electron использует опубликованный checksum manifest. Отсутствие SRI в npm lock для самого пакета Electron всё равно остаётся открытой задачей.

## Ручная сверка известных security advisories

### Electron 45.2.1

Проверены публичный список [Electron Security Advisories](https://github.com/electron/electron/security/advisories), карточка версии 45.2.1 в [Snyk](https://security.snyk.io/package/npm/electron) и агрегатор [OSV-backed NPMscan](https://npmscan.io/package/npm/electron). На дату проверки агрегатор указывает, что 45.2.1 не затронута 79 известными Electron advisories; Snyk также не показывает прямых известных проблем на 45.2.1. Это относится к самому Electron package и не заменяет анализ его зависимостей через npm audit.

### `undici` — обнаруженное и устранённое

Первичная фиксация 7.29.0 оказалась недостаточной после сверки более поздних advisory: версия 7.29.0 подвержена нескольким проблемам, исправленным в 7.30.1. Поэтому lockfile закреплён на **7.30.1**.

| Advisory | Severity | Затронутый диапазон 7.x | Исправление |
|---|---|---|---|
| GHSA-xjj6-f33q-929c — DoS при некорректном content-encoding | High | `<7.30.1` начиная с 7.18.0 | 7.30.1 |
| GHSA-4qv8-2p9j-2685 — неограниченная память EventSource | Moderate | `<7.30.1` | 7.30.1 |
| GHSA-f72v-6w45-q472 — обход SRI при регистронезависимом алгоритме | Moderate | `<7.30.1` начиная с 7.15.0 | 7.30.1 |
| GHSA-4w7w-5xrc-9h26 — cache poisoning/cross-user disclosure через cross-origin redirect | High | до версии исправления 7.30.1 | 7.30.1 |
| GHSA-2m5v-pch6-74hx — TLS options dropped in Agent | High | `<7.29.1` в ветке 7.x | 7.29.1; включено в 7.30.1 |
| GHSA-8436-99hf-9mmv — кеширование небезопасных HTTP методов | Low | `<7.29.1` | 7.29.1; включено в 7.30.1 |
| GHSA-55wc-3pg8-jfw6 — некорректная обработка ошибок decompress interceptor | Moderate | `<7.30.1` | 7.30.1 |
| GHSA-9fm3-97px-rjf6 — неограниченная очередь WebSocket PONG | Moderate | `<7.30.1` | 7.30.1 |
| GHSA-3wwx-pv8p-q78v — сбой WebSocket при permessage-deflate | Moderate | `<7.29.1` | 7.29.1; включено в 7.30.1 |

Источники: [advisories Undici](https://github.com/nodejs/undici/security/advisories), включая [content-encoding DoS](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c), [EventSource memory DoS](https://github.com/nodejs/undici/security/advisories/GHSA-4qv8-2p9j-2685), [SRI bypass](https://github.com/nodejs/undici/security/advisories/GHSA-f72v-6w45-q472), [cross-origin cache poisoning](https://github.com/nodejs/undici/security/advisories/GHSA-4w7w-5xrc-9h26), [TLS option handling in Agent](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx), [decompress interceptor DoS](https://github.com/nodejs/undici/security/advisories/GHSA-55wc-3pg8-jfw6), [WebSocket PONG memory DoS](https://github.com/nodejs/undici/security/advisories/GHSA-9fm3-97px-rjf6), [WebSocket deflate](https://github.com/nodejs/undici/security/advisories/GHSA-3wwx-pv8p-q78v) and [unsafe-method cache](https://github.com/nodejs/undici/security/advisories/GHSA-8436-99hf-9mmv).

### Другие пакеты

- `@electron/get` 5.1.0: совместим с заявленным Electron диапазоном `^5.0.0`; релиз 5.1.0 добавляет ошибку для неподдерживаемых win32/ia32 и linux/armv7l загрузок Electron 44+, а Snyk не показывает прямых advisories для этой версии.
- `@electron-internal/extract-zip` 1.0.8: закреплён в корневом lockfile с registry URL и SRI. Это внутренний инструмент Electron для распаковки checksum-проверенных дистрибутивов; его не следует применять как универсальную библиотеку для недоверенных архивов.
- `electron-builder` 26.18.1: точная версия закреплена в отдельном manifest `tools/release-toolchain/package.json`; пакет более не должен запускаться через временный `npm exec`. Но отдельный `tools/release-toolchain/package-lock.json` ещё не сформирован и не закоммичен, поэтому транзитивный граф builder пока не воспроизводим и не охвачен завершённым `npm audit`.

## Совместимость приложения с Electron 42–45: статический просмотр

Проверен код `electron/main.cjs`, `electron/preload.cjs` и renderer на наиболее важные изменения после Electron 37:

- Electron 42 удалил автоматическую загрузку бинарника из `postinstall`; проект переведён на `npm ci --ignore-scripts` и явный `install-electron`.
- Electron 44 больше не поддерживает Windows x86 / Linux ARMv7; проект собирается только как Windows x64, что соответствует опубликованной матрице поставки.
- Clipboard API Electron удалён из renderer; в renderer не обнаружено обращений к `electron.clipboard` или `require("electron")`. Внутреннее `clipClipboard` — модель монтажного копирования клипов, не системный clipboard.
- Для получения реального пути импортируемого файла preload использует `webUtils.getPathForFile(file)`, а не удалённое свойство `File.path`.
- Диалогам сохранения назначен `defaultPath`; `BrowserWindow` работает с `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

Это статический анализ исходников. Он не подтверждает запуск runtime, работу системных диалогов или успешную сборку — соответствующие проверки требуют установленного Electron 45.2.1 и Windows smoke test. См. [Electron Breaking Changes](https://www.electronjs.org/docs/latest/breaking-changes) и [Advanced Installation](https://www.electronjs.org/docs/latest/tutorial/installation).

## Lockfile и целостность поставки

- Пакетов в root lockfile: **13**.
- Пакетов с валидным SRI: **13/13**.
- Отсутствующие или некорректные SRI: **0**.
- Все остальные пакеты разрешаются через `https://registry.npmjs.org/` и имеют `integrity`.
- `@electron/get` 5.1.0, `@electron-internal/extract-zip` 1.0.8, `undici` 7.30.1 и Electron 45.2.1 закреплены с SRI.
- `electron-builder@26.18.1` закреплён в отдельном release-toolchain manifest. Отдельный release-toolchain lockfile пока не создан; CI/release fail-closed до его сохранения.

**Почему не ставлю «PASS» для полного dependency audit:** npm описывает `npm audit` как запрос текущего дерева зависимостей к registry; запрос завершился DNS-ошибкой. Более того, `npm audit` проекта не анализирует отдельный временный build toolchain, который отсутствует в lockfile.

## Результаты локальных проверок

| Проверка | Результат |
|---|---|
| `node --test tests/*.test.cjs` | **303 passed, 0 failed** |
| `npm run qa:locales` | **PASS**, 36 вариантов, 34 preview-пакета, 436 ключей; 0 структурных ошибок |
| `node --check` по JS/CJS в `electron`, `src`, `tests`, `qa`, `tools` | **PASS** |
| JSON/lock consistency | **PASS**, root constraints совпадают; 13 locked package entries |
| SRI coverage | **13/13 PASS**; Electron 45.2.1 и extract-zip 1.0.8 имеют валидные SRI |
| `npm audit --audit-level=low` | **BLOCKED**, `EAI_AGAIN registry.npmjs.org` |
| `npm ci --ignore-scripts` | `--dry-run --offline` прошёл; фактическая установка остановилась на отсутствующем в локальном кеше `undici-types@7.18.2` |
| `npm run electron:install` / `electron --version` | Не запускались: Electron npm package/runtime не скачаны в эту среду |
| Windows NSIS / Portable + GUI smoke | Не запускались: среда не Windows |

## Что требуется для закрытия релизного блокера

В среде с доступом к npm registry выполнить из корня проекта:

```powershell
npm install --package-lock-only --ignore-scripts
npm audit --audit-level=low
npm ci --ignore-scripts
npm run electron:install
npm run electron:version
npm run qa:locales
npm test
```

Затем:

1. Выполнить в среде с доступом к npm registry `npm ci --ignore-scripts` и `npm audit --audit-level=low`; сверить, что фактические tarball digest совпадают с lockfile, не принимать неожиданный dependency drift.
2. Получить полный registry-resolved `tools/release-toolchain/package-lock.json` для `electron-builder@26.18.1`, подтвердить SRI каждого tarball и выполнить отдельный npm audit.
3. Если `npm audit` найдёт advisories — обновлять только до исправленных версий, затем повторять тесты; не применять `npm audit fix --force` без разбора major-изменений.
4. В Windows 10/11 x64 проверить фактический запуск Electron 45.2.1, импорт/воспроизведение файлов, FFmpeg export, Setup, Portable, DPI 100/125/150%, длинные надписи и RTL.
5. Подписать инсталлятор при наличии сертификата и проверить подпись.

**Итог:** Electron и известные проблемные версии `undici` обновлены; локальные тесты и locale QA проходят. Полный аудит зависимостей и выпуск остаются открытыми из-за сетевого ограничения, незаполненного Electron npm SRI и отдельного незапертого build toolchain.



## Дополнение: следующий приоритет — управляемые lockfile и сборочная цепочка

В этом обновлении добавлены следующие изменения исходного проекта:

- `electron` теперь явно переопределяет `@electron-internal/extract-zip` на `1.0.8` — это последняя опубликованная версия на 3 ноября 2026 года. Сам пакет помечен авторами как внутренний инструмент Electron; он остаётся исключительно транзитивной зависимостью Electron, а не самостоятельной библиотекой проекта.
- `electron-builder@26.18.1` вынесен в отдельный `tools/release-toolchain/package.json` с точной версией. Удалён `npm exec --package=...`: сборка должна использовать только локальную установку из отдельного lockfile.
- Добавлены синхронизаторы `npm run deps:install` и `npm run release-tools:install`. При первом запуске с доступом к registry они генерируют lockfile из exact manifest/overrides, затем выполняют `npm ci --ignore-scripts`, проверяют SRI у всех npm registry tarball и запускают `npm audit --audit-level=low`. На последующих установках используются сохранённые lockfile.
- `npm run dist:win` теперь проверяет lockfile и точную установленную версию electron-builder, после чего запускает локальный CLI.
- Windows installer/launcher и GitHub Actions переведены на новые процедуры установки и аудита.

**Ограничение текущей среды:** DNS/исходящий доступ к `registry.npmjs.org` недоступен (`EAI_AGAIN`). Корневой `package-lock.json` теперь содержит 13/13 валидных SRI и `@electron-internal/extract-zip@1.0.8`. Отдельный `tools/release-toolchain/package-lock.json` для `electron-builder@26.18.1` ещё не создан. CI/release намеренно блокируют сборку без этого lockfile. Первое выполнение `npm run deps:install`, а затем `npm run release-tools:install` в окружении с доступом к npm registry завершит установки/создаст toolchain lockfile и остановится, если SRI отсутствует, версия не совпадает или `npm audit` возвращает advisory любой severity. После успешного выполнения созданные lockfile следует сохранить в системе контроля версий.

**Проверка в этой среде:** синтаксис новых CommonJS-скриптов, `--plan` режимы, unit/regression tests и locale QA доступны локально. Чистую установку, фактический npm audit и Windows packaging без registry/Windows не заявляю как выполненные.


## Дополнение 3 ноября 2026: release toolchain patch floors и строгий CI

Проверена история публичных advisories electron-builder. В release toolchain теперь встроен дополнительный version gate по двум известным high-level исправлениям:

- `GHSA-p2f4-r6v6-j797` / `CVE-2026-54673`: credential headers могли утекать при cross-origin redirects в `builder-util-runtime`; затронутые версии `<9.7.0`, исправление `>=9.7.0`. Зафиксированный `electron-builder@26.18.1` в release notes обновляет `builder-util-runtime@9.7.1`.
- `GHSA-7g7r-gx96-252g`: неконтролируемый search path в `app-builder-lib`; затронутые версии `<26.15.0`, исправление `>=26.15.0`. Release `electron-builder@26.18.1` обновляет `app-builder-lib@26.18.1`.
- `GHSA-r4pf-3v7r-hh55` / `CVE-2024-27303`: NSIS installer command-search-path issue; затронуты `<24.13.1`, исправлено в `24.13.2`. Версия `app-builder-lib@26.18.1` выше исправленного порога.

Эти thresholds применяются к каждой найденной копии пакета в lockfile, включая вложенные `node_modules`, а не только к корневому hoist. Источники: GitHub advisories GHSA-p2f4-r6v6-j797, GHSA-7g7r-gx96-252g, GHSA-r4pf-3v7r-hh55; подписанный release `electron-builder@26.18.1` от 26 октября 2026.

Переход на reproducible mode завершён: `deps:install` / `release-tools:install` создают lockfile только при отсутствии или устаревшей фиксации; `deps:ci` / `release-tools:ci` строго используют существующие lockfile и ничего не перегенерируют. Windows release batch и GitHub Actions используют только строгие команды. Проверка SRI теперь валидирует алгоритм, Base64 и длину digest. При неудачном сетевом lockfile refresh исходный lockfile восстанавливается byte-for-byte.

В текущем пакете остаётся осознанный блокер поставки: root lockfile содержит 13/13 валидных SRI, Electron 45.2.1 и extractor 1.0.8; отдельный toolchain lockfile отсутствует. Registry остаётся недоступен в текущей среде (`EAI_AGAIN`), поэтому достоверно сформировать полный `electron-builder` dependency graph здесь нельзя. Строгие CI/release-проверки отклоняют текущее состояние вместо того, чтобы собирать незапертое дерево.

Дополнительно app-lock validation теперь требует `undici >=7.30.1` по всем копиям в npm lockfile — это нижняя граница исправлений рассмотренных advisory октября 2026 года. Version parser принимает только стабильные `major.minor.patch` версии; prerelease не может случайно пройти patch-floor gate.


## Дополнение: minimatch в electron-builder 26.18.1 (6 ноября 2026)

Ручной Windows workflow успешно сформировал отдельный lockfile и установил `electron-builder@26.18.1`, но `npm audit --audit-level=low` остановил упаковку. В отчёте выявлено **6 moderate findings** в цепочке `minimatch`, затрагивающих `@electron/universal`, `app-builder-lib`, `dmg-builder`, `electron-builder-squirrel-windows` и сам `electron-builder`. Корневой dependency gate при этом прошёл: 0 уязвимостей.

Причина: прежний override `minimatch@10.2.5` не соответствует опубликованному диапазону GitHub Advisory Database GHSA-g3hv-75wg-m249 / CVE-2026-118764: affected `>=7.0.0 <11.0.1`, fixed `11.0.1`. Подписанный maintainer advisory описывает 10.2.6 как конкретный affected release, но npm audit использует более широкий диапазон GitHub Advisory Database. Для release gate учитывается фактический audit report, а не только более узкое описание.

В manifest теперь предусмотрен глобальный override `minimatch@11.0.1`, чтобы закрыть все вложенные копии, включая `@electron/universal`. Это принудительно выходит за declared semver ranges, указанные upstream для `app-builder-lib` (`^10.2.5`) и `@electron/universal` (`^9.0.3`). Проверенные исходники используют экспорт `minimatch()`, класс `Minimatch`, метод `match()` и свойство `set`; однако minimatch 11 изменил внутреннее представление matcher rows. Поэтому совместимость остаётся **не подтверждённой до успешной locked Windows-сборки и проверки Setup/Portable**.

Новый lockfile должен содержать только версии `minimatch >=11.0.1` во всех копиях. Кодовые gates теперь проверяют и lockfile, и фактически установленное дерево. До успешного `npm audit`, строгого повтора `npm ci`, сборки NSIS/Portable и smoke test бинарный релиз остаётся заблокированным.

Источники: [GitHub Advisory GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), [maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249), [minimatch v11 API](https://github.com/isaacs/minimatch), [electron-builder app-builder-lib source](https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/util/filter.ts), [@electron/universal v2 source](https://github.com/electron/universal/blob/v2.0.3/src/asar-utils.ts).
