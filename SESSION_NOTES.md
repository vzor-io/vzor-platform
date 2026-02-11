# VZOR Platform - Session Notes
**Last Updated:** 2026-02-11
**Server:** 95.174.95.209 (Cloud.ru)
**Current Branch:** development (main = эталон)

---

## ✅ ЧТО СДЕЛАНО 11.02.2026

### OpenClaw — мультимодель + Gemini через прокси

**Главное достижение**: OpenClaw теперь поддерживает 2 модели с переключением из Telegram. Gemini работает из России через Cloudflare Worker прокси с автопатчем при каждом старте контейнера.

### 1. Gemini 2.5 Flash добавлен в OpenClaw
- **Провайдер:** `google` в openclaw.json с API-ключом и baseUrl через прокси
- **Модель:** `google/gemini-2.5-flash` (бесплатный тариф, 20 req/min)
- **Переключение в Telegram:**
  - `/model gemini` — переключить на Gemini
  - `/model deepseek` — переключить на DeepSeek
  - Также работают: `/model google/gemini-2.5-flash`, `/model deepseek/deepseek-chat`
- **Алиасы:** Добавлены в openclaw.json (`gemini`, `deepseek`, `gm`, `ds`)

### 2. Автопатч Google API URL (entrypoint-patch.sh)
- **Проблема:** OpenClaw вызывает `generativelanguage.googleapis.com` напрямую из нескольких мест:
  - `@google/genai` SDK (dist/node/, dist/web/, dist/)
  - OpenClaw dist-файлы (`/app/dist/manager-*.js`, `loader-*.js`, `reply-*.js`)
  - Ядро `@mariozechner/pi-ai` (`dist/models.generated.js` — 21 вхождение!)
- **Решение:** Entrypoint-скрипт `/home/vzor/openclaw/entrypoint-patch.sh` автоматически патчит ВСЕ файлы при каждом запуске контейнера:
  - `find /app/dist -name '*.js'` — OpenClaw dist
  - `find /app/node_modules -path '*pi-ai/dist*'` — pi-ai ядро
  - `find /app/node_modules -path '*@google/genai/dist*'` — Google SDK (web bundle)
  - SDK node/root файлы — через volume mounts (как раньше)
- **Docker-compose:** Добавлены `entrypoint: ["/bin/sh", "/app/entrypoint-patch.sh"]` и volume mount для скрипта
- **ВАЖНО:** Патч переживает обновления OpenClaw — при любом `docker compose pull` и `up` файлы пропатчатся заново

### 3. Anthropic API (Claude) — НЕ подключён
- **Причина:** API-ключ `sk-ant-api03-...` валидный, но баланс на console.anthropic.com = 0
- **Ошибка:** "Your credit balance is too low to access the Anthropic API"
- **Подписка claude.ai ≠ API баланс** — это разные вещи
- **Для подключения:** console.anthropic.com → Plans & Billing → Buy Credits (мин $5)
- **Конфиг готов:** Провайдер удалён из openclaw.json (можно добавить обратно когда будут кредиты)
- **Прокси готов:** Маршрут `/anthropic/*` в Cloudflare Worker уже настроен

### 4. Brave Search — веб-поиск для агента
- **Аккаунт:** agvzor@gmail.com на brave.com/search/api/
- **API ключ:** `BSAM44xzzTH1exSCnWSHZT2og2D1FEM`
- **Конфиг:** В `openclaw.json` → `tools.web.search.apiKey` + `provider: "brave"`
- **Также:** `BRAVE_API_KEY` в docker-compose env (дублирование)
- **Лимит:** 2000 запросов/мес (бесплатный план)
- **ВАЖНО:** Ключ НЕ работает через `web.braveApiKey` или только через env var — правильный путь `tools.web.search.apiKey`

### Итоговые модели OpenClaw
| Модель | Статус | Telegram команда |
|--------|--------|------------------|
| DeepSeek V3 | Основная (default) | `/model deepseek` |
| Gemini 2.5 Flash | Рабочая, через прокси | `/model gemini` |
| Claude Sonnet 4 | Не подключена (нет кредитов API) | — |

### 5. Agent Zero обновлён до v0.9.8 (с GitHub)
- **Репо:** `/home/vzor/agent-zero/` (git clone с `github.com/agent0ai/agent-zero`, тег v0.9.8)
- **Старая версия:** agent0ai/agent-zero:latest (образ с Docker Hub от 19.11.2025) — больше не используется
- **Новый образ:** `agent-zero-local:v0.9.8` — собран локально из исходников GitHub (`docker build -f DockerfileLocal`)
- **Docker-compose:** В `/home/vzor/vzor/docker-compose.yml` образ заменён на `agent-zero-local:v0.9.8`
- **Volume:** `/home/vzor/agent-zero-data:/a0/usr` (по документации v0.9.8 маппить только `/a0/usr`, не весь `/a0`)
- **Порт:** 5000 → 80 (http://95.174.95.209:5000)
- **Бэкап старого репо:** `/home/vzor/agent-zero-old/`
- **Что нового в v0.9.8:**
  - Skills System (SKILL.md стандарт, совместим с Claude Code, Cursor, Codex)
  - WebSocket вместо polling
  - Полный редизайн UI (Projects, Scheduler, File browser, Welcome screen)
  - Git Projects (клонирование публичных и приватных репо)
  - 4 новых LLM-провайдера: CometAPI, Z.AI, Moonshot AI, AWS Bedrock
  - Microsoft Dev Tunnels
  - Subagents system
- **Обновление:** `cd /home/vzor/agent-zero && git pull && docker build -f DockerfileLocal -t agent-zero-local:v0.9.8 . && cd /home/vzor/vzor && docker compose up -d agent-zero`
- **Настройка:** Нужно добавить API ключи в Settings → External Services → API Keys (DeepSeek и др.)

### 6. Порты открыты в группе безопасности Cloud.ru
- **5000** — Agent Zero (TCP, 0.0.0.0/0)
- **8088** — RAGFlow (TCP, 0.0.0.0/0)
- **18789** — OpenClaw (TCP, 0.0.0.0/0)
- Все три проверены и работают

### 7. Watchdog для сетевого интерфейса enp4s0
- **Проблема:** Интерфейс enp4s0 (публичный IP) периодически отваливался, SSH переставал работать
- **Решение:** systemd-сервис `enp4s0-watchdog` — каждые 10 секунд проверяет интерфейс, поднимает если упал
- **Файл:** `/etc/systemd/system/enp4s0-watchdog.service`
- **Статус:** Включён, автозапуск (`systemctl enable enp4s0-watchdog`)
- **Проверка:** `systemctl status enp4s0-watchdog`

---

## ✅ ЧТО СДЕЛАНО 10.02.2026

### Серверная инфраструктура — полная докеризация

**Главное достижение**: Все сервисы в Docker, установлены RAGFlow + MinerU + OpenClaw, настроен автобэкап.

**Сервер после апгрейда**: 4 vCPU, **16GB RAM** (было 8GB), **200GB диск** (было 59GB)

### 1. SSH починен после апгрейда RAM
- **Проблема:** После увеличения RAM до 16GB интерфейс enp4s0 (публичный IP) не поднялся
- **Диагностика:** TCP на порт 22 проходил, но SSH зависал на banner exchange. sshd работал, iptables и Cloud.ru security group в порядке
- **Решение:** `sudo ip link set enp4s0 up && sudo dhclient enp4s0`
- **Автостарт:** Создан `/etc/netplan/60-public-interface.yaml` для enp4s0 (MAC: fa:16:3e:4b:c5:3a)
- **UseDNS:** Добавлено `UseDNS no` в sshd_config

### 2. RAGFlow + MinerU установлены (5 контейнеров)
- **Репо:** `/home/vzor/ragflow/` (git clone)
- **Конфиг:** `/home/vzor/ragflow/docker/.env`
- **Версия:** v0.23.1
- **Порты:**
  - Web UI: **8088** (http://95.174.95.209:8088)
  - API: **9380**
  - Elasticsearch: 1200
  - MySQL: 5455
  - MinIO: 9000/9001
  - Redis: 16379
- **Сервисы:** Elasticsearch 8.11.3, MySQL 8.0.39, MinIO, Valkey (Redis), RAGFlow
- **MinerU:** Включен в конфиге (`MINERU_BACKEND=pipeline`)
- **Пароли:** VzorElastic_2026!, VzorMySQL_2026!, VzorMinIO_2026!, VzorRedis_2026!
- **Часовой пояс:** Europe/Moscow

### 3. OpenClaw установлен (1 контейнер) — версия 2026.2.9
- **Репо:** `/home/vzor/openclaw/`
- **Образ:** `ghcr.io/openclaw/openclaw:latest` (официальный GitHub Container Registry)
- **ВАЖНО:** НЕ использовать `moltbot/moltbot` с Docker Hub — устаревший, больше не обновляется
- **Официальный GitHub:** `github.com/openclaw/openclaw` (182K+ звёзд, автор Peter Steinberger @steipete)
- **Официальный сайт:** `openclaw.ai` (НЕ openclawd.ai, openclaws.io и т.п. — это фейки)
- **Конфиг:** `/home/vzor/openclaw/.env`
- **Порты:**
  - Gateway: **18789** (ws://95.174.95.209:18789)
  - Bridge: **18790**
- **Токен:** `bd98b4db1e61227f366ab3438f157d3953e6eb6baa28102c58d07ded593cf08e`
- **Конфиг каталог:** `/home/vzor/.openclaw/`
- **Модель:** `deepseek/deepseek-chat` (DeepSeek V3, основная) — не заблокирован в России
- **Запасная модель:** `google/gemini-2.5-flash` (через Cloudflare прокси, бесплатный лимит 20 req/min)
- **DeepSeek API ключ:** `sk-744628f483de42aeb0c6b609da892a24` (настроен как кастомный провайдер в openclaw.json)
- **Telegram бот:** `@vzor_agent_bot` (токен: `8527063547:AAGIk21Q2V3vvaWsuWrbqNPUxChWj7669TA`)
- **Память:** Gemini embeddings (gemini-embedding-001), файлы в `~/.openclaw/workspace/memory/`
- **Статус:** Gateway работает, Telegram подключён, DeepSeek работает, память проиндексирована (проект VZOR)
- **Обновление:** `cd /home/vzor/openclaw && docker compose pull && docker compose up -d openclaw-gateway`
- **ВАЖНО при обновлении:** После обновления образа нужно заново пропатчить SDK (см. раздел Cloudflare прокси)

### 3a. Cloudflare Worker — API прокси (обход геоблока Google)
- **URL:** `https://api-proxy.agvzor.workers.dev`
- **Аккаунт Cloudflare:** Agvzor@gmail.com, поддомен `agvzor.workers.dev`
- **Что делает:** Прозрачно проксирует запросы к Google Gemini API из России (геоблок обходится)
- **Код:** `C:\Users\vzor\cloudflare-api-proxy\` (wrangler.jsonc + src/worker.js)
- **Деплой:** `cd C:\Users\vzor\cloudflare-api-proxy && npx wrangler deploy "./src/worker.js"`
- **Маршруты:**
  - `/` — health check
  - `/google/*` — Google Gemini API
  - `/anthropic/*` — Anthropic API
  - `/openai/*` — OpenAI API
  - Без префикса — по умолчанию Google
- **SDK патч:** Google GenAI SDK (`@google/genai@1.40.0`) пропатчен — URL `generativelanguage.googleapis.com` заменён на `api-proxy.agvzor.workers.dev`. Пропатченные файлы монтируются как volumes в docker-compose:
  - `/home/vzor/openclaw/genai-patched.mjs` → `dist/node/index.mjs`
  - `/home/vzor/openclaw/genai-patched.cjs` → `dist/node/index.cjs`
  - `/home/vzor/openclaw/genai-root.mjs` → `dist/index.mjs`
  - `/home/vzor/openclaw/genai-root.cjs` → `dist/index.cjs`
- **Google API ключ:** `AIzaSyBeE6Qnpi4_KjvBJkQoOUCZ0nAh1CEpGMU` (бесплатный тариф, работает с Flash, НЕ с Pro)
- **Лимиты:** Cloudflare 100K запросов/день, Google Flash 20 запросов/мин (бесплатный тариф)
- **Биллинг Google:** Не настроен. Для увеличения лимитов — "Set up billing" на aistudio.google.com/api-keys

### 4. Ежедневный автобэкап
- **Скрипт:** `/home/vzor/backup.sh`
- **Расписание:** Cron каждый день в **3:00 MSK**
- **Папка:** `/home/vzor/backups/` (хранит 7 дней)
- **Что бэкапится:**
  - PostgreSQL полный дамп
  - RAGFlow MySQL дамп
  - Все конфиги (docker-compose, .env, nginx, netplan)
  - Agent Zero данные
  - Git состояние (лог + uncommitted patch)
  - Docker состояние (контейнеры + образы)
- **Размер:** ~163MB на бэкап

### 5. Ранее сделано (09.02)
- Докеризация vzor-api (Dockerfile + docker-compose)
- Докеризация Agent Zero (pre-built image agent0ai/agent-zero:latest)
- Удаление n8n
- Расширение диска 59GB → 200GB (growpart + resize2fs)

### Итоговое состояние: 16 контейнеров
```
VZOR Stack (10):          RAGFlow (5):              OpenClaw (1):
- vzor-nginx              - docker-ragflow-cpu-1    - openclaw-gateway-1
- vzor-api                - docker-es01-1
- vzor-agent-zero         - docker-mysql-1
- vzor-postgres           - docker-minio-1
- vzor-redis              - docker-redis-1
- vzor-grafana
- vzor-prometheus
- vzor-trilium
- filebrowser
- vzor-infisical (crash loop — не критично)
```

**Ресурсы:** 88GB/197GB диск (47%), 10GB/15GB RAM

---

## ✅ ЧТО СДЕЛАНО 09.02.2026

### v3.24–v3.31: Молекулярный 3D-граф (полная переработка)

**Главное достижение**: 169 задач из VZOR_DevProject_Structure_v2.1.docx загружены в БД и визуализируются как молекулярные кластеры.

**Структура данных**:
- 197 задач всего: 4 L0 (фазовые ноды) + 24 L1 (секции-молекулы) + 169 L2 (подзадачи-атомы)
- 358 зависимостей: L0→L1, L1→L1 последовательные, L1→L2, L2→L2 цепочки
- 4 блока: Инвестиционный анализ (55), Проектирование (67), Строительство (27), Продажи (20)

**Исправленные критические баги**:
1. **Auto-connect chain** — каждый новый таск соединялся с предыдущим, создавая N-1 ложных bond'ов. Исправлено через `window._batchCreating` flag
2. **Пустой dependsOn из БД** — БД хранит зависимости отдельно в `data.dependencies`, а `calcMolecularPositions` использовал `t.dependsOn[0]`. Добавлено восстановление dependsOn перед layout calc
3. **Glow L1 скрывал L2 атомы** — `GLOW_SCALES[1]=2.5` создавал 30-unit glow, скрывающий L2 на расстоянии 7.5. Убран glow с L1 (`GLOW_SCALES[1]=0`), L2 получил свой glow

**Layout**: HexRings для L1, Fibonacci sphere для L2 вокруг родительского L1
**Bonds**: L1↔L1 hex-соседи (backbone), L1→L2 спицы (molecular), L2↔L2 ближайшие (cage)
**Orbit pivot**: controls.target устанавливается на позицию кликнутого объекта

**Коммит**: `3bee622` на development, запушен в GitHub

---

## ✅ ЧТО СДЕЛАНО 07-08.02.2026

### 3D Граф задач — Concentric Shells
- **Концентрические оболочки**: L0 (R=195), L1 (R=170), L2 (R=145) внутри облака (R=220)
- **4 цветовых блока**: Анализ (синий), Проектирование (фиолетовый), Строительство (оранжевый), Продажи (бирюзовый)
- **Фокус по блоку**: клик фокусирует весь блок, двойной клик на пустое — снимает фокус
- **Dashboard**: 4 прогресс-бара в левом нижнем углу
- **Hover tooltip**: при наведении показывает имя задачи/фазу/статус
- **Ядро**: белая сфера в центре с голубым свечением
- **Статусы**: pending тусклый, in_progress пульсирует, completed яркий+белее
- **Camera fly-to-block**: анимация к выделенному блоку

### Коммит: b9e4683 (development), 3bee622 (v3.31)

---

## ✅ ЧТО СДЕЛАНО 06.02.2026

### 1. Панель задач (task-interface)
- Панель скрыта по умолчанию, появляется по клику на кнопку в левой панели

### 2. Кнопки и UI
- Круглые кнопки с белым свечением, scale 1.15, единообразный дизайн

### 3. Git и GitHub
- Создан тег stable-v1.0, ветки main (эталон) и development (рабочая)
- Запушено на GitHub: vzor-io/vzor-platform

---

## 📁 СТРУКТУРА ПРОЕКТА

```
/home/vzor/
├── vzor/                              # Основной проект
│   ├── docker-compose.yml             # VZOR Stack (10 сервисов)
│   ├── .env                           # Пароли
│   ├── config/nginx/www/index.html    # ГЛАВНЫЙ ФАЙЛ (~9500 строк)
│   └── data/                          # Docker volumes
├── vzor-api/                          # FastAPI backend (Dockerfile)
│   ├── Dockerfile
│   ├── main.py, db.py, multi_model.py
│   └── packages/                      # Pre-installed pip packages
├── ragflow/                           # RAGFlow (git clone)
│   └── docker/
│       ├── docker-compose.yml
│       └── .env                       # Порты, пароли, MinerU
├── openclaw/                          # OpenClaw (git clone)
│   ├── docker-compose.yml
│   └── .env                           # Токен, порты
├── agent-zero-data/                   # Agent Zero persistent data
├── .openclaw/                         # OpenClaw config + workspace
├── backups/                           # Ежедневные бэкапы (7 дней)
└── backup.sh                          # Скрипт автобэкапа
```

**Главный файл:** `/home/vzor/vzor/config/nginx/www/index.html` (~9500 строк)
- Standalone HTML приложение
- Three.js 3D визуализация (облако 20000 частиц + задачи на оболочках)
- Управление задачами (task-interface)
- Node editor для workflows
- Agent VZOR чат (выбор модели: DeepSeek/Claude/Gemini)

---

## 🔧 СЕРВИСЫ И ПОРТЫ

| Сервис | Порт | URL |
|--------|------|-----|
| VZOR (nginx) | 80/443 | https://95.174.95.209 |
| VZOR API | 8000 | http://95.174.95.209:8000 |
| Agent Zero | 5000 | http://95.174.95.209:5000 |
| RAGFlow | 8088 | http://95.174.95.209:8088 |
| RAGFlow API | 9380 | http://95.174.95.209:9380 |
| OpenClaw | 18789 | ws://95.174.95.209:18789 |
| Grafana | 3000 | http://95.174.95.209:3000 |
| Trilium | 8081 | http://95.174.95.209:8081 |
| FileBrowser | 8080 | http://95.174.95.209:8080 |
| Prometheus | 9090 | http://95.174.95.209:9090 |

---

## 🐛 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### Решенные (11.02)
- ✅ Gemini geo-block в OpenClaw — автопатч entrypoint-patch.sh заменяет все hardcoded URLs
- ✅ OpenClaw мультимодель — DeepSeek + Gemini с переключением из Telegram

### Решенные (10.02)
- ✅ SSH не работал после апгрейда RAM (enp4s0 не поднялся)
- ✅ Docker DNS не работал при сборке (обход: pre-built images + packages/)
- ✅ Конфликты портов RAGFlow (80→8088, 6379→16379)
- ✅ OpenClaw: неправильный command в docker-compose (entrypoint дублировался)
- ✅ OpenClaw: env var CLAWDBOT_GATEWAY_TOKEN вместо OPENCLAW_GATEWAY_TOKEN

### Текущие
- **vzor-infisical** — контейнер в crash loop (Restarting 255), не критично
- Масштаб кластеров непропорционален облаку (нужен spherical cap layout)
- Вращение камеры не вокруг выделенного объекта
- Нужно добавить порты **8088**, **18789** в группу безопасности Cloud.ru
- **Google Gemini geo-block** — ✅ Решено автопатчем (entrypoint-patch.sh). При смене версии SDK проверить, что пути volume mounts не изменились
- **Anthropic API** — ключ есть, но нет кредитов на console.anthropic.com. Нужно купить ($5 мин)
- **gemini-2.5-pro недоступен** — бесплатный API ключ имеет 0 квоту на Pro модель. Используем Flash
- **Gemini Free лимит 20 req/min** — OpenClaw тратит несколько запросов на одно сообщение, лимит быстро кончается. Решение: используем DeepSeek как основную модель

---

## 🚀 КОМАНДЫ

### Подключение к серверу
```bash
ssh -i C:\Users\vzor\.ssh\id_ed25519 vzor@95.174.95.209
```

### Docker — все стеки
```bash
# VZOR Stack
cd /home/vzor/vzor && docker compose ps

# RAGFlow
cd /home/vzor/ragflow/docker && docker compose ps

# OpenClaw
cd /home/vzor/openclaw && docker compose ps

# Все контейнеры
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

### Бэкап
```bash
/home/vzor/backup.sh                    # Ручной запуск
ls -lh /home/vzor/backups/              # Список бэкапов
crontab -l                              # Проверить расписание
```

### Git
```bash
cd /home/vzor/vzor
git status
git checkout development
git log --oneline -10
```

### OpenClaw — управление
```bash
cd /home/vzor/openclaw

# Статус
docker compose run --rm openclaw-cli status

# Модели (текущая: deepseek/deepseek-chat)
docker compose run --rm openclaw-cli models list
docker compose run --rm openclaw-cli models set deepseek/deepseek-chat
# Переключить на Gemini:
docker compose run --rm openclaw-cli models set google/gemini-2.5-flash

# Telegram (уже подключён: @vzor_agent_bot)
docker compose run --rm openclaw-cli plugins enable telegram
docker compose run --rm openclaw-cli channels add --channel telegram --token <BOT_TOKEN>
docker compose run --rm openclaw-cli pairing approve telegram <PAIRING_CODE>

# Память (RAG)
docker compose run --rm openclaw-cli memory index
docker compose run --rm openclaw-cli memory search "запрос"

# WhatsApp (QR код)
docker compose run --rm openclaw-cli channels login
# Discord
docker compose run --rm openclaw-cli channels add --channel discord --token <BOT_TOKEN>
```

### Cloudflare Worker — деплой прокси
```bash
cd C:\Users\vzor\cloudflare-api-proxy
npx wrangler login
npx wrangler deploy "./src/worker.js"
```

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ (обновлено 10.02.2026)

### Инфраструктура
1. [ ] Добавить порты 8088, 18789 в группу безопасности Cloud.ru
2. [x] ~~Настроить каналы OpenClaw (Telegram)~~ — готово, бот `@vzor_agent_bot`
3. [ ] Настроить RAGFlow — загрузить документы, создать knowledge base
4. [x] ~~API ключи для Gemini и DeepSeek в OpenClaw~~ — готово, обе модели работают, переключение из Telegram
5. [ ] API кредиты Anthropic (console.anthropic.com) для Claude в OpenClaw
5. [ ] API ключи для OpenRouter (в RAGFlow и Agent Zero)
5. [ ] Связать Agent Zero с RAGFlow (RAG pipeline)
6. [ ] Добавить больше файлов в память OpenClaw (документация VZOR, архитектура)
7. [ ] Подключить WhatsApp/Discord к OpenClaw (по желанию)

### Визуализация (3D граф)
8. [ ] **Spherical cap layout** — L1 задачи на участке сферы (R~200)
9. [ ] **Вращение камеры** — OrbitControls вокруг выделенного объекта
10. [ ] Расширить до ~800 задач

---

## 💡 ВАЖНЫЕ ЗАМЕТКИ

- **Не трогать ветку main** - это эталон
- **Работать только на development**
- **Перед большими изменениями:** создать бэкап или коммит
- **После изменений index.html:** обязательно `docker restart vzor-nginx`
- **Очистка кэша:** Ctrl+F5 в браузере после изменений
- **Бэкапы автоматические** — каждый день в 3:00 MSK, хранятся 7 дней
- **SSH ключ:** `C:\Users\vzor\.ssh\id_ed25519`
- **Серийная консоль Cloud.ru** — запасной способ доступа если SSH не работает
- **Конфиги на рабочем столе:** `C:\Users\vzor\Desktop\vzor-server-configs\` (docker-compose.yml + .env для всех стеков)
- **Последний коммит:** `0cac91a` на development, запушен на GitHub (10.02.2026)

---

## 🔗 ССЫЛКИ

- **Сайт:** https://95.174.95.209
- **RAGFlow:** http://95.174.95.209:8088
- **GitHub:** https://github.com/vzor-io/vzor-platform
- **Cloudflare прокси:** https://api-proxy.agvzor.workers.dev
- **Telegram бот:** https://t.me/vzor_agent_bot
- **Эталон:** ветка main, тег stable-v1.0
- **Рабочая:** ветка development

---

## 📞 КАК ПРОДОЛЖИТЬ ЗАВТРА

### 1. Запустить Claude Code
```
claude
```

### 2. Первое сообщение
```
Прочитай C:\Users\vzor\Desktop\SESSION_NOTES.md и продолжим работу над VZOR проектом
```

### 3. Что мы сделали (06-10.02.2026)

✅ 06.02: WinSCP, SSH, кнопки, task-interface
✅ 07.02: Чат Agent VZOR, multi-model API, дизайн платформы
✅ 08.02: 3D граф задач — концентрические оболочки, фокус по блокам, dashboard
✅ 09.02: Молекулярный layout (v3.24–v3.31), 169 задач из docx, докеризация vzor-api + Agent Zero, удаление n8n, расширение диска 200GB
✅ 10.02: Апгрейд RAM 16GB, починка SSH, RAGFlow + MinerU, OpenClaw, автобэкап, Cloudflare Worker прокси (обход геоблока), Telegram бот (@vzor_agent_bot), память OpenClaw (проект VZOR), DeepSeek V3 как основная модель, коммит 0cac91a запушен на GitHub, конфиги скачаны на рабочий стол
✅ 11.02: Gemini 2.5 Flash в OpenClaw (через прокси + автопатч entrypoint-patch.sh), мультимодель с переключением из Telegram (/model gemini, /model deepseek), Brave Search веб-поиск для агента

---

**ВАЖНО:** Обязательно скажи мне прочитать этот файл в начале следующей сессии!
