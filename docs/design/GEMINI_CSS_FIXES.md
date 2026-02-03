# GEMINI: Исправления CSS — Убрать ВСЕ синие цвета

> **СРОЧНО:** Замени все синие цвета на чёрные

---

## Файл: `src/components/Layout/Layout.css`

### Строка 15 — .icon-bar
```css
/* БЫЛО (неправильно): */
background: #1a1a2e;

/* СТАЛО (правильно): */
background: #0a0a0a;
```

### Строка 58 — .left-panel
```css
/* БЫЛО: */
background: #16213e;

/* СТАЛО: */
background: #0a0a0a;
```

### Строка 142 — .right-panel
```css
/* БЫЛО: */
background: #16213e;

/* СТАЛО: */
background: #0a0a0a;
```

### Строка 180 — .right-panel-container
```css
/* БЫЛО: */
background: #16213e;

/* СТАЛО: */
background: #0a0a0a;
```

### Строка 193 — .bottom-bar
```css
/* БЫЛО: */
background: #1a1a2e;

/* СТАЛО: */
background: #0a0a0a;
```

---

## Полный исправленный Layout.css

```css
.main-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000000;
    font-family: 'Inter', system-ui, sans-serif;
    color: #e0e0e0;
}

/* --- LEFT ICON BAR --- */
.icon-bar {
    width: 48px;
    height: 100%;
    background: #0a0a0a;  /* ЧЁРНЫЙ, не синий! */
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10px;
    z-index: 50;
    border-right: 1px solid rgba(255,255,255,0.1);
}

.icon-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    font-size: 18px;
    color: rgba(255,255,255,0.5);
    border-radius: 9999px;  /* Овальная форма */
    margin: 4px 0;
}

.icon-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.icon-button.active {
    background: rgba(78, 205, 196, 0.15);
    color: #4ECDC4;
}

/* --- LEFT PANEL --- */
.left-panel {
    width: 0;
    height: 100%;
    background: #0a0a0a;  /* ЧЁРНЫЙ! */
    overflow: hidden;
    transition: width 0.2s ease-out;
    border-right: 1px solid rgba(255,255,255,0.1);
    display: flex;
    flex-direction: column;
    z-index: 40;
}

.left-panel.open {
    width: 260px;
}

/* --- CENTER --- */
.center-content {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #000000;  /* ЧЁРНЫЙ! */
}

.center-container {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
}

/* --- RIGHT PANEL --- */
.right-panel-container {
    width: 0;
    transition: width 0.2s ease-out;
    background: #0a0a0a;  /* ЧЁРНЫЙ! */
    border-left: 1px solid rgba(255,255,255,0.1);
    overflow: hidden;
}

.right-panel-container.open {
    width: 300px;
}

/* --- PANEL HEADER --- */
.panel-header {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    font-size: 12px;
    letter-spacing: 1px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
}

/* --- TASK LIST --- */
.task-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.task-list-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.1s;
    font-size: 13px;
}

.task-list-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.task-list-item.active {
    background: rgba(78, 205, 196, 0.1);
    border: 1px solid rgba(78, 205, 196, 0.2);
}

/* --- NODE EDITOR --- удалить bottom-bar и overlay */
/* Теперь Node Editor открывается как модальное окно */
```

---

## Проверка

После изменений открой DevTools (F12) и проверь:

1. `Ctrl+Shift+C` → наведи на любую панель
2. Убедись что background НЕ содержит `#1a`, `#16`, `#0f`
3. Все фоны должны быть `#000000` или `#0a0a0a`

---

*Исправь это ПЕРЕД любыми другими изменениями!*
