# GEMINI: Создай версию 3.10

> **ОБЯЗАТЕЛЬНО:** Прочитай `NODE_EDITOR_ARCHITECTURE.md` перед началом работы!

---

## ЧТО ТЫ СДЕЛАЛ НЕ ТАК В 3.9

### ❌ Проблема 1: Node Editor как модалка
**Было:** Окно появляется по центру экрана
**Надо:** Панель ВЫДВИГАЕТСЯ СНИЗУ и пользователь сам регулирует размер

### ❌ Проблема 2: Голосовой ввод не работает
Кнопка микрофона ничего не делает

### ❌ Проблема 3: Иконки из 90-х
Эмодзи 📊📐🏗💰 выглядят дёшево
**Надо:** SVG иконки в хай-тек стиле (тонкие линии, прозрачность)

### ❌ Проблема 4: Ноды не проработаны
- Нет реальных входов/выходов
- Нет способа соединить ноды
- Непонятно что входит, что выходит

---

## ЗАДАЧИ ДЛЯ v3.10

### 1. Node Editor — ВЫДВИЖНАЯ ПАНЕЛЬ СНИЗУ

**Удали** текущую модалку `#node-editor-modal`

**Добавь** панель снизу:

```html
<!-- Node Editor Panel (Bottom) -->
<div id="node-editor-panel">
    <!-- Resize Handle -->
    <div id="node-editor-resize-handle"></div>

    <!-- Header -->
    <div id="node-editor-header">
        <span>Node Editor</span>
        <div class="header-controls">
            <button onclick="minimizeNodeEditor()">−</button>
            <button onclick="closeNodeEditor()">×</button>
        </div>
    </div>

    <!-- Content (где ноды) -->
    <div id="node-editor-content">
        <!-- Ноды будут здесь -->
    </div>
</div>
```

```css
#node-editor-panel {
    position: fixed;
    bottom: 0;
    left: 48px;  /* После icon-bar */
    right: 0;
    height: 0;  /* Скрыта по умолчанию */
    background: #0a0a0a;
    border-top: 1px solid rgba(255,255,255,0.15);
    z-index: 100;
    display: flex;
    flex-direction: column;
    transition: height 0.3s ease;
}

#node-editor-panel.open {
    height: 35vh;  /* Начальная высота */
}

#node-editor-resize-handle {
    position: absolute;
    top: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: ns-resize;
    background: transparent;
    z-index: 10;
}

#node-editor-resize-handle:hover,
#node-editor-resize-handle.active {
    background: linear-gradient(to bottom,
        rgba(78, 205, 196, 0.5),
        transparent
    );
}

#node-editor-header {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.5);
    font-size: 13px;
    color: rgba(255,255,255,0.7);
}

#node-editor-content {
    flex: 1;
    overflow: auto;
    position: relative;
    background: #050505;
}
```

**JavaScript для resize:**

```javascript
// Resizable Node Editor
(function() {
    const panel = document.getElementById('node-editor-panel');
    const handle = document.getElementById('node-editor-resize-handle');
    let isResizing = false;
    let startY, startHeight;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = panel.offsetHeight;
        handle.classList.add('active');
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaY = startY - e.clientY;
        const newHeight = Math.max(100, Math.min(window.innerHeight * 0.8, startHeight + deltaY));

        panel.style.height = newHeight + 'px';

        // Обновить 3D сцену
        if (window.updateCameraAspect) {
            window.updateCameraAspect();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            handle.classList.remove('active');
            document.body.style.cursor = '';
        }
    });

    // Двойной клик = развернуть на 50%
    handle.addEventListener('dblclick', () => {
        panel.style.height = '50vh';
        if (window.updateCameraAspect) {
            window.updateCameraAspect();
        }
    });
})();

function openNodeEditor() {
    const panel = document.getElementById('node-editor-panel');
    panel.classList.add('open');
    setTimeout(() => {
        if (window.updateCameraAspect) window.updateCameraAspect();
    }, 350);
}

function closeNodeEditor() {
    const panel = document.getElementById('node-editor-panel');
    panel.classList.remove('open');
    panel.style.height = '';  // Reset to CSS default
    setTimeout(() => {
        if (window.updateCameraAspect) window.updateCameraAspect();
    }, 350);
}

function minimizeNodeEditor() {
    const panel = document.getElementById('node-editor-panel');
    panel.style.height = '40px';  // Только header
}
```

---

### 2. Обновить updateCameraAspect для панели

```javascript
window.updateCameraAspect = function() {
    if (!camera || !renderer) return;

    const nodePanel = document.getElementById('node-editor-panel');
    const nodePanelHeight = nodePanel && nodePanel.classList.contains('open')
        ? nodePanel.offsetHeight
        : 0;

    const width = window.innerWidth - 48;  // Минус icon-bar
    const height = window.innerHeight - nodePanelHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Обновить позицию canvas
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.style.height = height + 'px';
        wrapper.style.left = '48px';
    }
};
```

---

### 3. Голосовой ввод (Web Speech API)

```javascript
// Voice Input
(function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Speech Recognition not supported');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    const micBtn = document.getElementById('mic-btn');
    const taskInput = document.getElementById('task-input');
    let isListening = false;

    if (!micBtn) return;

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            micBtn.classList.add('listening');
            isListening = true;
        }
    });

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        taskInput.value = text;
        console.log('Voice input:', text);
    };

    recognition.onend = () => {
        micBtn.classList.remove('listening');
        isListening = false;
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        micBtn.classList.remove('listening');
        isListening = false;
    };
})();
```

```css
#mic-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2);
    background: transparent;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

#mic-btn:hover {
    border-color: rgba(255,255,255,0.4);
    color: white;
}

#mic-btn.listening {
    background: rgba(255, 107, 107, 0.2);
    border-color: #FF6B6B;
    color: #FF6B6B;
    animation: pulse-mic 1s ease-in-out infinite;
}

@keyframes pulse-mic {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
}
```

---

### 4. Иконки в хай-тек стиле (SVG)

**Замени эмодзи на SVG:**

```html
<div id="icon-bar">
    <!-- Invest -->
    <div class="icon-btn" title="Invest">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <path d="M3 3v18h18"/>
            <path d="M7 14l4-4 4 4 5-5"/>
        </svg>
    </div>

    <!-- Design -->
    <div class="icon-btn" title="Design">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h7v7"/>
        </svg>
    </div>

    <!-- Build -->
    <div class="icon-btn" title="Build">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <path d="M2 20h20"/>
            <path d="M5 20v-8l7-5 7 5v8"/>
            <path d="M10 20v-4h4v4"/>
        </svg>
    </div>

    <!-- Sales -->
    <div class="icon-btn" title="Sales">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3"/>
        </svg>
    </div>

    <div class="icon-separator"></div>

    <!-- Files -->
    <div class="icon-btn" title="Files">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <path d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7"/>
            <path d="M3 7l3-5h12l3 5"/>
            <path d="M12 11v6"/>
            <path d="M9 14h6"/>
        </svg>
    </div>

    <div style="flex:1"></div>

    <!-- Settings -->
    <div class="icon-btn" title="Settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
    </div>
</div>
```

```css
.icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.2s ease;
    margin: 4px 0;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
}

.icon-btn.active {
    background: rgba(78, 205, 196, 0.1);
    color: #4ECDC4;
}

.icon-btn svg {
    width: 20px;
    height: 20px;
}
```

---

## ПОРЯДОК ДЕЙСТВИЙ

1. `cp index_v3.9.html index_v3.10.html`
2. Удали модалку `#node-editor-modal`
3. Добавь панель `#node-editor-panel` снизу
4. Добавь resize логику
5. Обнови `updateCameraAspect`
6. Добавь голосовой ввод
7. Замени эмодзи на SVG иконки
8. **ПРОВЕРЬ ЛОКАЛЬНО!** (F12 → Console)
9. Только потом деплой

---

## НЕ ДЕЛАЙ

1. ❌ НЕ делай Node Editor как модалку по центру
2. ❌ НЕ используй эмодзи для иконок
3. ❌ НЕ деплой без проверки в Console
4. ❌ НЕ трогай папку `src/` и React

---

## ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ

```
□ Node Editor выезжает СНИЗУ
□ Можно тянуть за верхнюю границу (resize)
□ 3D сцена сжимается пропорционально (не эллипс!)
□ Голосовой ввод работает (красная пульсация при записи)
□ Иконки — SVG (тонкие линии, хай-тек)
□ В Console НЕТ красных ошибок
□ Облако точек отображается
```

---

*Прочитай NODE_EDITOR_ARCHITECTURE.md для понимания архитектуры нод!*
