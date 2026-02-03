# ЗАДАНИЕ ДЛЯ GEMINI: Новый UI v2

> **ВАЖНО:** Читай ВНИМАТЕЛЬНО. Делай ТОЧНО по инструкции. НЕ импровизируй.

---

## ОБЩИЕ ПРАВИЛА

1. **Фон ЧЁРНЫЙ везде** — `#000000` или `#050505`, НИКАКИХ синих оттенков (`#1a1a2e`, `#16213e`, `#0f0f23` — ЭТО ЗАПРЕЩЕНО)
2. **Овальные формы** — все кнопки, панели, иконки с `border-radius: 9999px` или `rounded-full`
3. **Минимализм** — ничего лишнего, только нужные элементы
4. **Плавающие панели** — можно перетаскивать (draggable)

---

## СТРУКТУРА UI

### 1. ЭКРАН IDLE (Первый экран)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                     [Облако точек]                  │
│                                                     │
│                        VZOR                         │
│                  capital data system                │
│                                                     │
│                   [Enter System]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Требования:**
- Облако точек на фоне (Three.js canvas)
- Название VZOR по центру
- Кнопка "Enter System" — овальная, прозрачная с белой рамкой

---

### 2. ЭКРАН INCUBATOR (Выбор направления)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                     [Облако точек                   │
│                      с 3 кластерами]                │
│                                                     │
│     Development      Finance      Real Estate       │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**КРИТИЧНО — Названия СТАТИЧНЫЕ:**
```jsx
{/* НАЗВАНИЯ ВЫНЕСЕНЫ ЗА containerRef */}
<div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center gap-16">
    <div className="pointer-events-auto cursor-pointer opacity-60 hover:opacity-100">
        Development
    </div>
    <div className="opacity-60">Finance</div>
    <div className="opacity-60">Real Estate</div>
</div>
```

**Названия НЕ должны двигаться при вращении облака!**
- `position: fixed` — относительно viewport, не canvas
- Находятся СНАРУЖИ от `containerRef` (который содержит canvas)

---

### 3. ЭКРАН WORK (Рабочий режим)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Облако точек — однородное, без кластеров]         │
│                                                     │
│                                                     │
│           ┌──────────────────────────┐              │
│           │ 🎤  Введите задачу...  ➜ │  ← Плавающая │
│           └──────────────────────────┘    панель    │
│                                                     │
│                              ┌──────────┐           │
│                              │ ⚙ Nodes  │ ← Кнопка  │
│                              └──────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## КОМПОНЕНТЫ

### A. Плавающая панель ввода (FloatingInput)

**Характеристики:**
- Размер: ~300px ширина, 44px высота
- Форма: овальная (`rounded-full`)
- Фон: `rgba(255,255,255,0.08)` (полупрозрачный)
- Рамка: `1px solid rgba(255,255,255,0.15)`
- Позиция: по умолчанию внизу по центру, но **можно перетаскивать**

**Структура:**
```jsx
<div
    className="fixed z-50 cursor-move"
    style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)' }}
    // + логика drag
>
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-sm">
        {/* Кнопка микрофона */}
        <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            🎤
        </button>

        {/* Текстовое поле */}
        <input
            type="text"
            placeholder="Введите задачу..."
            className="flex-1 bg-transparent border-none outline-none text-white text-sm"
            style={{ minWidth: '200px' }}
        />

        {/* Кнопка отправки */}
        <button className="w-8 h-8 rounded-full bg-cyan-500/80 hover:bg-cyan-400 flex items-center justify-center">
            ➜
        </button>
    </div>
</div>
```

**Логика Drag:**
```jsx
const [position, setPosition] = useState({ x: 0, y: 80 });
const [isDragging, setIsDragging] = useState(false);

const handleMouseDown = (e) => {
    setIsDragging(true);
    // запомнить offset
};

const handleMouseMove = (e) => {
    if (isDragging) {
        setPosition({ x: e.clientX - offset.x, y: window.innerHeight - e.clientY });
    }
};

const handleMouseUp = () => setIsDragging(false);
```

---

### B. Кнопка Node Editor (FloatingNodeButton)

**Характеристики:**
- Размер: компактная овальная кнопка
- Позиция: правый нижний угол
- По клику: открывает модальное окно с Node Editor

**Структура:**
```jsx
<button
    className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-all"
    onClick={() => setNodeEditorOpen(true)}
>
    <Settings size={14} />
    Nodes
</button>
```

---

### C. Модальное окно Node Editor

**Характеристики:**
- Размер: 80% ширины, 70% высоты экрана
- Позиция: по центру
- Фон: `#0a0a0a` с лёгким border
- Можно закрыть крестиком или кликом вне окна

**Структура:**
```jsx
{nodeEditorOpen && (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={() => setNodeEditorOpen(false)}>
        <div
            className="w-[80vw] h-[70vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/10">
                <span className="text-sm text-white/70">Node Editor</span>
                <button onClick={() => setNodeEditorOpen(false)} className="text-white/50 hover:text-white">
                    ✕
                </button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-48px)]">
                <NodeEditor />
            </div>
        </div>
    </div>
)}
```

---

### D. Левая панель (IconBar + Panel) — УПРОСТИТЬ

**Вместо громоздкой панели:**
- Маленькие овальные иконки слева
- По клику — выезжает панель
- Фон панели: `#0a0a0a` (почти чёрный), НЕ синий

```jsx
<div className="fixed left-0 top-0 bottom-0 z-40 flex">
    {/* Icon Bar */}
    <div className="w-12 bg-black/50 backdrop-blur-sm border-r border-white/5 flex flex-col items-center py-4 gap-2">
        <IconButton icon="📊" active={panel === 'invest'} onClick={() => togglePanel('invest')} />
        <IconButton icon="✏️" onClick={() => togglePanel('design')} />
        <IconButton icon="🏗️" onClick={() => togglePanel('build')} />
        <IconButton icon="💰" onClick={() => togglePanel('sales')} />
    </div>

    {/* Panel */}
    <div className={`w-64 bg-[#0a0a0a] border-r border-white/5 transition-all ${panel ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* content */}
    </div>
</div>
```

---

## ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

1. **`src/components/Layout/GeminiLayout.tsx`** — переписать полностью
2. **`src/components/Layout/Layout.css`** — убрать все синие цвета
3. **`src/components/Viewport3D_V3.tsx`** — проверить структуру INCUBATOR лейблов

---

## ЦВЕТОВАЯ ПАЛИТРА

| Элемент | Цвет | Код |
|---------|------|-----|
| Фон | Чёрный | `#000000` |
| Панели | Почти чёрный | `#0a0a0a` |
| Рамки | Белый 10% | `rgba(255,255,255,0.1)` |
| Текст основной | Белый 90% | `rgba(255,255,255,0.9)` |
| Текст вторичный | Белый 50% | `rgba(255,255,255,0.5)` |
| Акцент | Cyan | `#4ECDC4` |
| Hover | Белый 10% | `rgba(255,255,255,0.1)` |

**ЗАПРЕЩЁННЫЕ ЦВЕТА:**
- `#1a1a2e` ❌
- `#16213e` ❌
- `#0f0f23` ❌
- Любые синие оттенки ❌

---

## ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ

- [ ] Фон чёрный везде (открой DevTools, проверь)
- [ ] Лейблы INCUBATOR не двигаются при вращении
- [ ] Облако точек видно в WORK режиме
- [ ] Плавающая панель ввода работает
- [ ] Панель ввода можно перетаскивать
- [ ] Кнопка Nodes открывает модальное окно
- [ ] Текстовый ввод создаёт задачу
- [ ] Точки кликабельны

---

## НЕ ДЕЛАЙ

1. ❌ НЕ добавляй синие цвета
2. ❌ НЕ делай bottom-bar на всю ширину
3. ❌ НЕ делай Node Editor как полосу снизу
4. ❌ НЕ меняй логику Three.js без необходимости
5. ❌ НЕ удаляй существующие функции

---

*Следуй этой инструкции ТОЧНО!*
