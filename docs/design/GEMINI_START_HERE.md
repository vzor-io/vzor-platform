# GEMINI: НАЧНИ ОТСЮДА

> **Порядок действий. Следуй СТРОГО.**

---

## ШАГ 1: Прочитай документацию

1. `docs/design/GEMINI_CSS_FIXES.md` — исправления цветов
2. `docs/design/GEMINI_UI_V2.md` — новый дизайн UI
3. `docs/design/GEMINI_FIXES_URGENT.md` — критические баги

---

## ШАГ 2: Исправь CSS (ПЕРВЫМ ДЕЛОМ!)

Файл: `web_platform_v2/frontend/src/components/Layout/Layout.css`

Замени ВСЕ синие цвета:
- `#1a1a2e` → `#0a0a0a`
- `#16213e` → `#0a0a0a`
- `#0f0f23` → `#000000`

---

## ШАГ 3: Переделай GeminiLayout

Файл: `web_platform_v2/frontend/src/components/Layout/GeminiLayout.tsx`

**Убрать:**
- Громоздкий bottom-bar на всю ширину
- Node Editor как полоса снизу

**Добавить:**
- Плавающую панель ввода (draggable)
- Маленькую овальную кнопку "Nodes"
- Модальное окно для Node Editor

См. детали в `GEMINI_UI_V2.md`

---

## ШАГ 4: Проверь Viewport3D_V3

Файл: `web_platform_v2/frontend/src/components/Viewport3D_V3.tsx`

**Убедись:**
- Лейблы INCUBATOR находятся СНАРУЖИ `containerRef`
- Они имеют `className="fixed ... z-20"`
- Они НЕ двигаются при вращении камеры

---

## ШАГ 5: Сборка и тест

```bash
cd web_platform_v2/frontend
npm run build
```

Если есть ошибки TypeScript — исправь их.

---

## ШАГ 6: Локальный тест

```bash
npm run dev
```

Открой http://localhost:5173 и проверь:
- [ ] Фон чёрный
- [ ] Лейблы не двигаются
- [ ] Облако видно в WORK
- [ ] Ввод работает

---

## ШАГ 7: Деплой

```bash
npm run deploy
```

Дождись "Published".

---

## ЗАПРЕЩЕНО

1. ❌ Менять логику Three.js
2. ❌ Удалять существующие функции
3. ❌ Добавлять синие цвета
4. ❌ Делать UI громоздким
5. ❌ Импровизировать

---

## РАЗРЕШЕНО

1. ✅ Менять CSS цвета
2. ✅ Менять структуру компонентов
3. ✅ Добавлять плавающие панели
4. ✅ Упрощать интерфейс

---

*Следуй инструкциям ТОЧНО!*
