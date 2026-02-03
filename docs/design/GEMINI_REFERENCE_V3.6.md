# GEMINI: Эталонная версия — index_v3.6.html

> **ВАЖНО:** Файл `web_platform_v2/frontend/index_v3.6.html` — это ЭТАЛОН.
> Все изменения должны соответствовать логике этого файла!

---

## Структура экранов в 3.6

### ЭКРАН 1: IDLE (smoothP = 0)
- Облако точек — равномерная сфера
- Центральный текст: "VZOR" + "capital data system"
- Клик или скролл → переход к экрану 2

### ЭКРАН 2: INCUBATOR (smoothP = 1)
- Облако с 3 кластерами
- Лейблы: Development, Finance, Real Estate
- Лейблы = THREE.Sprite (вращаются с облаком!)
- Клик на лейбл → drill down + показать task-interface

### ЭКРАН 3: WORK (drillProg = 1)
- Detail panel справа
- Task interface снизу (floating pill)
- Можно создавать задачи

---

## Код лейблов из 3.6 (ЭТАЛОН)

```javascript
// --- Labels (THREE.Sprite) ---
const coreData = [
    { name: "Development", pos: new THREE.Vector3(-130, 0, 0), scale: 0.75 },
    { name: "Finance", pos: new THREE.Vector3(0, 0, 95), scale: 1.4 },
    { name: "Real Estate", pos: new THREE.Vector3(130, 0, 0), scale: 0.75 }
];

function createLabel(text, pos, scaleFactor) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512; canvas.height = 128;
    ctx.font = '300 48px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '5px';
    ctx.fillText(text.toUpperCase(), 256, 75);

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            opacity: 0  // Fade in via animation
        })
    );

    sprite.position.copy(pos).multiplyScalar(1.2);
    sprite.scale.set(130 * scaleFactor, 32 * scaleFactor, 1);
    return sprite;
}

const labels = coreData.map(c => createLabel(c.name, c.pos, c.scale));
labels.forEach(l => group.add(l));  // Добавляются в группу!
```

**ВАЖНО:** Лейблы добавлены в `group` — они вращаются вместе с облаком!

---

## Task Interface из 3.6 (ЭТАЛОН)

```css
#task-interface {
    position: fixed;
    bottom: -150px;  /* Скрыт по умолчанию */
    left: 50%;
    transform: translateX(-50%);
    min-width: 320px;
    max-width: 600px;
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 6px 14px;
    border-radius: 30px;  /* Овальная форма */
    z-index: 100;
    transition: bottom 0.6s ease;
    display: flex;
    align-items: center;
    gap: 10px;
}

#task-interface.active {
    bottom: 30px;  /* Показывается */
}
```

---

## Detail Panel из 3.6

```css
#detail-panel {
    position: fixed;
    top: 50%;
    right: -450px;  /* Скрыт справа */
    transform: translateY(-50%);
    width: 360px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 50px 35px;
    z-index: 100;
    transition: right 0.8s ease;
    border-radius: 20px 0 0 20px;
}

#detail-panel.active {
    right: 0;
}
```

---

## Логика переходов

1. **IDLE → INCUBATOR:**
   - Скролл вниз или клик
   - `targetP = 1.0`
   - Облако морфится в 3 кластера
   - Лейблы появляются (opacity fade in)

2. **INCUBATOR → WORK:**
   - Клик на лейбл (Development/Finance/Real Estate)
   - `isDrilled = true`
   - Detail panel выезжает справа
   - Task interface появляется снизу

3. **WORK → INCUBATOR:**
   - Кнопка "Back"
   - `isDrilled = false`
   - Panel и interface скрываются

---

## Цвета (ЭТАЛОН)

- Фон: `#000000` (чистый чёрный)
- Панели: `rgba(0, 0, 0, 0.85)` или `rgba(10, 10, 10, 0.85)`
- Рамки: `rgba(255, 255, 255, 0.1)` или `rgba(255, 255, 255, 0.15)`
- Текст: `#ffffff` или `rgba(255, 255, 255, 0.7)`

**ЗАПРЕЩЕНО:** Синие цвета типа `#1a1a2e`, `#16213e`, `#0f0f23`

---

## Как использовать этот документ

1. Открой `index_v3.6.html` в браузере — это эталон
2. Сравни поведение с React версией
3. Портируй логику, сохраняя визуал 3.6

---

*index_v3.6.html — единственный источник правды для визуала и логики!*
