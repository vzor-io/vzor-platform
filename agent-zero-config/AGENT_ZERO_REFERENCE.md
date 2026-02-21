# Agent Zero — Полный справочник

**Что это:** Автономный AI-фреймворк с открытым кодом. Агент работает в Docker-контейнере (Kali Linux), имеет полный root-доступ, выполняет код, ходит в интернет, **сам создаёт себе субагентов на лету**.

**GitHub:** https://github.com/frdel/agent-zero
**Наш сервер:** http://95.174.95.209:50080
**Docker-контейнер:** `vzor-agent-zero`
**Данные на хосте:** `/home/vzor/agent-zero-data/` (маунтится в контейнер как `/a0/usr/`)
**Исходники локально:** `C:\Users\solle\Desktop\vzor-ai.com\agent-core\`

---

## 1. Главная фича: динамическое создание субагентов

**Agent Zero сам решает, когда ему нужен помощник, и создаёт его на лету.**

Это не предустановленная система с фиксированными агентами. Агент A0 получает задачу, думает, и если задача сложная — он **сам** создаёт субагента (A1) через инструмент `call_subordinate`. Субагент A1 — это полноценный агент с доступом ко всем инструментам. Если A1 тоже решит, что ему нужна помощь — он создаст A2. И так далее.

### Как это работает

```
Пользователь: "Сделай финмодель проекта"

A0 (думает): "Это сложная аналитическая задача. Создам субагента-аналитика."
A0 → call_subordinate(profile="vzor-analyst", message="Сгенерируй финмодель...")
    │
    A1 (аналитик, думает): "Мне нужны рыночные данные. Создам субагента для исследования."
    A1 → call_subordinate(profile="", message="Найди цены на недвижимость в Москве...")
        │
        A2 (исследователь, думает): "Поищу в интернете и в RAGFlow."
        A2 → search_engine("цены недвижимость Москва 2026")
        A2 → code_execution_tool("ragflow_search.py search ...")
        A2 → response("Средняя цена: 280 000 руб./м2, источник: ...")
        │
    A1 получает данные от A2
    A1 → code_execution_tool("python: расчёт NPV, IRR...")
    A1 → code_execution_tool("cat > financial_model.md")
    A1 → response("Финмодель готова: NPV = 354 млн, IRR = 19.1%")
    │
A0 получает результат от A1
A0 → response("Финмодель создана. NPV = 354 млн руб. Файл: /workdir/...")
```

### Ключевые принципы

- **Агент сам решает** — никто не говорит ему "создай субагента". Он сам видит что задача сложная и делегирует
- **Нет ограничения глубины** — цепочка A0 → A1 → A2 → A3 → ... сколько угодно
- **Один активный субагент** за раз у каждого агента (но можно переключаться)
- **Два режима создания:**
  - `profile: "vzor-analyst"` — специализированный (берёт промпт из `agents/vzor-analyst/`)
  - `profile: ""` — универсальный (полный доступ ко всем инструментам, без спец. промпта)
- **Субагент = полноценный агент** — у него есть ВСЕ инструменты родителя: bash, Python, интернет, браузер, память, свои субагенты
- `reset: "true"` — создать нового субагента, `reset: "false"` — продолжить диалог с существующим
- **Результат возвращается вверх** по цепочке: A2 → A1 → A0 → пользователь

### Зачем это нужно

| Без субагентов | С субагентами |
|----------------|---------------|
| Один агент делает всё сам | Агент декомпозирует и делегирует |
| Контекст забивается | Каждый субагент — чистый контекст |
| Теряет фокус на большой задаче | Каждый фокусируется на своей подзадаче |
| Один провал — всё сломалось | Субагент может повторить без потери основной работы |

---

## 2. Архитектура

Agent Zero — это **цикл**: получил сообщение → подумал (thoughts) → вызвал инструмент (tool) → получил результат → подумал снова → ... пока задача не решена.

**Каждый ответ агента — строго JSON:**
```json
{
    "thoughts": ["шаг 1...", "шаг 2..."],
    "headline": "Краткое описание действия",
    "tool_name": "имя_инструмента",
    "tool_args": { "arg1": "val1" }
}
```

Никакого свободного текста — только JSON. Для ответа пользователю используется tool `response`.

### Иерархия агентов

```
A0 (главный агент) — общается с пользователем
├── A1 (субагент) — A0 создал его сам, когда решил что нужно
│   ├── A2 (суб-субагент) — A1 создал его сам
│   │   └── A3 — A2 создал его сам ...
│   └── ...
└── ...
```

Всё это происходит **динамически в рантайме**. Заранее ничего не настроено — агент сам решает кого и когда создавать.

Мы **предварительно настроили 4 профиля** (vzor-analyst, vzor-planner, vzor-deployer, vzor-debugger) со специализированными промптами. Но агент может создать субагента и **без профиля** (`profile: ""`) — тогда это универсальный агент, который умеет всё

---

## 2. Встроенные инструменты (tools)

Все tools вызываются через JSON в поле `tool_name`. Это НЕ bash-команды — это встроенные в фреймворк функции.

### 2.1 response — ответ пользователю
```json
{ "tool_name": "response", "tool_args": { "text": "Текст ответа" } }
```
Единственный способ отправить текст пользователю.

### 2.2 call_subordinate — создание субагентов
```json
{
    "tool_name": "call_subordinate",
    "tool_args": {
        "profile": "vzor-analyst",
        "message": "Ты аналитик. Задача: ...",
        "reset": "true"
    }
}
```
- `profile` — имя папки в `agents/` (или `""` для универсального)
- `message` — описание роли и задачи для субагента
- `reset` — `"true"` = новый, `"false"` = продолжить

### 2.3 code_execution_tool — выполнение кода
```json
{
    "tool_name": "code_execution_tool",
    "tool_args": {
        "runtime": "terminal",
        "session": 0,
        "code": "ls -la /root"
    }
}
```
**Рантаймы:**
| runtime | Что делает |
|---------|-----------|
| `terminal` | Bash-команда (apt-get, pip, любые CLI) |
| `python` | Python-код (print() для вывода) |
| `nodejs` | Node.js код (console.log() для вывода) |
| `output` | Дождаться вывода долгого процесса |
| `reset` | Убить зависший процесс |

**Сессии:** `session: 0` по умолчанию, другие номера для параллельных задач.

### 2.4 memory_save / memory_load / memory_delete / memory_forget — долговременная память
```json
{ "tool_name": "memory_save", "tool_args": { "text": "Важная информация..." } }
{ "tool_name": "memory_load", "tool_args": { "query": "поиск", "threshold": 0.7, "limit": 5 } }
{ "tool_name": "memory_delete", "tool_args": { "ids": "uuid1, uuid2" } }
{ "tool_name": "memory_forget", "tool_args": { "query": "тема", "threshold": 0.75 } }
```
Память хранится в `memory/` (текст + FAISS-эмбеддинги). Сохраняется между сессиями.

### 2.5 search_engine — поиск в интернете
```json
{ "tool_name": "search_engine", "tool_args": { "query": "запрос" } }
```
Возвращает список URL, заголовков, описаний. Использует SearXNG на нашем сервере.

### 2.6 browser_agent — управление браузером
```json
{
    "tool_name": "browser_agent",
    "tool_args": {
        "message": "Открой google.com и найди...",
        "reset": "true"
    }
}
```
Отдельный субагент с Playwright. Может логиниться, кликать, скачивать файлы. Загрузки: `/a0/tmp/downloads`.

### 2.7 document_query — чтение документов
```json
{
    "tool_name": "document_query",
    "tool_args": {
        "document": "https://example.com/file.pdf",
        "queries": ["Какая цена?", "Кто автор?"]
    }
}
```
Читает HTML, PDF, Office, текст. Локальные файлы: `file:///path/to/file`. Без `queries` — возвращает весь текст.

### 2.8 scheduler — планировщик задач
Три типа задач:

| Тип | Описание | Запуск |
|-----|----------|--------|
| `scheduled` | По расписанию (crontab: `*/5 * * * *`) | Автоматический |
| `planned` | По списку дат (`2025-04-29T18:25:00`) | Автоматический |
| `adhoc` | Ручной запуск | По команде или из UI |

**Инструменты планировщика:**
- `scheduler:create_scheduled_task` — cron-задача
- `scheduler:create_planned_task` — задача по датам
- `scheduler:create_adhoc_task` — ручная задача
- `scheduler:run_task` — запустить задачу
- `scheduler:list_tasks` — список задач
- `scheduler:show_task` — детали задачи
- `scheduler:delete_task` — удалить задачу
- `scheduler:wait_for_task` — дождаться результата

Задачи могут работать в **отдельном контексте** (`dedicated_context: true`) — собственный чат.

### 2.9 notify_user — уведомления
```json
{
    "tool_name": "notify_user",
    "tool_args": {
        "message": "Задача выполнена!",
        "title": "Готово",
        "type": "success"
    }
}
```
Типы: `info`, `success`, `warning`, `error`, `progress`.

### 2.10 behaviour_adjustment — изменение поведения
```json
{ "tool_name": "behaviour_adjustment", "tool_args": { "adjustments": "Всегда отвечай по-русски" } }
```
Пользователь может менять правила поведения агента на лету.

### 2.11 input — ввод в терминал
```json
{ "tool_name": "input", "tool_args": { "keyboard": "Y", "session": 0 } }
```
Для ответа на интерактивные запросы программ (Y/N, пароли и т.д.).

### 2.12 wait — пауза
```json
{ "tool_name": "wait", "tool_args": { "minutes": 5 } }
```
Или до конкретного времени: `{ "until": "2025-10-20T10:00:00Z" }`.

### 2.13 a2a_chat — связь с внешними агентами
```json
{
    "tool_name": "a2a_chat",
    "tool_args": {
        "agent_url": "http://other-agent:8000/a2a",
        "message": "Привет, какая погода?",
        "reset": false
    }
}
```
Agent-to-Agent протокол (FastA2A v0.2+). Агент может общаться с ДРУГИМИ AI-агентами по сети.

---

## 3. Система промптов

Промпт агента собирается из нескольких файлов:

```
agent.system.main.md                   ← Точка входа (include остальных)
├── agent.system.main.role.md          ★ МЫ РЕДАКТИРУЕМ ЭТОТ ФАЙЛ
├── agent.system.main.environment.md   Среда: Kali Linux, Docker, /a0
├── agent.system.main.communication.md Формат JSON, replacements, include
├── agent.system.main.solving.md       Алгоритм решения задач
└── agent.system.main.tips.md          Советы, instruments, best practices

+ Динамически подгружаются:
├── agent.system.tools.md              Список доступных tools
├── agent.system.instruments.md        Список кастомных instruments
├── agent.system.memories.md           Релевантные воспоминания
├── agent.system.solutions.md          Прошлые решения
├── agent.system.secrets.md            Секреты (§§secret(key))
├── agent.system.behaviour.md          Правила поведения
├── agent.system.projects.main.md      Проекты
└── agent.system.tool.*.md             Описание каждого tool
```

### Что мы можем кастомизировать

| Файл | Путь (на сервере) | Что делает |
|------|-------------------|-----------|
| **role.md** | `agents/agent0/prompts/agent.system.main.role.md` | Роль, личность, инструкции — ГЛАВНЫЙ файл |
| **_context.md** | `agents/agent0/_context.md` | Контекст проекта (видит всегда) |
| **tool.response.md** | `agents/agent0/prompts/agent.system.tool.response.md` | Кастомизация ответов |
| **Профили субагентов** | `agents/<profile>/prompts/agent.system.main.role.md` | Роль для субагентов |
| **Instruments** | `instruments/custom/<name>/<name>.md + .py` | Кастомные инструменты |
| **Knowledge** | `knowledge/custom/main/*.md` | База знаний (FAISS автоиндекс) |

### Replacements (подстановки в промптах)
- `{{ include "file.md" }}` — включить другой файл
- `{{tools}}` — список tools
- `{{instruments}}` — список instruments
- `{{memories}}` — релевантные воспоминания
- `{{solutions}}` — прошлые решения
- `{{secrets}}` — секреты
- `{{rules}}` — правила поведения
- `{{agent_profiles}}` — список профилей субагентов
- `§§include(/path/to/file)` — включить файл в tool_args
- `§§secret(key_name)` — подставить секрет

---

## 4. Knowledge (база знаний)

**Путь:** `knowledge/custom/main/`
**Технология:** FAISS (векторный поиск по эмбеддингам)
**Автоиндексация:** При запуске контейнера все `.md` файлы автоматически индексируются

Агент НЕ использует knowledge напрямую — фреймворк автоматически ищет релевантные фрагменты и вставляет в контекст. Но агент также может читать файлы явно:
```bash
cat /a0/usr/knowledge/custom/main/имя_файла.md
```

### Наши файлы в knowledge (106 шт.):
- `00-vzor-overview.md` — `06-normative-reference.md` (7 справочников)
- `mm_m01_*.md` — `mm_m101_*.md` (99 ментальных моделей)

---

## 5. Instruments (кастомные инструменты)

**Путь:** `instruments/custom/<name>/`
**Структура:** `<name>.md` (описание) + `<name>.py` (код)

Instruments — это НЕ встроенные tools. Описание из `.md` попадает в промпт, а код вызывается через `code_execution_tool`:
```bash
/opt/venv/bin/python3 /a0/usr/instruments/custom/<name>/<name>.py аргументы
```

### Наши instruments:
| Имя | Что делает |
|-----|-----------|
| `ragflow_search` | Поиск по 13 нормативным базам RAGFlow |
| `vzor_tasks` | Управление задачами в PostgreSQL → 3D-граф |
| `vzor_deploy` | Деплой на сервер |
| `vzor_diagnostics` | Диагностика сервера |
| `vzor_git` | Git операции |
| `vzor_backup` | Бэкапы |

---

## 6. Memory (память)

**Путь:** `memory/`
- `default/` — текстовые воспоминания (JSON)
- `embeddings/` — FAISS-векторы для семантического поиска

**Как работает:**
1. Агент сам решает что запомнить (`memory_save`)
2. При новом вопросе фреймворк автоматически ищет похожие воспоминания
3. Релевантные вставляются в промпт через `{{memories}}`
4. Агент может искать явно (`memory_load`) и удалять (`memory_delete`, `memory_forget`)

Память **персистентная** — сохраняется между перезапусками контейнера.

---

## 7. Projects (проекты)

**Путь:** `/usr/projects/<name>/`
**Конфиг:** `/usr/projects/<name>/.a0proj`

- Пользователь создаёт проекты в UI
- У каждого проекта своя рабочая папка и инструкции
- Активный проект влияет на поведение агента
- Агент НЕ может сам переключать проекты

---

## 8. Docker и деплой

**Контейнер:** `vzor-agent-zero`
**Образ:** Kali Linux (root-доступ, полный набор инструментов)
**Маунты:**

| Хост | Контейнер | Что |
|------|-----------|-----|
| `/home/vzor/agent-zero-data/` | `/a0/usr/` | Все данные агента |

**Управление:**
```bash
# В составе VZOR стека
cd /home/vzor/vzor && docker compose up -d
cd /home/vzor/vzor && docker compose stop

# Перезапуск только агента
docker restart vzor-agent-zero

# Логи
docker logs vzor-agent-zero -f --tail 100

# Зайти внутрь контейнера
docker exec -it vzor-agent-zero bash
```

**API:**
```bash
# Отправить сообщение агенту
curl -X POST http://95.174.95.209:50080/api_message \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: vzor-agent-key-2026" \
  -d '{"message": "Привет"}'
```

**Web UI:** http://95.174.95.209:50080

---

## 9. Что агент МОЖЕТ делать

| Возможность | Как |
|------------|-----|
| Выполнять bash-команды | `code_execution_tool` (runtime: terminal) |
| Писать и запускать Python | `code_execution_tool` (runtime: python) |
| Писать и запускать Node.js | `code_execution_tool` (runtime: nodejs) |
| Искать в интернете | `search_engine` → SearXNG |
| Открывать сайты, логиниться | `browser_agent` → Playwright |
| Читать документы (PDF, HTML, Office) | `document_query` |
| Создавать субагентов динамически | `call_subordinate` |
| Общаться с другими AI-агентами | `a2a_chat` (FastA2A протокол) |
| Запоминать информацию | `memory_save` / `memory_load` |
| Планировать задачи по расписанию | `scheduler:create_scheduled_task` |
| Отправлять уведомления | `notify_user` |
| Ждать (sleep) | `wait` |
| Вводить в терминал (интерактив) | `input` |
| Читать/писать файлы | Через bash (`cat`, `echo`, `python`) |
| Устанавливать пакеты | `apt-get`, `pip`, `npm` через terminal |

---

## 10. Что мы настроили для VZOR

| Компонент | Версия | Описание |
|-----------|--------|----------|
| `role.md` | v5.4 (565 строк) | Девелоперское мышление, управление проектами, RAGFlow, vzor_tasks |
| `_context.md` | v2 | Самообновляющийся контекст (начало/конец сессии) |
| `vzor_tasks.py` | v2.0 | Мультипроектные задачи → PostgreSQL → 3D-граф |
| `ragflow_search.py` | v1 | Поиск по 13 нормативным базам (6721 чанк) |
| Knowledge | 106 файлов | 7 справочников + 99 ментальных моделей |
| Субагенты | 4 профиля | vzor-analyst, vzor-planner, vzor-deployer, vzor-debugger |
| PostgreSQL | Мультипроект | `_template` (197 задач), клонирование в проекты |

---

## 11. Ссылки

| Что | Ссылка |
|-----|--------|
| GitHub (исходники) | https://github.com/frdel/agent-zero |
| Web UI (наш сервер) | http://95.174.95.209:50080 |
| API (наш сервер) | POST http://95.174.95.209:50080/api_message |
| FileBrowser (файлы агента) | https://vzor-ai.com/fm |
| RAGFlow (базы знаний) | http://95.174.95.209:8088 |
| VZOR 3D-граф (задачи) | https://vzor-ai.com |
| Исходники локально | `C:\Users\solle\Desktop\vzor-ai.com\agent-core\` |
| Наши конфиги локально | `C:\Users\solle\Desktop\vzor-ai.com\agent-zero-config\` |
| Структура агента | `C:\Users\solle\Desktop\vzor-ai.com\AGENT_ZERO_STRUCTURE.md` |

---

## 12. Быстрая памятка: как менять агента

### Поменять роль/поведение
1. Редактируй `role.md` локально (`C:\Users\solle\Desktop\vzor-ai.com\role_v5.md`)
2. Скопируй на сервер:
   ```bash
   scp -i ~/.ssh/id_ed25519 role_v5.md vzor@95.174.95.209:/home/vzor/agent-zero-data/agents/agent0/prompts/agent.system.main.role.md
   ```
3. Перезапусти: `docker restart vzor-agent-zero`

### Добавить новый instrument
1. Создай папку: `instruments/custom/<name>/`
2. Файл `<name>.md` — описание (попадёт в промпт)
3. Файл `<name>.py` — код (вызывается через bash)
4. В `role.md` добавь точную bash-команду вызова

### Добавить новый субагент-профиль
1. Создай папку: `agents/<profile>/`
2. Создай `_context.md` — описание роли
3. Создай `prompts/agent.system.main.role.md` — промпт
4. Вызывай: `call_subordinate` с `profile: "<profile>"`

### Добавить знания
1. Положи `.md` файл в `knowledge/custom/main/`
2. Перезапусти контейнер — FAISS переиндексирует автоматически

---

*Документ создан: 2026-02-21. Источник: исходный код agent-core (локально).*
