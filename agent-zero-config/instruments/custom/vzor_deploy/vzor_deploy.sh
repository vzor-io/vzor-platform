#!/bin/bash
# VZOR Frontend Deployment Tool
# Usage: bash vzor_deploy.sh <action> [options]

set -euo pipefail

FRONTEND_DIR="/home/vzor/vzor-app/frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ACTION="${1:-help}"
shift || true

# Parse options
NO_COMMIT=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-commit) NO_COMMIT=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

cd "$FRONTEND_DIR"

log_deploy() {
    local dtype="$1" status="$2" desc="$3" err="${4:-}"
    local commit=$(git rev-parse --short HEAD 2>/dev/null || echo "none")
    local branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "none")
    docker exec vzor-postgres psql -U vzor -d vzor_db -c "
        INSERT INTO agent_zero.deployment_log (deploy_type, status, git_commit, git_branch, description, error_message)
        VALUES ('$dtype', '$status', '$commit', '$branch', '$(echo "$desc" | sed "s/'/''/g")', '$(echo "$err" | sed "s/'/''/g")');
    " 2>/dev/null || true
}

validate_index() {
    local file="$FRONTEND_DIR/index.html"
    if [ ! -f "$file" ]; then
        echo "❌ index.html not found!"
        return 1
    fi
    local size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
    if [ "$size" -lt 1000 ]; then
        echo "❌ index.html is suspiciously small ($size bytes). Possible patch failure."
        return 1
    fi
    echo "✅ index.html validated: $size bytes"
    return 0
}

case "$ACTION" in
    deploy)
        echo "========================================"
        echo "  VZOR Frontend Deployment — $TIMESTAMP"
        echo "========================================"
        log_deploy "frontend" "started" "Frontend deploy initiated"

        # Step 1: Backup
        echo ""
        echo "Step 1: Creating backup..."
        cp index.html "index.html.backup.${TIMESTAMP}"
        echo "  ✅ Backup: index.html.backup.${TIMESTAMP}"

        # Step 2: Apply patches
        echo ""
        echo "Step 2: Applying patches..."
        if python3 patch_oc.py; then
            echo "  ✅ Patches applied successfully"
        else
            echo "  ❌ Patch failed!"
            log_deploy "frontend" "failed" "Patch failed" "patch_oc.py returned non-zero"
            # Restore backup
            cp "index.html.backup.${TIMESTAMP}" index.html
            echo "  🔄 Restored from backup"
            exit 1
        fi

        # Step 3: Validate
        echo ""
        echo "Step 3: Validating..."
        if ! validate_index; then
            log_deploy "frontend" "failed" "Validation failed" "index.html invalid"
            cp "index.html.backup.${TIMESTAMP}" index.html
            echo "  🔄 Restored from backup"
            exit 1
        fi

        # Step 4: Git commit
        if [ "$NO_COMMIT" = false ]; then
            echo ""
            echo "Step 4: Git commit..."
            cd "$FRONTEND_DIR/.." || cd "$FRONTEND_DIR"
            git add frontend/index.html frontend/patch_oc.py 2>/dev/null || git add index.html patch_oc.py 2>/dev/null || true
            git commit -m "deploy: frontend update ${TIMESTAMP}" 2>/dev/null && echo "  ✅ Committed" || echo "  ℹ️  Nothing to commit"
        else
            echo ""
            echo "Step 4: Git commit skipped (--no-commit)"
        fi

        # Step 5: Restart Nginx
        echo ""
        echo "Step 5: Restarting Nginx..."
        docker restart vzor-nginx
        sleep 2
        nginx_status=$(docker inspect -f '{{.State.Status}}' vzor-nginx 2>/dev/null || echo "unknown")
        if [ "$nginx_status" = "running" ]; then
            echo "  ✅ Nginx restarted and running"
        else
            echo "  ❌ Nginx status: $nginx_status"
            log_deploy "frontend" "failed" "Nginx restart failed" "Status: $nginx_status"
            exit 1
        fi

        log_deploy "frontend" "success" "Frontend deployed successfully"
        echo ""
        echo "========================================"
        echo "  ✅ Deployment completed successfully"
        echo "========================================"
        ;;

    patch)
        echo "Applying patches..."
        python3 patch_oc.py
        validate_index
        echo "✅ Patches applied. Nginx NOT restarted (use 'deploy' for full cycle)."
        ;;

    validate)
        validate_index
        ;;

    rollback)
        echo "🔄 Rolling back to previous version..."
        latest_backup=$(ls -t index.html.backup.* 2>/dev/null | head -1)
        if [ -z "$latest_backup" ]; then
            echo "❌ No backup files found!"
            exit 1
        fi
        cp "$latest_backup" index.html
        validate_index
        docker restart vzor-nginx
        log_deploy "rollback" "success" "Rolled back to $latest_backup"
        echo "✅ Rolled back to: $latest_backup"
        ;;

    history)
        echo "📜 Deployment History (last 10)"
        echo "-------------------------------------------"
        docker exec vzor-postgres psql -U vzor -d vzor_db -c "
            SELECT id, deploy_type, status, git_commit, created_at::timestamp(0)
            FROM agent_zero.deployment_log
            ORDER BY created_at DESC
            LIMIT 10;
        " 2>/dev/null || echo "No deployment history available (schema not initialized?)"
        ;;

    help|*)
        echo "VZOR Frontend Deployment Tool"
        echo "Usage: bash vzor_deploy.sh <action> [options]"
        echo ""
        echo "Actions:"
        echo "  deploy     — Full deployment (patch + validate + commit + restart)"
        echo "  patch      — Apply patches only (no restart)"
        echo "  validate   — Validate current index.html"
        echo "  rollback   — Rollback to latest backup"
        echo "  history    — Show deployment history from DB"
        echo ""
        echo "Options:"
        echo "  --no-commit  — Skip git commit step"
        ;;
esac
