# GEMINI: Создай версию 3.7

> **КРИТИЧЕСКИ ВАЖНО:** Работай ТОЛЬКО с HTML файлом, НЕ трогай React!

---

## ЗАДАЧА

1. **Открой** файл: `web_platform_v2/frontend/index_v3.6.html`
2. **Скопируй** его в: `web_platform_v2/frontend/index_v3.7.html`
3. **Внеси изменения** в новый файл (описаны ниже)
4. **НЕ ТРОГАЙ** папку `src/` и React файлы!

---

## ЧТО ИЗМЕНИТЬ В 3.7

### 1. Плавающая панель ввода (Draggable)

**Было в 3.6:**
```css
#task-interface {
    position: fixed;
    bottom: -150px;
    /* ... */
}
```

**Стало в 3.7:**
- Добавить возможность перетаскивать панель мышью
- Панель запоминает позицию

```javascript
// Добавить в конец <script>:
(function() {
    const panel = document.getElementById('task-interface');
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    panel.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offset.x = e.clientX - panel.getBoundingClientRect().left;
        offset.y = e.clientY - panel.getBoundingClientRect().top;
        panel.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offset.x) + 'px';
        panel.style.bottom = 'auto';
        panel.style.top = (e.clientY - offset.y) + 'px';
        panel.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        panel.style.cursor = 'grab';
    });
})();
```

---

### 2. Модальное окно для Node Editor

**Добавить HTML перед </body>:**
```html
<!-- NODE EDITOR MODAL -->
<div id="node-editor-modal" style="
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px);
    z-index: 200;
    justify-content: center;
    align-items: center;
">
    <div style="
        width: 85vw;
        height: 75vh;
        background: #0a0a0a;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        overflow: hidden;
    ">
        <div style="
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        ">
            <span style="font-size: 14px; color: rgba(255,255,255,0.8);">Node Editor</span>
            <button onclick="closeNodeEditor()" style="
                background: none;
                border: none;
                color: rgba(255,255,255,0.5);
                font-size: 20px;
                cursor: pointer;
            ">✕</button>
        </div>
        <div style="height: calc(100% - 48px); padding: 20px;">
            <p style="color: #666;">Node Editor content here...</p>
        </div>
    </div>
</div>
```

**Добавить кнопку вызова (рядом с task-interface):**
```html
<button id="nodes-btn" onclick="openNodeEditor()" style="
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    cursor: pointer;
    z-index: 100;
    display: none;
">⚙ Nodes</button>
```

**Добавить JavaScript:**
```javascript
function openNodeEditor() {
    document.getElementById('node-editor-modal').style.display = 'flex';
}

function closeNodeEditor() {
    document.getElementById('node-editor-modal').style.display = 'none';
}

// Показать кнопку Nodes когда активен task-interface
// Добавить в функцию showDetail():
document.getElementById('nodes-btn').style.display = 'block';

// Скрыть при выходе
// Добавить в hideDetail():
document.getElementById('nodes-btn').style.display = 'none';
```

---

### 3. Убедись что фон ЧЁРНЫЙ

Проверь что нигде нет синих цветов:
- `#1a1a2e` ❌
- `#16213e` ❌
- `#0f0f23` ❌

Все фоны должны быть:
- `#000000` или `rgba(0,0,0,0.85)`

---

## ФАЙЛЫ

```
web_platform_v2/frontend/
├── index_v3.6.html   ← ИСХОДНИК (не менять!)
├── index_v3.7.html   ← СОЗДАТЬ НОВЫЙ
└── src/              ← НЕ ТРОГАТЬ!
```

---

## ПОРЯДОК ДЕЙСТВИЙ

1. `cp index_v3.6.html index_v3.7.html`
2. Открой `index_v3.7.html`
3. Добавь draggable для task-interface
4. Добавь модальное окно Node Editor
5. Добавь кнопку Nodes
6. Проверь цвета
7. Протестируй в браузере: `open index_v3.7.html`

---

## НЕ ДЕЛАЙ

1. ❌ НЕ трогай папку `src/`
2. ❌ НЕ трогай React файлы (*.tsx)
3. ❌ НЕ меняй `index_v3.6.html`
4. ❌ НЕ добавляй синие цвета
5. ❌ НЕ ломай существующую логику 3.6

---

## РЕЗУЛЬТАТ

После выполнения должен быть файл `index_v3.7.html` который:
- Работает как 3.6
- + Панель ввода можно перетаскивать
- + Есть кнопка Nodes
- + Есть модальное окно Node Editor
- + Все цвета чёрные

---

*Работай ТОЛЬКО с HTML файлом!*
