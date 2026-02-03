# GEMINI: Деплой на GitHub Pages

> **ПРОБЛЕМА:** После изменений сайт не работает — облако точек не отображается!

---

## ПОЧЕМУ НЕ РАБОТАЕТ

### Типичные причины:

1. **Three.js не загружается** — неправильный путь к CDN
2. **Консольные ошибки** — JavaScript падает до инициализации Three.js
3. **CORS ошибки** — браузер блокирует загрузку скриптов
4. **Кэш браузера** — старая версия в кэше

---

## ПЕРЕД ДЕПЛОЕМ: ПРОВЕРЬ ЛОКАЛЬНО!

### Шаг 1: Открой файл локально

```bash
# Windows
start index_v3.8.html

# Mac
open index_v3.8.html

# Или просто перетащи файл в браузер
```

### Шаг 2: Открой DevTools (F12)

1. Перейди во вкладку **Console**
2. Проверь нет ли красных ошибок
3. Особенно ищи:
   - `THREE is not defined` — Three.js не загрузился
   - `Cannot read property` — ошибка в коде
   - `404 Not Found` — файл не найден

### Шаг 3: Проверь что Three.js подключен правильно

В `<head>` должно быть:

```html
<!-- Three.js — ОБЯЗАТЕЛЬНО перед твоим кодом! -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

**ВАЖНО:**
- Скрипт Three.js должен быть ПЕРЕД твоим `<script>` кодом
- Используй HTTPS, не HTTP
- Версия r128 проверена и работает

---

## ДЕПЛОЙ НА GITHUB PAGES

### Способ 1: Через GitHub UI (простой)

1. Открой репозиторий на GitHub
2. Перейди в папку `web_platform_v2/frontend/`
3. Нажми **Add file** → **Upload files**
4. Загрузи `index_v3.8.html`
5. Напиши commit message: `Update to v3.8`
6. Нажми **Commit changes**

### Способ 2: Через Git (правильный)

```bash
# 1. Перейди в папку проекта
cd web_platform_v2/frontend

# 2. Проверь статус
git status

# 3. Добавь файл
git add index_v3.8.html

# 4. Сделай коммит
git commit -m "Update to v3.8: fix node editor, add icon bar"

# 5. Отправь на GitHub
git push origin main
```

### Способ 3: Через npm (если настроен)

```bash
# Если есть package.json с gh-pages
npm run deploy
```

---

## ПОСЛЕ ДЕПЛОЯ: ОЧИСТИ КЭШ!

### Проблема: GitHub Pages кэширует старую версию

### Решение 1: Hard Refresh

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Решение 2: Открой в инкогнито

```
Windows: Ctrl + Shift + N
Mac: Cmd + Shift + N
```

### Решение 3: Добавь версию в URL

```
https://username.github.io/vzor/index_v3.8.html?v=2
```

Меняй `?v=2` на `?v=3`, `?v=4` и т.д. после каждого деплоя.

---

## ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ

```
□ Файл открывается локально без ошибок
□ Облако точек отображается
□ Клик на лейблы работает
□ Панели открываются/закрываются
□ Node Editor открывается как модальное окно
□ В консоли нет красных ошибок
```

---

## ТИПИЧНЫЕ ОШИБКИ И РЕШЕНИЯ

### Ошибка: `THREE is not defined`

**Причина:** Three.js не загрузился

**Решение:** Проверь что скрипт подключен в `<head>`:

```html
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
```

---

### Ошибка: `Cannot read property 'appendChild' of null`

**Причина:** DOM элемент не найден

**Решение:** Убедись что код запускается ПОСЛЕ загрузки DOM:

```html
<script>
    // НЕПРАВИЛЬНО - DOM ещё не готов
    document.getElementById('container').appendChild(renderer.domElement);
</script>

<script>
    // ПРАВИЛЬНО - ждём загрузку DOM
    window.addEventListener('DOMContentLoaded', () => {
        document.getElementById('container').appendChild(renderer.domElement);
    });
</script>
```

Или помести `<script>` перед `</body>`:

```html
    <!-- ... весь HTML ... -->

    <script>
        // Код здесь — DOM уже готов
    </script>
</body>
```

---

### Ошибка: Белый/чёрный экран без облака

**Причина 1:** WebGL не поддерживается

**Проверка:**
```javascript
if (!window.WebGLRenderingContext) {
    alert('WebGL не поддерживается!');
}
```

**Причина 2:** Камера смотрит не туда

**Проверка:** Добавь временно:
```javascript
console.log('Camera position:', camera.position);
console.log('Points count:', points.geometry.attributes.position.count);
```

---

### Ошибка: GitHub Pages показывает 404

**Причина:** Неправильный путь или файл не загружен

**Решение:**
1. Проверь что файл есть в репозитории
2. Подожди 1-2 минуты после push
3. Проверь URL: `https://USERNAME.github.io/REPO/путь/к/файлу.html`

---

## СТРУКТУРА ФАЙЛОВ ДЛЯ GITHUB PAGES

```
web_platform_v2/
└── frontend/
    ├── index.html          ← Главная страница (редирект или последняя версия)
    ├── index_v3.6.html     ← Эталон (НЕ ТРОГАТЬ!)
    ├── index_v3.7.html     ← Предыдущая версия
    ├── index_v3.8.html     ← Текущая версия
    └── src/                ← React файлы (НЕ ТРОГАТЬ!)
```

**Рекомендация:** Сделай `index.html` редиректом на последнюю версию:

```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=index_v3.8.html">
</head>
<body>
    <a href="index_v3.8.html">Перейти к VZOR</a>
</body>
</html>
```

---

## БЫСТРАЯ ПРОВЕРКА ПОСЛЕ ДЕПЛОЯ

1. Открой: `https://USERNAME.github.io/REPO/web_platform_v2/frontend/index_v3.8.html`
2. Нажми F12 → Console
3. Если ошибки — читай их текст
4. Если нет ошибок но нет облака — проверь Network вкладку (загрузился ли Three.js)

---

## КОМАНДЫ GIT (шпаргалка)

```bash
# Посмотреть изменения
git status

# Добавить все изменения
git add .

# Добавить конкретный файл
git add index_v3.8.html

# Сделать коммит
git commit -m "описание изменений"

# Отправить на GitHub
git push

# Если push не работает
git push origin main
# или
git push origin master
```

---

*После каждого изменения — проверяй локально, потом деплой!*
