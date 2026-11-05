# Первый push Montazhnaya_1 в GitHub (PowerShell)

Эта инструкция относится к актуальному чистому source candidate Stage 19. Лицензирование оформлено: код — GPL-3.0-or-later; перечисленные медиаактивы — CC BY 4.0. Ручная инженерная ревизия исходного кода завершена. Не загружайте старый `Montazhnaya_1.zip` или папку Stage 13.

## 1. Создать пустой репозиторий

На GitHub нажмите **New repository** и укажите:

- Owner: ваш GitHub-аккаунт или организация;
- Repository name: `montazhnaya-1`;
- Description: `Free, local-first Windows video editor. Built openly and improved with the community.`;
- Visibility: **Public**;
- не добавляйте начальные README, LICENSE или `.gitignore` — они уже находятся в архиве.

## 2. Распаковать исходный архив

Распакуйте актуальный ZIP-кандидат, откройте PowerShell в корневой папке. Убедитесь, что рядом находятся `package.json`, `package-lock.json`, `LICENSE`, `ASSET_LICENSE.md` и `README.md`.

## 3. Создать первый коммит

```powershell
git init
git add .
git diff --cached --check
git status --short

npm test
npm run qa:locales

git commit -s -m "Initial Montazhnaya_1 open-source source snapshot"
git branch -M main
```

Команда `git commit -s` добавляет DCO sign-off согласно `DCO.txt`. Перед коммитом просмотрите staged-файлы; не добавляйте логи, личные проекты, тестовые MP4/WAV или FFmpeg-бинарники.

## 4. Привязать пустой GitHub-репозиторий и отправить ветку

Замените `<OWNER>` на точный логин владельца репозитория:

```powershell
git remote add origin https://github.com/<OWNER>/montazhnaya-1.git
git push -u origin main
```

Если GitHub запросит авторизацию, используйте Git Credential Manager или официальный способ входа; не вставляйте Personal Access Token в команду, историю PowerShell или файлы проекта.

## 5. Настроить защиту после push

1. Включить Issues и Discussions.
2. Включить Dependabot alerts и weekly updates.
3. Включить Secret Scanning и Push Protection, если доступны для выбранного плана/репозитория.
4. Включить Private Vulnerability Reporting.
5. Защитить `main`: required status checks, pull request review, запрет force push и удаления ветки.
6. Добавить владельца и ссылку репозитория в `CITATION.cff`.
7. Проверить permissions GitHub Actions и закрепить используемые Actions на полных commit SHA.

**Не создавайте GitHub Release и не прикрепляйте Setup/Portable на этом шаге.** Для бинарного выпуска отдельно нужны release-toolchain lockfile, доступный сетевой audit, полный SBOM и чистая Windows-приёмка.
