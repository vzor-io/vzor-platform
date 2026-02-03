<<<<<<< HEAD
# VZOR Platform

Платформа для девелопмента недвижимости с AI-агентами и 3D визуализацией.
Позволяет визуально строить workflow из нод, где каждая нода — это агент с задачей, базой знаний и методикой.

## Структура проекта

```
VZOR/
├── docs/                      # 📚 Документация (архитектура, API, гайды)
├── platform/                  # 🖥️ Основной продукт
│   ├── frontend/              # React + Vite + TypeScript
│   └── backend/               # FastAPI + Python
├── agent-core/                # 🤖 Движок агентов (Agent Zero fork)
├── blender/                   # 🎬 Интеграция с Blender
├── archive/                   # 📦 Старые версии и прототипы
└── scripts/                   # 🔧 Скрипты автоматизации
```

## Быстрый старт

### Требования
- Node.js 18+
- Python 3.10+
- Docker (опционально)

### Установка

1. **Клонировать репозиторий**
   ```bash
   git clone https://github.com/vzor-io/vzor-platform.git
   cd vzor-platform
   ```

2. **Настройка окружения**
   ```bash
   cp .env.example .env
   # Отредактируйте .env, добавив API ключи
   ```

3. **Запуск (Dev Mode)**
   *В разработке... См. `platform/frontend/README.md`*

## Документация
Подробная документация находится в папке [docs/](./docs/).
- [Архитектура](./docs/architecture/)
- [Гайды](./docs/guides/)
- [ADR (Решения)](./docs/decisions/)

## Лицензия
Proprietary / Closed Source
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> 9fcc5e9cbb4601f1e5d1775234e12e1d73fa804e
