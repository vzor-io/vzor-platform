# Agent Zero — Структура на сервере
**Обновлено:** 2026-02-17
**Путь:** `/home/vzor/agent-zero-data/` (подключена к Docker как `/a0/usr`)

---

## Полная иерархия

```
/home/vzor/agent-zero-data/
│
├── agents/                              КТО агент и КАК думает
│   ├── agent0/                          Главный агент (VZOR AI)
│   │   ├── _context.md                  Контекст проекта (видит всегда)
│   │   └── prompts/
│   │       └── agent.system.main.role.md    Роль, компетенции, правила
│   ├── vzor-analyst/                    Подагент: анализ, финмодели
│   ├── vzor-planner/                    Подагент: планирование, графики
│   ├── vzor-deployer/                   Подагент: деплой, серверные операции
│   ├── vzor-debugger/                   Подагент: отладка, диагностика
│   ├── default/                         Шаблон (не трогать)
│   ├── developer/                       Встроенный профиль
│   ├── researcher/                      Встроенный профиль
│   ├── hacker/                          Встроенный профиль
│   └── _example/                        Пример (не трогать)
│
├── instruments/custom/                  ЧТО агент умеет делать (инструменты)
│   ├── ragflow_search/                  Поиск по документам RAGFlow
│   ├── vzor_tasks/                      Управление задачами в PostgreSQL
│   ├── vzor_deploy/                     Деплой изменений на сервер
│   ├── vzor_diagnostics/                Диагностика сервера
│   ├── vzor_git/                        Git операции
│   └── vzor_backup/                     Бэкапы
│
├── knowledge/                           Справочные материалы (встроенный RAG)
│   ├── custom/                          Пользовательские файлы
│   ├── main/                            Основная база
│   ├── solutions/                       Решения проблем
│   ├── fragments/                       Фрагменты
│   └── default/                         По умолчанию
│
├── memory/                              Память из разговоров
│   ├── default/                         Основная память
│   └── embeddings/                      Векторные представления
│
├── workdir/                             Рабочая папка (агент создаёт файлы сюда)
├── settings.json                        Настройки (модели, API ключи)
├── secrets.env                          Секреты
└── chats/                               История чатов
```

---

## Ключевые файлы

| Файл | Что делает |
|------|-----------|
| `agents/agent0/_context.md` | Контекст проекта — агент видит в КАЖДОМ разговоре |
| `agents/agent0/prompts/agent.system.main.role.md` | Роль агента — кто он, что умеет, как работать |
| `instruments/custom/ragflow_search/` | Инструмент поиска по базам знаний RAGFlow |
| `instruments/custom/vzor_tasks/` | Инструмент управления задачами проекта |
| `settings.json` | Модели (DeepSeek), API ключи, параметры |
| `workdir/` | Сюда агент сохраняет созданные документы |

---

## Как менять "мозги" агента

- **Изменить роль/компетенции** — редактировать `agents/agent0/prompts/agent.system.main.role.md`
- **Изменить контекст проекта** — редактировать `agents/agent0/_context.md`
- **Добавить инструмент** — создать папку в `instruments/custom/` с `.md` и `.py` файлами
- **Добавить справочный материал** — положить файл в `knowledge/custom/`

---

## Связь с RAGFlow

Agent Zero ищет документы в RAGFlow через инструмент `ragflow_search`:
- **RAGFlow API:** http://95.174.95.209:9380
- **RAGFlow Web:** http://95.174.95.209:8088
- **API ключ:** `ragflow-c36bd6a4202fcfefaed61f8e9df5456e`
- **Базы знаний:** Поставщики, Проектирование, Расчёты, Регламенты
