#!/bin/bash
# VZOR — Скрипт восстановления на новом сервере
# Запуск: sudo bash restore.sh
# Предусловие: архив vzor-full-migration.tar.gz уже распакован в /home/vzor/

set -e

echo "=== VZOR: Восстановление платформы ==="
echo ""

# Проверка что мы в /home/vzor
if [ ! -f /home/vzor/vol-mysql.tar.gz ]; then
    echo "ОШИБКА: Запустите скрипт после распаковки архива в /home/vzor/"
    echo "  scp vzor-full-migration.tar.gz vzor@НОВЫЙ_IP:/home/vzor/"
    echo "  cd /home/vzor && tar xzf vzor-full-migration.tar.gz"
    exit 1
fi

# 1. Установить Docker если нет
if ! command -v docker &> /dev/null; then
    echo "[1/8] Устанавливаю Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker vzor
    echo "Docker установлен. Перелогиньтесь (exit + ssh) и запустите скрипт снова."
    exit 0
else
    echo "[1/8] Docker уже установлен"
fi

# 2. Восстановить Docker volumes (RAGFlow)
echo "[2/8] Восстанавливаю Docker volumes..."
docker volume create docker_mysql_data 2>/dev/null || true
docker volume create docker_esdata01 2>/dev/null || true
docker volume create docker_minio_data 2>/dev/null || true

docker run --rm -v docker_mysql_data:/data -v /home/vzor:/backup alpine \
  sh -c "cd /data && tar xzf /backup/vol-mysql.tar.gz"
docker run --rm -v docker_esdata01:/data -v /home/vzor:/backup alpine \
  sh -c "cd /data && tar xzf /backup/vol-elasticsearch.tar.gz"
docker run --rm -v docker_minio_data:/data -v /home/vzor:/backup alpine \
  sh -c "cd /data && tar xzf /backup/vol-minio.tar.gz"
echo "  Volumes восстановлены"

# 3. Установить права
echo "[3/8] Устанавливаю права..."
chown -R vzor:vzor /home/vzor/vzor/
chown -R vzor:vzor /home/vzor/agent-zero-data/
chown -R vzor:vzor /home/vzor/openclaw/
chown -R vzor:vzor /home/vzor/.openclaw/
chown -R vzor:vzor /home/vzor/ragflow/
chmod +x /home/vzor/backup.sh

# 4. Запустить VZOR стек
echo "[4/8] Запускаю VZOR платформу..."
cd /home/vzor/vzor && docker compose up -d
echo "  VZOR запущен"

# 5. Запустить RAGFlow
echo "[5/8] Запускаю RAGFlow..."
cd /home/vzor/ragflow/docker && docker compose up -d
echo "  RAGFlow запущен"

# 6. Запустить OpenClaw
echo "[6/8] Запускаю OpenClaw..."
cd /home/vzor/openclaw && docker compose up -d
echo "  OpenClaw запущен"

# 7. Настроить cron для бэкапов
echo "[7/8] Настраиваю ежедневные бэкапы..."
(crontab -l 2>/dev/null | grep -v backup.sh; echo "0 3 * * * /home/vzor/backup.sh") | crontab -
echo "  Cron: ежедневно в 3:00"

# 8. Удалить временные файлы volumes
echo "[8/8] Чищу временные файлы..."
rm -f /home/vzor/vol-mysql.tar.gz
rm -f /home/vzor/vol-elasticsearch.tar.gz
rm -f /home/vzor/vol-minio.tar.gz
rm -f /home/vzor/vzor-full-migration.tar.gz

echo ""
echo "=== ГОТОВО ==="
echo ""
echo "Осталось сделать вручную:"
echo "  1. Обновить DNS: vzor-ai.com → $(curl -s ifconfig.me)"
echo "  2. SSL: docker exec vzor-nginx certbot --nginx -d vzor-ai.com --non-interactive --agree-tos"
echo ""
echo "Проверка:"
echo "  - Платформа:  https://vzor-ai.com"
echo "  - RAGFlow:    http://$(curl -s ifconfig.me):8088"
echo "  - Agent Zero: http://$(curl -s ifconfig.me):5000"
echo "  - FileBrowser: https://vzor-ai.com/fm"
echo "  - Grafana:    https://vzor-ai.com/grafana/"
