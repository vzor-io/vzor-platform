#!/bin/bash
# Скрипт автоматического бэкапа PostgreSQL

BACKUP_DIR=/home/vzor/vzor/backups
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/vzor_db_backup_$DATE.sql.gz

# Создание бэкапа
docker exec vzor-postgres pg_dump -U vzor vzor_db | gzip > $BACKUP_FILE

# Удаление бэкапов старше 7 дней
find $BACKUP_DIR -name "vzor_db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
