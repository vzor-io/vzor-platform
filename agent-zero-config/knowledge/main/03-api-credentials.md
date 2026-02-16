# VZOR API Credentials & Connections

## Database Connections

### PostgreSQL (vzor_db)
- **Host**: vzor-postgres (Docker internal) / localhost:5432 (from host)
- **Database**: vzor_db
- **User**: vzor
- **Password**: stored in `/home/vzor/docker/vzor-app/.env` as `POSTGRES_PASSWORD`
- **Connection string**: `postgresql://vzor:${POSTGRES_PASSWORD}@vzor-postgres:5432/vzor_db`

### Redis
- **Host**: vzor-redis (Docker internal) / localhost:6379 (from host)
- **No authentication** (internal network only)
- **Connection**: `redis://vzor-redis:6379/0`

## API Keys

### DeepSeek API
- **Purpose**: AI code generation and analysis
- **Key location**: `/home/vzor/agent-zero-data/.env` as `API_KEY_DEEPSEEK`
- **Base URL**: `https://api.deepseek.com/v1`
- **Models used**: deepseek-chat, deepseek-coder

### Google Gemini API
- **Purpose**: Alternative AI model for analysis
- **Key location**: `/home/vzor/agent-zero-data/.env` as `API_KEY_GEMINI`
- **Base URL**: `https://generativelanguage.googleapis.com/v1beta`

### Agent Zero Configuration
- **Config file**: `/home/vzor/agent-zero-data/settings.json`
- **Environment**: `/home/vzor/agent-zero-data/.env`

## SSH Access
- **Server**: 95.174.95.209
- **User**: vzor
- **Auth**: SSH key (`~/.ssh/id_rsa` or `~/.ssh/id_ed25519`)
- **From Agent Zero container**: Use `ssh vzor@host.docker.internal` or direct IP

## Security Notes
- All API keys are stored in `.env` files, never in code or knowledge base
- PostgreSQL is not exposed externally (Docker internal network only)
- Redis has no auth but is internal-only
- SSH uses key-based authentication, password auth is disabled
- Always use environment variables for secrets, never hardcode
- When accessing credentials programmatically, read from `.env` files
