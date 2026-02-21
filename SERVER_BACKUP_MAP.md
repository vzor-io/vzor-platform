# VZOR — Карта данных для миграции на новый сервер
**Обновлено:** 2026-02-17
**Сервер:** 95.174.95.209 (Cloud.ru)

---

## Что забрать (по приоритету)

### 1. КОНФИГИ И КОД (обязательно)

| Что | Путь | Размер | Заметки |
|-----|------|--------|---------|
| VZOR репозиторий | `/home/vzor/vzor/` | 1.9 GB | Есть на GitHub (development) |
| Docker Compose (VZOR) | `/home/vzor/vzor/docker-compose.yml` | 5.5 KB | |
| Docker Compose (RAGFlow) | `/home/vzor/ragflow/docker/docker-compose.yml` | 5.6 KB | |
| Docker Compose (OpenClaw) | `/home/vzor/openclaw/docker-compose.yml` | 2.4 KB | |
| Env (VZOR) | `/home/vzor/vzor/.env` | 1.2 KB | Пароли! |
| Env (RAGFlow) | `/home/vzor/ragflow/docker/.env` | 11 KB | Пароли! |
| Env (OpenClaw) | `/home/vzor/openclaw/.env` | 303 B | |
| Nginx конфиг | `/home/vzor/vzor/config/nginx/default.conf` | 7 KB | |
| OpenClaw конфиг | `/home/vzor/.openclaw/openclaw.json` | 3 KB | API ключи! |
| Бэкап скрипт | `/home/vzor/backup.sh` | 1.5 KB | |

### 2. AGENT ZERO (обязательно)

| Что | Путь | Размер | Заметки |
|-----|------|--------|---------|
| Все данные агента | `/home/vzor/agent-zero-data/` | 122 MB | Роль, память, инструменты, знания |

Внутри:
- `agents/` — роль, контекст, подагенты
- `instruments/custom/` — инструменты (ragflow_search, vzor_tasks и др.)
- `knowledge/` — справочные материалы
- `memory/` — память из разговоров
- `settings.json` — настройки моделей
- `workdir/` — созданные документы

### 3. OPENCLAW (обязательно)

| Что | Путь | Размер | Заметки |
|-----|------|--------|---------|
| OpenClaw конфиг | `/home/vzor/.openclaw/` | 178 MB | Конфиг, агенты, память |
| OpenClaw патчи | `/home/vzor/openclaw/` | 245 MB | entrypoint-patch, genai-patched |

### 4. RAGFLOW ДАННЫЕ (Docker volumes)

| Что | Volume | Размер | Заметки |
|-----|--------|--------|---------|
| MySQL (базы знаний, чаты) | `docker_mysql_data` | 221 MB | Главное! Все загруженные документы |
| Elasticsearch (индексы) | `docker_esdata01` | 72 KB | Пока пустой (нет документов) |
| MinIO (файлы оригиналов) | `docker_minio_data` | 152 KB | Пока пустой |
| Redis (кэш) | `docker_redis_data` | 20 KB | Можно не бэкапить |

### 5. VZOR ДАННЫЕ (bind mounts)

| Что | Путь | Размер | Заметки |
|-----|------|--------|---------|
| PostgreSQL | `/home/vzor/vzor/data/postgres/` | 4 KB | Задачи проекта |
| Grafana | `/home/vzor/vzor/data/grafana/` | 49 MB | Дашборды |
| Prometheus | `/home/vzor/vzor/data/prometheus/` | 134 MB | Метрики |
| Trilium (заметки) | `/home/vzor/vzor/data/trilium/` | 13 MB | |
| Redis | `/home/vzor/vzor/data/redis/` | 20 KB | Можно не бэкапить |
| Whisper | `/home/vzor/vzor/data/whisper/` | 1.5 GB | Модель STT, скачается заново |
| Certbot (SSL) | `/home/vzor/vzor/data/certbot/` | 60 KB | Перегенерируется на новом домене |

### 6. БЭКАПЫ

| Что | Путь | Размер | Заметки |
|-----|------|--------|---------|
| Ежедневные бэкапы | `/home/vzor/backups/` | 1.6 GB | 7 дней, cron 3:00 MSK |

---

## Итого для миграции

**Обязательно забрать (~600 MB без whisper):**
- `/home/vzor/vzor/` (или клонировать с GitHub)
- `/home/vzor/agent-zero-data/`
- `/home/vzor/openclaw/` + `/home/vzor/.openclaw/`
- `/home/vzor/ragflow/docker/.env` + `docker-compose.yml`
- Docker volumes: `docker_mysql_data`
- `/home/vzor/vzor/data/` (кроме whisper/)
- `/home/vzor/backup.sh`

**Можно не забирать:**
- `/home/vzor/vzor/data/whisper/` (1.5 GB — скачается заново)
- `/home/vzor/backups/` (старые бэкапы)
- `docker_redis_data` (кэш, пересоздастся)
- `/home/vzor/vzor/data/certbot/` (перегенерируется)

---

## ШАГ 1 — Забрать всё со старого сервера

Запустить на старом сервере (95.174.95.209):

```bash
# Остановить все контейнеры (чтобы данные были консистентны)
cd /home/vzor/vzor && docker compose stop
cd /home/vzor/ragflow/docker && docker compose stop
cd /home/vzor/openclaw && docker compose stop

# Сохранить Docker volumes (RAGFlow MySQL, Elasticsearch, MinIO)
docker run --rm -v docker_mysql_data:/data -v /home/vzor:/backup alpine \
  tar czf /backup/vol-mysql.tar.gz -C /data .
docker run --rm -v docker_esdata01:/data -v /home/vzor:/backup alpine \
  tar czf /backup/vol-elasticsearch.tar.gz -C /data .
docker run --rm -v docker_minio_data:/data -v /home/vzor:/backup alpine \
  tar czf /backup/vol-minio.tar.gz -C /data .

# Собрать ВСЁ в один архив
cd /home/vzor
tar czf vzor-full-migration.tar.gz \
  --exclude='vzor/data/whisper' \
  --exclude='backups' \
  --exclude='agent-zero.bak-unused' \
  --exclude='agent-zero-config.bak-unused' \
  --exclude='agent-zero-old.bak-unused' \
  --exclude='*.bak' \
  --exclude='*.bak.*' \
  --exclude='__pycache__' \
  vzor/ \
  agent-zero-data/ \
  openclaw/ \
  .openclaw/ \
  ragflow/ \
  .ssh/ \
  backup.sh \
  vol-mysql.tar.gz \
  vol-elasticsearch.tar.gz \
  vol-minio.tar.gz

# Запустить контейнеры обратно
cd /home/vzor/vzor && docker compose start
cd /home/vzor/ragflow/docker && docker compose start
cd /home/vzor/openclaw && docker compose start

echo "Готово: ~/vzor-full-migration.tar.gz"
ls -lh ~/vzor-full-migration.tar.gz
```

---

## ШАГ 2 — Скачать архив на свой компьютер

```bash
scp -i "C:\Users\vzor\Desktop\.ssh\id_ed25519" \
  vzor@95.174.95.209:/home/vzor/vzor-full-migration.tar.gz \
  "C:\Users\vzor\Desktop\vzor-full-migration.tar.gz"
```

---

## ШАГ 3 — Развернуть на новом сервере

```bash
# 1. Установить Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker vzor

# 2. Загрузить архив на новый сервер
scp vzor-full-migration.tar.gz vzor@НОВЫЙ_IP:/home/vzor/

# 3. Распаковать
cd /home/vzor
tar xzf vzor-full-migration.tar.gz

# 4. Восстановить Docker volumes
docker volume create docker_mysql_data
docker volume create docker_esdata01
docker volume create docker_minio_data
docker run --rm -v docker_mysql_data:/data -v /home/vzor:/backup alpine \
  sh -c "cd /data && tar xzf /backup/vol-mysql.tar.gz"
docker run --rm -v docker_esdata01:/data -v /home/vzor:/backup alpine \
  sh -c "cd /data && tar xzf /backup/vol-elasticsearch.tar.gz"
docker run --rm -v docker_minio_data:/data -v /home/vzor:/backup alpine \
  sh -c "cd /data && tar xzf /backup/vol-minio.tar.gz"

# 5. Запустить всё
cd /home/vzor/vzor && docker compose up -d
cd /home/vzor/ragflow/docker && docker compose up -d
cd /home/vzor/openclaw && docker compose up -d

# 6. Обновить DNS: vzor-ai.com → НОВЫЙ_IP
# (в Cloudflare или у регистратора домена)

# 7. Перегенерировать SSL
docker exec vzor-nginx certbot --nginx -d vzor-ai.com --non-interactive --agree-tos

# 8. Настроить cron для бэкапов
crontab -e
# Добавить: 0 3 * * * /home/vzor/backup.sh
```

---

## ШАГ 4 — Проверить

- [ ] https://vzor-ai.com — платформа (3D граф)
- [ ] http://НОВЫЙ_IP:8088 — RAGFlow (базы знаний)
- [ ] http://НОВЫЙ_IP:5000 — Agent Zero
- [ ] Telegram бот @vzor_agent_bot — отвечает
- [ ] https://vzor-ai.com/fm — FileBrowser
- [ ] https://vzor-ai.com/grafana/ — Grafana

---

## Что будет работать сразу

Всё. Платформа, агенты, RAGFlow, память агента, инструменты, Telegram бот, базы знаний — всё переносится как есть. Единственное что нужно обновить вручную:
- DNS (указать новый IP)
- SSL сертификат (перегенерировать)
- Telegram webhook (агент подхватит автоматически при старте)
