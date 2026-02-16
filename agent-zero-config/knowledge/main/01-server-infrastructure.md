# VZOR Server Infrastructure

## Server
- **Provider**: Cloud.ru (Russian cloud provider)
- **IP**: 95.174.95.209
- **OS**: Ubuntu 22.04 LTS
- **User**: vzor (primary), root (admin)
- **SSH**: Key-based authentication

## Docker Architecture
The server runs 3 Docker Compose stacks with a total of ~16 containers.

### Stack 1: VZOR Application (`/home/vzor/docker/vzor-app/`)
| Container | Port | Description |
|-----------|------|-------------|
| vzor-nginx | 80, 443 | Reverse proxy, serves frontend static files |
| vzor-fastapi | 8000 | Backend API server |
| vzor-postgres | 5432 | PostgreSQL 15 database (vzor_db) |
| vzor-redis | 6379 | Redis cache and session store |

### Stack 2: Agent Zero (`/home/vzor/docker/agent-zero/`)
| Container | Port | Description |
|-----------|------|-------------|
| vzor-agent-zero | 50080 | Agent Zero web UI and agent runtime |

### Stack 3: Monitoring & Services (`/home/vzor/docker/services/`)
| Container | Port | Description |
|-----------|------|-------------|
| vzor-portainer | 9000 | Docker management UI |
| vzor-grafana | 3000 | Monitoring dashboards |
| vzor-prometheus | 9090 | Metrics collection |

## Key Ports
| Port | Service | Access |
|------|---------|--------|
| 80/443 | Nginx (VZOR frontend) | Public |
| 8000 | FastAPI | Internal (proxied via Nginx) |
| 5432 | PostgreSQL | Internal only |
| 6379 | Redis | Internal only |
| 50080 | Agent Zero UI | Internal/VPN |
| 9000 | Portainer | Internal/VPN |

## Docker Networks
- `vzor-network` — shared network for all VZOR containers
- All containers can reach each other by container name (e.g., `vzor-postgres:5432`)

## Storage
| Path | Usage | Size |
|------|-------|------|
| `/home/vzor/vzor-app/` | Application code | ~500MB |
| `/home/vzor/agent-zero-data/` | Agent Zero data, knowledge, instruments | ~200MB |
| `/home/vzor/backups/` | Database and config backups | ~2GB |
| `/var/lib/docker/volumes/` | Docker persistent volumes | ~5GB |

## Maintenance
- Docker logs: `docker logs <container-name> --tail 100`
- Restart service: `docker restart <container-name>`
- Full stack restart: `cd /home/vzor/docker/<stack>/ && docker compose down && docker compose up -d`
- Disk cleanup: `docker system prune -f`
