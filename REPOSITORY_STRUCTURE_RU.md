# Предлагаемая структура публичного репозитория

```text
montazhnaya-1/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml
│   └── workflows/
├── assets/
│   ├── branding/                 # только очищенные по правам материалы
│   └── transition-previews/      # только после разрешения авторов исходных видео
├── docs/
│   ├── architecture/
│   ├── export/
│   ├── localization/
│   └── testing/
├── electron/
├── src/
├── tests/
│   └── fixtures/                 # только синтетические/разрешённые fixtures
├── tools/
│   └── release-toolchain/
│       ├── package.json
│       └── package-lock.json     # обязателен для строгой воспроизводимой сборки
├── .gitattributes
├── .gitignore
├── CHANGELOG.md
├── CITATION.cff
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── COPYRIGHT.md
├── DCO.txt
├── LICENSE
├── README.md
├── SECURITY.md
├── THIRD_PARTY_NOTICES.md
├── package.json
└── package-lock.json
```

Не включать в Git: `node_modules/`, `release/`, `dist/`, локальные логи, тестовые контакт-листы с личным медиа, исходные пользовательские проекты, FFmpeg бинарники (если не создан отдельный compliant distribution), временные архивы и локальные конфиги.
