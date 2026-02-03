# GEMINI: Node Editor как модальное окно

> Замени полосу снизу на компактную кнопку + модальное окно

---

## Кнопка Node Editor

Маленькая овальная кнопка в правом нижнем углу:

```tsx
import { Settings } from 'lucide-react';

// В GeminiLayout:
const [nodeEditorOpen, setNodeEditorOpen] = useState(false);

// JSX:
<button
    onClick={() => setNodeEditorOpen(true)}
    className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] hover:bg-white/10 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-all backdrop-blur-sm"
>
    <Settings size={14} />
    <span>Nodes</span>
</button>
```

---

## Модальное окно

Открывается по клику на кнопку:

```tsx
{nodeEditorOpen && (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={() => setNodeEditorOpen(false)}
    >
        <div
            className="w-[85vw] h-[75vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-5 border-b border-white/10 bg-black/50">
                <span className="text-sm font-medium text-white/80">Node Editor</span>
                <button
                    onClick={() => setNodeEditorOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                    ✕
                </button>
            </div>

            {/* Content — Node Editor Component */}
            <div className="h-[calc(100%-48px)]">
                {NodeEditorComponent}
            </div>
        </div>
    </div>
)}
```

---

## Анимация (опционально)

Добавь плавное появление:

```css
/* В Layout.css или inline */
.modal-enter {
    animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
```

```tsx
<div className="... modal-enter">
```

---

## Результат

**До (неправильно):**
```
┌─────────────────────────────────────────────────┐
│                    3D Canvas                    │
├─────────────────────────────────────────────────┤
│              NODE EDITOR (полоса)               │  ← Занимает место!
├─────────────────────────────────────────────────┤
│  Input...                    │ Nodes │          │
└─────────────────────────────────────────────────┘
```

**После (правильно):**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    3D Canvas                    │
│                                                 │
│        ┌───────────────────────────┐            │
│        │ 🎤  Введите задачу...  ➜  │            │  ← Плавающий
│        └───────────────────────────┘            │
│                                    ┌─────────┐  │
│                                    │ ⚙ Nodes │  │  ← Компактный
│                                    └─────────┘  │
└─────────────────────────────────────────────────┘

При клике на Nodes:
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │ Node Editor                           ✕  │  │
│  ├───────────────────────────────────────────┤  │
│  │                                           │  │
│  │              [Node Editor]                │  │  ← Модальное окно
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Удалить из Layout.css

Убери эти классы (они больше не нужны):

```css
/* УДАЛИТЬ: */
.bottom-bar { ... }
.node-editor-overlay { ... }
.node-editor-overlay.open { ... }
```

---

*Следуй этому дизайну!*
