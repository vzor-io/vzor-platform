#!/bin/bash
# VZOR System Diagnostics
# Usage: bash vzor_diagnostics.sh

set -euo pipefail

echo "========================================"
echo "  VZOR System Diagnostics Report"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# --- Docker Services ---
echo "## Docker Services"
echo "-------------------------------------------"
for container in vzor-nginx vzor-fastapi vzor-postgres vzor-redis vzor-agent-zero vzor-portainer vzor-grafana vzor-prometheus; do
    status=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
    if [ "$status" = "running" ]; then
        uptime=$(docker inspect -f '{{.State.StartedAt}}' "$container" 2>/dev/null | cut -d'.' -f1)
        echo "  ✅ $container: RUNNING (since $uptime)"
    elif [ "$status" = "not found" ]; then
        echo "  ⚠️  $container: NOT FOUND"
    else
        echo "  ❌ $container: $status"
    fi
done
echo ""

# --- System Resources ---
echo "## System Resources"
echo "-------------------------------------------"

# CPU
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' 2>/dev/null || echo "N/A")
echo "  CPU Usage: ${cpu_usage}%"

# RAM
mem_info=$(free -h | awk '/Mem:/ {printf "Used: %s / Total: %s (Available: %s)", $3, $2, $7}')
echo "  RAM: $mem_info"

# Disk
disk_info=$(df -h / | awk 'NR==2 {printf "Used: %s / Total: %s (%s)", $3, $2, $5}')
echo "  Disk (/): $disk_info"

# Docker disk
docker_disk=$(docker system df 2>/dev/null | tail -n +2 | awk '{printf "  Docker %s: %s (reclaimable: %s)\n", $1, $3, $5}' || echo "  Docker disk: N/A")
echo "$docker_disk"
echo ""

# --- Database ---
echo "## PostgreSQL"
echo "-------------------------------------------"
db_check=$(docker exec vzor-postgres psql -U vzor -d vzor_db -c "SELECT 'connected' AS status;" -t 2>/dev/null | tr -d ' ' || echo "FAILED")
if [ "$db_check" = "connected" ]; then
    echo "  ✅ Connection: OK"
    db_size=$(docker exec vzor-postgres psql -U vzor -d vzor_db -c "SELECT pg_size_pretty(pg_database_size('vzor_db'));" -t 2>/dev/null | tr -d ' ')
    echo "  Database size: $db_size"
    table_count=$(docker exec vzor-postgres psql -U vzor -d vzor_db -c "SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema');" -t 2>/dev/null | tr -d ' ')
    echo "  Tables: $table_count"
else
    echo "  ❌ Connection: FAILED"
fi
echo ""

# --- Redis ---
echo "## Redis"
echo "-------------------------------------------"
redis_check=$(docker exec vzor-redis redis-cli ping 2>/dev/null || echo "FAILED")
if [ "$redis_check" = "PONG" ]; then
    echo "  ✅ Connection: OK"
    redis_keys=$(docker exec vzor-redis redis-cli dbsize 2>/dev/null | awk '{print $2}')
    echo "  Keys: $redis_keys"
    redis_mem=$(docker exec vzor-redis redis-cli info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    echo "  Memory: $redis_mem"
else
    echo "  ❌ Connection: FAILED"
fi
echo ""

# --- Last Deployment ---
echo "## Last Deployment"
echo "-------------------------------------------"
last_deploy=$(docker exec vzor-postgres psql -U vzor -d vzor_db -t -c "
    SELECT deploy_type || ' | ' || status || ' | ' || created_at::text
    FROM agent_zero.deployment_log
    ORDER BY created_at DESC LIMIT 1;
" 2>/dev/null | tr -d ' ' || echo "")
if [ -n "$last_deploy" ]; then
    echo "  $last_deploy"
else
    echo "  No deployment records found"
fi
echo ""

# --- Recommendations ---
echo "## Recommendations"
echo "-------------------------------------------"
issues=0

# Check disk usage
disk_pct=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
if [ "$disk_pct" -gt 80 ]; then
    echo "  ⚠️  Disk usage is above 80% ($disk_pct%). Consider cleanup: docker system prune -f"
    issues=$((issues + 1))
fi

# Check if any containers are down
down_containers=$(docker ps -a --filter "name=vzor-" --filter "status=exited" --format "{{.Names}}" 2>/dev/null)
if [ -n "$down_containers" ]; then
    echo "  ⚠️  Stopped containers: $down_containers"
    issues=$((issues + 1))
fi

if [ "$issues" -eq 0 ]; then
    echo "  ✅ No issues detected. All systems operational."
fi

echo ""
echo "========================================"
echo "  End of Diagnostics Report"
echo "========================================"
