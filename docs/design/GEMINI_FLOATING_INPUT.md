# GEMINI: Плавающая панель ввода — Полный код

> Копируй и адаптируй этот компонент

---

## Компонент FloatingInput.tsx

Создай файл: `web_platform_v2/frontend/src/components/UI/FloatingInput.tsx`

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';

interface FloatingInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onMicClick?: () => void;
    isListening?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
    value,
    onChange,
    onSubmit,
    onMicClick,
    isListening = false
}) => {
    // Позиция панели (можно перетаскивать)
    const [position, setPosition] = useState({ x: 0, y: 80 }); // x от центра, y от низа
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT') return; // Не drag при клике на input
        setIsDragging(true);
        const rect = panelRef.current?.getBoundingClientRect();
        if (rect) {
            dragOffset.current = {
                x: e.clientX - rect.left - rect.width / 2,
                y: e.clientY - rect.top - rect.height / 2
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = e.clientX - window.innerWidth / 2 - dragOffset.current.x;
            const newY = window.innerHeight - e.clientY - dragOffset.current.y;
            setPosition({ x: newX, y: Math.max(20, newY) });
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim()) {
            onSubmit();
        }
    };

    return (
        <div
            ref={panelRef}
            className="fixed z-50"
            style={{
                bottom: `${position.y}px`,
                left: '50%',
                transform: `translateX(calc(-50% + ${position.x}px))`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md shadow-lg">
                {/* Микрофон */}
                <button
                    onClick={onMicClick}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isListening
                            ? 'bg-red-500/80 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                >
                    <Mic size={18} />
                </button>

                {/* Текстовое поле */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите задачу..."
                    className="bg-transparent border-none outline-none text-white text-sm placeholder:text-white/40"
                    style={{ width: '220px' }}
                />

                {/* Отправить */}
                <button
                    onClick={onSubmit}
                    disabled={!value.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        value.trim()
                            ? 'bg-cyan-500/80 text-black hover:bg-cyan-400'
                            : 'bg-white/10 text-white/30'
                    }`}
                >
                    <Send size={16} />
                </button>
            </div>

            {/* Индикатор drag */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/20" />
        </div>
    );
};
```

---

## Использование в GeminiLayout

```tsx
import { FloatingInput } from '../UI/FloatingInput';

// В компоненте GeminiLayout:
<FloatingInput
    value={inputText}
    onChange={setInputText}
    onSubmit={handleCreateTask}
    onMicClick={() => console.log('Mic clicked')}
    isListening={false}
/>
```

---

## Стили

Панель использует Tailwind классы:
- `rounded-full` — овальная форма
- `bg-white/[0.06]` — почти прозрачный фон
- `border-white/[0.12]` — тонкая белая рамка
- `backdrop-blur-md` — размытие фона
- `shadow-lg` — тень для глубины

---

## Результат

```
                    ┌──────────────────────────────────┐
                    │  🎤  │  Введите задачу...  │  ➜  │
                    └──────────────────────────────────┘
                                    ▄
                              (можно тащить)
```

---

*Используй этот код как основу!*
