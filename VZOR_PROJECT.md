# VZOR Platform — Мастер-документ проекта
**Обновлено:** 2026-02-13

---

## 1. Quick Start

### Подключение к серверу
```bash
ssh -i "C:\Users\vzor\Desktop\.ssh\id_ed25519" vzor@95.174.95.209
# Совет: добавить -o ServerAliveInterval=3 (enp4s0 иногда отваливается)
```

### Начать сессию с Claude Code
```
claude
> Прочитай VZOR_PROJECT.md и ЗАДАЧИ.md на рабочем столе и продолжим работу
```

### Начать сессию с Telegram-ботом
- `/new` — новая сессия (сброс контекста)
- `/model claude` — для задач с браузером (платный, OpenRouter)
- `/model ds` — для текста/кода (бесплатно)

---

## 2. Сервер

### Основной сервер (Cloud.ru)
| Параметр | Значение |
|----------|----------|
| IP | 95.174.95.209 |
| Домен | vzor-ai.com (SSL Let's Encrypt) |
| OS | Ubuntu 22.04.5 LTS |
| CPU | 4 vCPU |
| RAM | 16 GB |
| Диск | 200 GB |
| SSH user | vzor |
| SSH ключ | `C:\Users\vzor\Desktop\.ssh\id_ed25519` |

### VPS прокси (Amsterdam) — Amnezia Hosting
| Параметр | Значение |
|----------|----------|
| IP | 170.168.4.45 |
| Провайдер | Amnezia Hosting ($5.50/мес, Нидерланды) |
| SSH | root / mwJpoMJ5DKtTCQVJ |
| SSH ключ | `C:\Users\vzor\Desktop\.ssh\id_ed25519` (скопирован на сервер) |
| API прокси | Caddy на :8443 (Google через CF Worker, Anthropic/OpenAI напрямую) |
| VPN | VLESS-WS через Cloudflare Tunnel (IP заблокирован в РФ напрямую) |
| 3x-ui панель | https://170.168.4.45:2053/ |
| 3x-ui логин | admin / vzor2026 |
| Заказ | #2199100298, инвойс #17300 |

### VLESS ссылка для VPN (через Cloudflare Tunnel)
```
vless://cf89f679-71c1-48db-a4e3-6c2e1702d264@nickname-nest-thirty-tone.trycloudflare.com:443?type=ws&security=tls&path=%2Fvpnws&sni=nickname-nest-thirty-tone.trycloudflare.com&host=nickname-nest-thirty-tone.trycloudflare.com#CF-VLESS-NL
```
**ВАЖНО:** Quick Tunnel — временный домен, может смениться при перезапуске. Нужен постоянный Cloudflare Tunnel.

---

## 3. Сервисы и порты

### VZOR Stack (10 контейнеров)
| Сервис | Контейнер | Порт | URL |
|--------|-----------|------|-----|
| Frontend | vzor-nginx | 80/443 | https://vzor-ai.com |
| API | vzor-api | 8000 | http://95.174.95.209:8000 |
| Agent Zero | vzor-agent-zero | 5000 | http://95.174.95.209:5000 |
| PostgreSQL | vzor-postgres | 5432 | — |
| Redis | vzor-redis | 6379 | — |
| Grafana | vzor-grafana | 3000 | https://vzor-ai.com/grafana/ |
| Prometheus | vzor-prometheus | 9090 | https://vzor-ai.com/prometheus/ |
| Trilium | vzor-trilium | 8081 | https://vzor-ai.com/notes/ |
| FileBrowser | filebrowser | 8080 | https://vzor-ai.com/files |
| Infisical | vzor-infisical | — | crash loop (не критично) |

### RAGFlow (5 контейнеров)
| Сервис | Порт | URL |
|--------|------|-----|
| RAGFlow Web | 8088 | http://95.174.95.209:8088 |
| RAGFlow API | 9380 | — |
| Elasticsearch | 1200 | — |
| MySQL | 5455 | — |
| MinIO | 9000/9001 | — |

### OpenClaw (1 контейнер)
| Сервис | Порт | URL |
|--------|------|-----|
| Gateway | 18789 | ws://95.174.95.209:18789 |
| WebChat | 18789 | http://95.174.95.209:18789 |
| Bridge | 18790 | — |
| Telegram бот | — | @vzor_agent_bot |

### Nginx роуты
```
/              → Frontend (static files)
/api/          → VZOR API (172.17.0.1:8000)
/ws/           → WebSocket (172.17.0.1:8000)
/grafana/      → Grafana (127.0.0.1:3000)
/prometheus/   → Prometheus (127.0.0.1:9090)
/files         → FileBrowser (172.17.0.1:8080)
/notes/        → Trilium (127.0.0.1:8081)
```

---

## 4. API ключи

| Сервис | Ключ | Заметки |
|--------|------|---------|
| DeepSeek | `sk-***REDACTED***` | Прямой доступ из России, бесплатно |
| OpenRouter | `sk-or-v1-***REDACTED***` | agvzor@gmail.com, наценка 5.5% |
| OpenRouter (старый) | `sk-or-v1-***REDACTED***` | Не используется |
| Gemini | `AIza***REDACTED***` | В openclaw.json |
| Gemini (старый) | `AIza***REDACTED***` | Free tier, 20 req/min |
| Anthropic | `sk-ant-***REDACTED***` | Нет кредитов! console.anthropic.com → Buy Credits ($5) |
| Brave Search | `***REDACTED***` | 2000 req/мес бесплатно |
| Telegram Bot | `***REDACTED***` | @vzor_agent_bot |
| OpenClaw Token | `***REDACTED***` | Gateway token |

### Cloudflare Worker (API прокси)
- **URL:** https://api-proxy.agvzor.workers.dev
- **Аккаунт:** agvzor@gmail.com
- **Маршруты:** `/google/*`, `/anthropic/*`, `/openai/*`
- **Код:** `C:\Users\vzor\cloudflare-api-proxy\`
- **Деплой:** `npx wrangler deploy "./src/worker.js"`

---

## 5. Учётные записи сервисов

| Сервис | Логин | Пароль |
|--------|-------|--------|
| PostgreSQL | vzor | VzorDB_Secure_2026! |
| Grafana | admin | VzorGrafana_2026! |
| FileBrowser | admin | AgvzorPse.2327 |
| Agent Zero | — | 7U3236DNVazwx8TNhgibO3Ypmo7eek8S |
| RAGFlow MySQL | root | VzorMySQL_2026! |
| RAGFlow Elastic | elastic | VzorElastic_2026! |
| RAGFlow MinIO | minioadmin | VzorMinIO_2026! |
| RAGFlow Redis | — | VzorRedis_2026! |

---

## 6. Архитектура

### Что такое VZOR
VZOR — 3D-платформа на Three.js для управления девелоперскими проектами. Один файл `index.html` (~10000 строк): HTML + CSS + JS. Космический фон, молекулярный граф задач (197 задач, 358 зависимостей, 4 фазы). AI-агент через кнопку "V".

### Файловая структура сервера
```
/home/vzor/
├── vzor/                              # Git-репозиторий (branch: development)
│   ├── docker-compose.yml             # VZOR Stack (10 сервисов)
│   ├── .env                           # Пароли
│   ├── config/nginx/www/index.html    # ГЛАВНЫЙ ФАЙЛ (~10000 строк)
│   ├── config/nginx/default.conf      # Nginx конфиг
│   └── data/                          # Docker volumes
├── vzor-api/                          # FastAPI backend
│   ├── Dockerfile, main.py, db.py, multi_model.py
│   └── packages/
├── ragflow/docker/                    # RAGFlow (docker-compose + .env)
├── openclaw/                          # OpenClaw
│   ├── docker-compose.yml + .env
│   ├── entrypoint-patch.sh            # Автопатч Google API + lock cleanup
│   └── genai-patched.mjs/cjs          # SDK патчи (volume mounts)
├── .openclaw/                         # OpenClaw config
│   ├── openclaw.json                  # Основной конфиг
│   ├── chromium-wrapper.sh            # Lock cleanup перед запуском Chromium
│   ├── agents/main/agent/models.json  # Модели + API ключи
│   └── workspace/AGENTS.md            # Системный промпт агента
├── agent-zero-data/                   # Agent Zero persistent data
├── backups/                           # Ежедневные бэкапы (7 дней, ~163MB)
└── backup.sh                          # Cron 3:00 MSK
```

### Git
- **Репо:** github.com/vzor-io/vzor-platform
- **Ветки:** `main` (эталон), `development` (рабочая)
- **Pages:** https://vzor-io.github.io/vzor-platform/

### Docker Compose стеки
1. `/home/vzor/vzor/docker-compose.yml` — VZOR Stack (10 сервисов)
2. `/home/vzor/ragflow/docker/docker-compose.yml` — RAGFlow (5 сервисов)
3. `/home/vzor/openclaw/docker-compose.yml` — OpenClaw (1 сервис)

---

## 7. Полезные команды

### SSH
```bash
# Основной сервер
ssh -i "C:\Users\vzor\Desktop\.ssh\id_ed25519" vzor@95.174.95.209
# VPS
ssh -i "C:\Users\vzor\Desktop\.ssh\id_ed25519" root@170.168.4.45
```

### Docker — OpenClaw
```bash
cd /home/vzor/openclaw && docker compose restart openclaw-gateway
docker logs openclaw-openclaw-gateway-1 --tail 30
docker exec openclaw-openclaw-gateway-1 node /app/openclaw.mjs browser status
docker exec openclaw-openclaw-gateway-1 node /app/openclaw.mjs browser start
docker exec openclaw-openclaw-gateway-1 node /app/openclaw.mjs browser snapshot
```

### Docker — VZOR Stack
```bash
cd /home/vzor/vzor && docker compose up -d
docker compose restart vzor-nginx
docker logs vzor-nginx --tail 50
```

### Docker — RAGFlow
```bash
cd /home/vzor/ragflow/docker && docker compose up -d
docker logs docker-ragflow-cpu-1 --tail 30
```

### Git деплой
```bash
cd /home/vzor/vzor
git add config/nginx/www/index.html
git commit -m "v3.XX: описание"
git push origin development
docker restart vzor-nginx
```

### Диагностика
```bash
free -h && df -h                 # RAM + диск
docker stats --no-stream         # Ресурсы контейнеров
ss -tlnp                         # Открытые порты
systemctl status enp4s0-watchdog # Watchdog сети
```

---

## 8. Известные проблемы

### Текущие
- **OpenRouter баланс** — кредиты кончились, пополнить: https://openrouter.ai/settings/credits
- **Anthropic API** — ключ есть, нет кредитов: console.anthropic.com → Buy Credits ($5)
- **vzor-infisical** — crash loop, не критично
- **SSH нестабильный** — enp4s0 watchdog поднимает за 10 сек

### Решённые (13.02)
- **Browser stale locks** — chromium-wrapper.sh чистит мёртвые SingletonLock
- **Browser "fields are required"** — Gemini слал пустые tool calls → дефолт на Claude
- **Browser two-profile problem** — оба профиля на CDP port 18800

### Решённые (11.02)
- **Gemini geo-block** — автопатч entrypoint-patch.sh
- **Мультимодель OpenClaw** — 8 алиасов с переключением из Telegram

### Решённые (10.02)
- **SSH после апгрейда RAM** — netplan + enp4s0-watchdog
- **RAGFlow порты** — 80→8088, 6379→16379

---

## 9. Лог работы

### 13.02 — Браузер OpenClaw + документация
- Matrix Dependency Graph (кнопка СВЯЗИ, коммиты 67381a1, 0e884db)
- Browser fix: chromium-wrapper.sh, entrypoint cleanup, stale lock auto-removal
- Дефолт → Claude Sonnet 4.5 (Gemini ломал browser tool calls)
- Организация документации (3 файла вместо 27)

### 11.02 — Мультимодель + прокси
- OpenClaw: DeepSeek + Gemini + OpenRouter (8 алиасов)
- Автопатч Google API URLs (entrypoint-patch.sh)
- Cloudflare Worker API прокси
- Brave Search API

### 10.02 — Инфраструктура
- Апгрейд: 8→16GB RAM, 59→200GB диск
- RAGFlow + MinerU (5 контейнеров)
- OpenClaw + Telegram бот
- Автобэкап (cron 3:00 MSK)
- Agent Zero v0.9.8

### 09.02 — Молекулярный 3D-граф
- 197 задач, 358 зависимостей, 4 фазы
- HexRings L1, Fibonacci sphere L2
- Баги: auto-connect, dependsOn, glow overlap

### 07-08.02 — 3D визуализация
- Concentric Shells (L0/L1/L2), 4 цветовых блока
- Dashboard, hover tooltip, camera fly-to-block

### 06.02 — Старт проекта
- Task-interface, UI, Git/GitHub (vzor-io/vzor-platform)
- Теги: stable-v1.0, ветки main/development
