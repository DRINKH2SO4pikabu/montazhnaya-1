# Montazhnaya_1 — готовность и проверка публичного Windows-релиза

**Релиз:** `v3.6.45` — Montazhnaya 3.6.45 Beta / Stage 19  
**Дата публикации:** 6 ноября 2026 г.  
**Официальная страница:** https://github.com/DRINKH2SO4pikabu/montazhnaya-1/releases/tag/v3.6.45  
**Сборка:** Windows x64, Electron 45.2.1  
**Исходный commit релиза:** `b69c724e6c71f4d4928a08f4c5e2687c6436a6c3`

## Статус

<badge-placeholder/>

**Первый официальный Windows Beta-релиз опубликован.** Страница GitHub Release имеет тег `v3.6.45`, статус опубликованного Pre-release, а не Draft. Setup, Portable, отдельные SHA-256, общий манифест, SBOM и отчёты проверки прикреплены к релизу.

## Принятые решения по лицензиям и происхождению

- Исходный код приложения и проектная документация: **GPL-3.0-or-later**.
- Логотип, выбранная фирменная графика, 21 Grok-generated демонстрационный ролик, MP4-превью и постеры: **CC BY 4.0**.
- Сторонние библиотеки и бинарные компоненты сохраняют собственные лицензии.
- В публичных материалах и окне «О программе» сохранена атрибуция `Created with Grok`; происхождение логотипа и выбранной графики ChatGPT раскрыто отдельно.
- FFmpeg/FFprobe не включены в Setup и Portable. Пользователь устанавливает совместимую сборку отдельно и соблюдает её лицензию.
- Setup и Portable не подписаны цифровым сертификатом. Это указано в release notes; при запуске Windows может показать SmartScreen или иное предупреждение.

## Завершённые проверки

| Проверка | Результат | Что именно подтверждено |
|---|---|---|
| Application dependencies | PASS | Строгая установка из root lockfile, SRI и `npm audit` в GitHub Actions |
| Windows release toolchain | PASS | Создан и закоммичен `tools/release-toolchain/package-lock.json`; установка и аудит, затем повторная строгая locked-установка |
| Electron runtime | PASS | Версия Electron 45.2.1 установлена и проверена |
| Localization QA | PASS | Все предусмотренные проверки локализации прошли |
| Regression + FFmpeg integration | PASS | 435/435 тестов, 0 failures, 0 skipped; зелёные прогоны на Windows, Ubuntu и macOS |
| CycloneDX SBOM | PASS | В релиз приложены отдельные SBOM зависимостей приложения и Windows release-toolchain |
| Package notices | PASS | Проверены проектные LICENSE/NOTICE в app.asar и Electron/Chromium notices в распакованном приложении |
| Setup installation | PASS | Тихая установка Setup на чистом Windows Actions runner завершилась успешно |
| Installed app startup | PASS | Установленный `Montazhnaya.exe` запустился и не завершился в smoke-test |
| Portable startup | PASS | Portable EXE запустился и не завершился в smoke-test |
| SHA-256 | PASS | Для обоих EXE создан общий `SHA256SUMS.txt` и отдельные файлы `.sha256.txt`; значения повторно вычислены независимо из скачанного release-candidate artifact и совпали |
| Full Git history secret scan | PASS | Gitleaks workflow просканировал полную историю Git; workflow завершился успешно |

### Опубликованные файлы и SHA-256

| Файл | Размер | SHA-256 |
|---|---:|---|
| `Montazhnaya-3.6.45-Setup-x64.exe` | 128,816,157 bytes | `c69c10be92733b12ad752bc8d60f223f69b171b28636c0873d41638c796f5ea4` |
| `Montazhnaya-3.6.45-Portable-x64.exe` | 116,516,849 bytes | `b8f66c8fd1fa9c19d4c8e31958b2697d38cc339bd7c351e872c59f8d01fc74fb` |

Хеши сверены по фактическому содержимому обоих EXE внутри скачанного артефакта GitHub Actions, а не только по тексту checksum-файлов. Артефакт проверки содержит `package-verification.json` со статусом `PASS`, включая обнаруженные файлы Electron и Chromium license notices.

### SBOM — границы охвата

В релиз приложены:
- `Montazhnaya-app-dependencies.cdx.json` — CycloneDX для root npm dependency graph приложения;
- `Windows-release-toolchain.cdx.json` — CycloneDX для отдельной цепочки упаковки Windows.

Это два dependency SBOM, а не единый исчерпывающий inventory каждого бинарного компонента Electron/Chromium и всех файлов EXE. Для Electron/Chromium в сам пакет включены соответствующие upstream license notices; FFmpeg/FFprobe не распространяются.

## Оставшиеся задачи после публикации

Первый публичный бинарный релиз не означает сертификацию всех аппаратных и пользовательских сценариев. Следующие задачи остаются открытыми для следующих Beta-итераций:

1. **Ручная проверка Portable на компьютере сопровождающего.** Автоматический smoke-test на Windows runner прошёл; отдельное подтверждение на пользовательском ПК ещё нужно.
2. **Аппаратная совместимость.** Провести воспроизводимую матрицу тестов NVIDIA NVENC, AMD AMF и Intel Quick Sync на реальном оборудовании, с разными драйверами, 1080p/4K и 24/30/60 FPS. Ранее NVIDIA NVENC проверялся в одном сценарии 1080p30; это не подтверждает остальные комбинации.
3. **Длительные и сложные проекты.** Проверить большие исходники, длинные таймлайны, сочетания видео/изображений/аудио, повторные экспорты и восстановление после ошибок.
4. **Поддержка Windows.** Проверить установку, обновление и удаление на нескольких реальных конфигурациях Windows 10/11, а не только на GitHub runner.
5. **Переводы.** 34 дополнительных языка остаются машинно-ассистированными черновиками и нуждаются в проверке носителями.
6. **Цифровая подпись.** Сейчас EXE не подписаны. Подписание можно добавить позже при наличии сертификата и защищённого механизма хранения ключа; для публикации текущей Beta это не было настроено.

Эти пункты не отменяют публикацию v3.6.45, но должны учитываться при описании совместимости и при подготовке следующих релизов. Не заявлять поддержку GPU или формата только на основании прохождения CI.

## Команды и подтверждения

- Windows Beta release workflow: https://github.com/DRINKH2SO4pikabu/montazhnaya-1/actions/runs/42211601483
- Cross-platform CI: https://github.com/DRINKH2SO4pikabu/montazhnaya-1/actions/runs/42211601449
- Full-history Gitleaks scan: https://github.com/DRINKH2SO4pikabu/montazhnaya-1/actions/runs/42211601443
- Официальный релиз: https://github.com/DRINKH2SO4pikabu/montazhnaya-1/releases/tag/v3.6.45

## Исходники и лицензии

- Repository: https://github.com/DRINKH2SO4pikabu/montazhnaya-1
- `LICENSE`, `LICENSE_SCOPE.md`, `ASSET_LICENSE.md`, `ASSET_CREDITS.md`, `THIRD_PARTY_NOTICES.md` — основные документы о лицензиях и атрибуции.
- `SOURCE_CODE_ORIGIN_AUDIT_RU.md`, `ASSET_RIGHTS_REGISTER_RU.md`, `AI_ASSISTANCE_DISCLOSURE.md` и `COPYRIGHT_AND_AI_PROVENANCE_RU.md` — документы о происхождении кода и медиа.
