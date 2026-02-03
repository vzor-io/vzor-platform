# GEMINI: Исправления для версии 3.8

> **КРИТИЧЕСКИ ВАЖНО:** Работай ТОЛЬКО с HTML файлом `index_v3.7.html` → создай `index_v3.8.html`!

---

## СКРИНШОТЫ С БАГАМИ

Смотри файлы в корне проекта:
- `88.png` — Node Editor + правая панель (разные цвета, перекрытие)
- `99.png` — WORK режим (нет левой панели, две кнопки Nodes)
- `112.png` — Node Editor крупно (нода без сокетов)

---

## СПИСОК БАГОВ ДЛЯ ИСПРАВЛЕНИЯ

### 🔴 БАГ 1: Нет левой icon-bar

**Скриншот:** `99.png`

**Проблема:** В WORK режиме (после клика на Development) НЕТ левой панели с иконками.

**Должно быть:** Левая icon-bar (48px) с иконками Invest, Design, Build, Sales — ВСЕГДА видна!

```html
<!-- Добавить ПЕРЕД основным контентом -->
<div id="icon-bar">
    <div class="icon-btn" title="Invest">📊</div>
    <div class="icon-btn" title="Design">📐</div>
    <div class="icon-btn" title="Build">🏗</div>
    <div class="icon-btn" title="Sales">💰</div>
    <div class="icon-separator"></div>
    <div class="icon-btn" title="Files">📁</div>
    <div style="flex:1"></div>
    <div class="icon-btn" title="Settings">⚙</div>
</div>
```

```css
#icon-bar {
    position: fixed;
    left: 0;
    top: 0;
    width: 48px;
    height: 100vh;
    background: #0a0a0a;
    border-right: 1px solid rgba(255,255,255,0.1);
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;
}

.icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    margin: 4px 0;
    font-size: 16px;
    opacity: 0.5;
    transition: all 0.15s;
}

.icon-btn:hover {
    background: rgba(255,255,255,0.1);
    opacity: 1;
}

.icon-separator {
    width: 24px;
    height: 1px;
    background: rgba(255,255,255,0.15);
    margin: 10px 0;
}
```

---

### 🔴 БАГ 2: Две кнопки "Nodes" — дублирование

**Скриншот:** `99.png`, `112.png`

**Проблема:** Видно ДВЕ кнопки "Nodes" — одна слева внизу, одна справа внизу.

**Решение:** Должна быть ОДНА кнопка "Nodes" — справа внизу.

```javascript
// Удалить лишнюю кнопку!
// Оставить только одну:
```

```html
<button id="nodes-btn" onclick="openNodeEditor()">
    ⚙ Nodes
</button>
```

```css
#nodes-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;  /* Только справа! */
    padding: 8px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    cursor: pointer;
    z-index: 100;
}
```

---

### 🔴 БАГ 3: Node Editor как маленькая панель, а не модальное окно

**Скриншот:** `88.png`

**Проблема:** Node Editor отображается как маленькая панель в левом нижнем углу.

**Должно быть:** МОДАЛЬНОЕ ОКНО по центру экрана (85vw × 75vh)!

```css
#node-editor-modal {
    display: none;  /* Скрыто по умолчанию */
    position: fixed;
    inset: 0;  /* Покрывает весь экран */
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px);
    z-index: 300;
    justify-content: center;
    align-items: center;
}

#node-editor-modal.active {
    display: flex;  /* Показать */
}

#node-editor-content {
    width: 85vw;
    height: 75vh;
    background: #0a0a0a;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    overflow: hidden;
}
```

---

### 🔴 БАГ 4: Ноды без сокетов — не Grasshopper стиль

**Скриншот:** `112.png`

**Проблема:** Нода показывает просто текст (Type, Agent, DB) — нет сокетов для соединений!

**Должно быть:** Ноды как в Grasshopper с входами/выходами по бокам.

```
СЕЙЧАС (неправильно):
┌─────────────────────────┐
│ создать задачу один     │
│                         │
│ Type: Task              │
│ Agent: Router Agent     │
│ DB: VZOR Core           │
└─────────────────────────┘

ДОЛЖНО БЫТЬ (правильно):
┌────────────────────────────────────────┐
│ [●] СОЗДАТЬ ЗАДАЧУ ОДИН           [×] │  ← Заголовок
├────────────────────────────────────────┤
│                                        │
│ ◆ Context ──────────────────── ● Out  │  ← СОКЕТЫ!
│ ● Data In                             │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ Agent: Router Agent         [▼]   ││  ← Настройки
│ │ DB: VZOR Core               [▼]   ││
│ └────────────────────────────────────┘│
│                                        │
│ [▶ ВЫПОЛНИТЬ]                         │  ← Кнопка
└────────────────────────────────────────┘
```

**HTML структура ноды:**

```html
<div class="node" data-id="task-1" style="left: 100px; top: 50px;">
    <!-- Заголовок -->
    <div class="node-header">
        <span class="node-status">●</span>
        <span class="node-title">СОЗДАТЬ ЗАДАЧУ ОДИН</span>
        <span class="node-close">×</span>
    </div>

    <!-- Тело -->
    <div class="node-body">
        <!-- Входные сокеты (слева) -->
        <div class="node-inputs">
            <div class="socket socket-bundle">
                <span class="socket-dot">◆</span>
                <span class="socket-label">Context</span>
            </div>
            <div class="socket socket-data">
                <span class="socket-dot">●</span>
                <span class="socket-label">Data In</span>
            </div>
        </div>

        <!-- Выходные сокеты (справа) -->
        <div class="node-outputs">
            <div class="socket socket-data">
                <span class="socket-label">Out</span>
                <span class="socket-dot">●</span>
            </div>
        </div>

        <!-- Настройки -->
        <div class="node-settings">
            <div class="setting-row">
                <span>Agent:</span>
                <select>
                    <option>Router Agent</option>
                    <option>Analyst</option>
                </select>
            </div>
            <div class="setting-row">
                <span>DB:</span>
                <select>
                    <option>VZOR Core</option>
                </select>
            </div>
        </div>

        <!-- Кнопка выполнения -->
        <button class="node-run-btn">▶ ВЫПОЛНИТЬ</button>
    </div>
</div>
```

**CSS для нод:**

```css
.node {
    position: absolute;
    width: 260px;
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    font-size: 12px;
    user-select: none;
}

.node-header {
    height: 32px;
    background: rgba(30, 30, 30, 1);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    padding: 0 10px;
    gap: 8px;
}

.node-status { color: #4ECDC4; }
.node-title { flex: 1; font-weight: 600; text-transform: uppercase; font-size: 11px; }
.node-close { cursor: pointer; opacity: 0.5; }
.node-close:hover { opacity: 1; }

.node-body {
    padding: 12px;
    position: relative;
}

/* Сокеты */
.socket {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0;
    cursor: pointer;
}

.socket-dot {
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.socket-bundle .socket-dot { color: #FF6B6B; }  /* Красный ромб */
.socket-data .socket-dot { color: #4ECDC4; }    /* Бирюзовый круг */

.node-inputs {
    position: absolute;
    left: -6px;
    top: 40px;
}

.node-outputs {
    position: absolute;
    right: -6px;
    top: 40px;
}

.node-settings {
    margin: 15px 0;
    padding: 10px;
    background: rgba(0,0,0,0.3);
    border-radius: 4px;
}

.setting-row {
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
}

.setting-row select {
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    padding: 2px 5px;
    border-radius: 3px;
}

.node-run-btn {
    width: 100%;
    padding: 8px;
    background: rgba(78, 205, 196, 0.2);
    border: 1px solid rgba(78, 205, 196, 0.4);
    border-radius: 4px;
    color: #4ECDC4;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
}

.node-run-btn:hover {
    background: rgba(78, 205, 196, 0.3);
}
```

---

### 🔴 БАГ 5: Разные цвета у панелей

**Скриншот:** `88.png`

**Проблема:** Правая панель (серая) и Node Editor (чёрная) — РАЗНЫЕ цвета!

**Решение:** ВСЕ панели должны быть одинакового цвета `#0a0a0a`:

```css
/* ЕДИНЫЙ ЦВЕТ ДЛЯ ВСЕХ ПАНЕЛЕЙ */
#detail-panel,
#node-editor-content,
#left-panel,
.panel-background {
    background: #0a0a0a !important;
}
```

---

### 🔴 БАГ 6: Деформация облака точек

**Скриншот:** `88.png`

**Проблема:** Облако точек вытянуто в эллипс вместо сферы.

**Причина:** При открытии панелей меняется размер контейнера, но камера не обновляет aspect ratio.

**Решение:**

```javascript
// 1. Сохранить ссылку на камеру глобально
let camera, renderer;

// 2. Функция обновления пропорций
function updateCameraAspect() {
    const container = document.getElementById('three-container');
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// 3. Вызывать при:
// - window.resize
window.addEventListener('resize', updateCameraAspect);

// - открытии/закрытии панелей
function showDetail() {
    // ... показать панель ...
    setTimeout(updateCameraAspect, 100);  // После анимации
}

function hideDetail() {
    // ... скрыть панель ...
    setTimeout(updateCameraAspect, 100);
}
```

---

### 🔴 БАГ 7: Данные в правой панели не структурированы

**Скриншот:** `88.png`

**Проблема:** Правая панель показывает:
```
создать задачу од
ID: 1737018244981
Status: New
Agent: Router Agent
Database: VZOR Core
```

**Должно быть структурировано:**

```html
<div id="detail-panel">
    <div class="panel-header">
        <span class="panel-title">ОБЗОР ПРОЕКТА</span>
        <button class="panel-close" onclick="hideDetail()">×</button>
    </div>

    <div class="detail-content">
        <!-- Секция: Статус -->
        <div class="detail-section">
            <div class="section-title">СТАТУС</div>
            <div class="status-badge new">Новая</div>
        </div>

        <!-- Секция: Информация -->
        <div class="detail-section">
            <div class="section-title">ИНФОРМАЦИЯ</div>
            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">ID</span>
                    <span class="info-value">1737018244981</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Агент</span>
                    <span class="info-value">Router Agent</span>
                </div>
                <div class="info-row">
                    <span class="info-label">База</span>
                    <span class="info-value">VZOR Core</span>
                </div>
            </div>
        </div>

        <!-- Секция: Результаты -->
        <div class="detail-section">
            <div class="section-title">РЕЗУЛЬТАТЫ</div>
            <div class="results-empty">Нет результатов</div>
        </div>
    </div>
</div>
```

```css
.detail-section {
    margin-bottom: 20px;
}

.section-title {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.new { background: rgba(255,255,255,0.1); color: #aaa; }
.status-badge.running { background: rgba(78,205,196,0.2); color: #4ECDC4; }
.status-badge.done { background: rgba(50,205,50,0.2); color: #32CD32; }
.status-badge.error { background: rgba(255,107,107,0.2); color: #FF6B6B; }

.info-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
}

.info-label { color: rgba(255,255,255,0.5); }
.info-value { color: #fff; }
```

---

## ПОРЯДОК ДЕЙСТВИЙ

1. `cp index_v3.7.html index_v3.8.html`
2. ✅ Добавь левую icon-bar (БАГ 1)
3. ✅ Удали лишнюю кнопку Nodes (БАГ 2)
4. ✅ Сделай Node Editor модальным окном (БАГ 3)
5. ✅ Переделай ноды с сокетами (БАГ 4)
6. ✅ Унифицируй цвета панелей (БАГ 5)
7. ✅ Добавь updateCameraAspect (БАГ 6)
8. ✅ Структурируй данные в правой панели (БАГ 7)
9. Протестируй в браузере: `open index_v3.8.html`

---

## НЕ ДЕЛАЙ

1. ❌ НЕ трогай папку `src/` и React файлы
2. ❌ НЕ меняй `index_v3.6.html` и `index_v3.7.html`
3. ❌ НЕ добавляй синие цвета
4. ❌ НЕ ломай существующую логику 3D сцены

---

## РЕЗУЛЬТАТ

Файл `index_v3.8.html` должен:
- ✅ Показывать левую icon-bar (48px) ВСЕГДА
- ✅ Иметь ОДНУ кнопку Nodes (справа внизу)
- ✅ Node Editor = модальное окно 85vw × 75vh
- ✅ Ноды с сокетами (Grasshopper стиль)
- ✅ Единый цвет всех панелей (#0a0a0a)
- ✅ Облако точек сохраняет пропорции сферы
- ✅ Структурированные данные в правой панели

---

*Работай ТОЛЬКО с HTML файлом!*
