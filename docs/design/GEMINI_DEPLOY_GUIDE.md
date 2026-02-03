# ИНСТРУКЦИЯ ДЛЯ GEMINI: Деплой на GitHub Pages

> **ВАЖНО:** Следуй этим шагам ТОЧНО. Не импровизируй.

---

## ШАГ 1: Перейти в папку frontend

```bash
cd web_platform_v2/frontend
```

---

## ШАГ 2: Запустить деплой

```bash
npm run deploy
```

**Эта команда автоматически:**
1. Запускает `npm run build` (сборка)
2. Запускает `gh-pages -d dist` (публикация)

---

## ШАГ 3: Дождаться сообщения "Published"

Если видишь:
```
Published
```
— значит деплой успешен.

---

## ЕСЛИ ОШИБКА

### Ошибка: "fatal: A branch named 'gh-pages' already exists"

**Решение:**
```bash
rm -rf node_modules/.cache/gh-pages
npm run deploy
```

### Ошибка: "Permission denied" или "Authentication failed"

**Решение:**
Нужен доступ к репозиторию. Спроси пользователя.

### Ошибка: "npm ERR! missing script: deploy"

**Решение:**
В package.json должно быть:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Ошибка при сборке TypeScript

**Решение:**
```bash
npm run build
```
Посмотри ошибки TypeScript и исправь их.

---

## ПОСЛЕ ДЕПЛОЯ

Сайт доступен по адресу:
**https://vzor-io.github.io/vzor-platform/**

GitHub Pages обновляется за 1-2 минуты.

---

## КОМАНДА ОДНОЙ СТРОКОЙ

```bash
cd web_platform_v2/frontend && npm run deploy
```

---

## НЕ ДЕЛАЙ

1. ❌ Не меняй vite.config.ts
2. ❌ Не меняй package.json (кроме зависимостей)
3. ❌ Не используй другие способы деплоя
4. ❌ Не пытайся деплоить вручную через git

---

## ПРОВЕРКА

После деплоя открой в браузере:
https://vzor-io.github.io/vzor-platform/

Если не работает — подожди 2 минуты и обнови страницу (Ctrl+Shift+R).

---

*Используй эту инструкцию каждый раз при деплое.*
