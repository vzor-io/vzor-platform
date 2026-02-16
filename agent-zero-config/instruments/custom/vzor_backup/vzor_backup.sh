#!/bin/bash
# VZOR Backup Tool
# Usage: bash vzor_backup.sh <action> [options]
# Actions: full, db, config, rotate, list

set -euo pipefail

BACKUP_DIR="/home/vzor/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

ACTION="${1:-help}"
shift || true

# Parse options
while [[ $# -gt 0 ]]; do
    case "$1" in
        --retention-days) RETENTION_DAYS="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

mkdir -p "$BACKUP_DIR"

backup_db() {
    echo "📦 Backing up PostgreSQL database..."
    local outfile="$BACKUP_DIR/vzor_db_${TIMESTAMP}.sql.gz"
    docker exec vzor-postgres pg_dump -U vzor -d vzor_db | gzip > "$outfile"
    local size=$(du -h "$outfile" | cut -f1)
    echo "✅ Database backup: $outfile ($size)"
}

backup_config() {
    echo "📦 Backing up Agent Zero configuration..."
    local outfile="$BACKUP_DIR/agent_zero_config_${TIMESTAMP}.tar.gz"
    tar czf "$outfile" \
        --exclude='*/memory/*' \
        --exclude='*/chats/*' \
        --exclude='*/.git/*' \
        --exclude='*/__pycache__/*' \
        -C /home/vzor agent-zero-data/knowledge \
        agent-zero-data/instruments \
        agent-zero-data/agents \
        agent-zero-data/conf \
        agent-zero-data/settings.json \
        agent-zero-data/.env 2>/dev/null || true
    local size=$(du -h "$outfile" | cut -f1)
    echo "✅ Config backup: $outfile ($size)"
}

rotate_backups() {
    echo "🔄 Rotating backups older than ${RETENTION_DAYS} days..."
    local count=$(find "$BACKUP_DIR" -name "vzor_*" -type f -mtime "+${RETENTION_DAYS}" 2>/dev/null | wc -l)
    if [ "$count" -gt 0 ]; then
        find "$BACKUP_DIR" -name "vzor_*" -type f -mtime "+${RETENTION_DAYS}" -delete
        echo "✅ Removed $count old backup(s)"
    else
        echo "✅ No backups older than ${RETENTION_DAYS} days found"
    fi
    find "$BACKUP_DIR" -name "agent_zero_*" -type f -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
}

list_backups() {
    echo "📋 Existing backups in $BACKUP_DIR:"
    echo "-------------------------------------------"
    if ls "$BACKUP_DIR"/*.{sql.gz,tar.gz} 1>/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{printf "  %s  %s  %s\n", $5, $6" "$7, $9}'
        echo ""
        local total=$(du -sh "$BACKUP_DIR" | cut -f1)
        echo "  Total size: $total"
    else
        echo "  No backups found."
    fi
}

case "$ACTION" in
    full)
        echo "========================================"
        echo "  VZOR Full Backup — $TIMESTAMP"
        echo "========================================"
        backup_db
        backup_config
        rotate_backups
        echo ""
        echo "✅ Full backup completed successfully."
        ;;
    db)
        backup_db
        ;;
    config)
        backup_config
        ;;
    rotate)
        rotate_backups
        ;;
    list)
        list_backups
        ;;
    help|*)
        echo "VZOR Backup Tool"
        echo "Usage: bash vzor_backup.sh <action> [options]"
        echo ""
        echo "Actions:"
        echo "  full    — Full backup (database + config)"
        echo "  db      — Database backup only"
        echo "  config  — Agent Zero config backup only"
        echo "  rotate  — Remove old backups"
        echo "  list    — List existing backups"
        echo ""
        echo "Options:"
        echo "  --retention-days N  — Days to keep backups (default: 30)"
        ;;
esac
