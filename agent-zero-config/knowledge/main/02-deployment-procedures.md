# VZOR Deployment Procedures

## Frontend Deployment (Patch System)

The VZOR frontend uses a patch-based deployment system to inject custom code into the Three.js application.

### Patch Workflow
```
index.html.bak (original template)
       ↓
  patch_oc.py (applies patches)
       ↓
  index.html (production file served by Nginx)
```

### Step-by-Step Deployment
1. **Backup current state**: `cp index.html index.html.backup.$(date +%Y%m%d%H%M%S)`
2. **Edit patches**: Modify `patch_oc.py` with new changes
3. **Apply patches**: `python3 patch_oc.py` — transforms `index.html.bak` → `index.html`
4. **Validate**: Check `index.html` for syntax errors, verify file size is reasonable
5. **Git commit**: `git add index.html patch_oc.py && git commit -m "feat: description"`
6. **Restart Nginx**: `docker restart vzor-nginx`
7. **Verify**: Open the site and check browser console for errors

### Important Files
| File | Location | Description |
|------|----------|-------------|
| `index.html.bak` | `/home/vzor/vzor-app/frontend/` | Original template, never modify directly |
| `patch_oc.py` | `/home/vzor/vzor-app/frontend/` | Patch script, main editing target |
| `index.html` | `/home/vzor/vzor-app/frontend/` | Generated output, served by Nginx |

### Safety Rules
- NEVER edit `index.html` directly — it will be overwritten by `patch_oc.py`
- NEVER edit `index.html.bak` — it's the pristine template
- ALWAYS validate `index.html` after patching (check file size, no empty file)
- ALWAYS keep a backup before deployment
- ALWAYS commit both `patch_oc.py` AND `index.html` together

## Backend Deployment
1. Edit backend code in `/home/vzor/vzor-app/backend/`
2. `git add . && git commit -m "fix: description"`
3. `docker restart vzor-fastapi`
4. Check logs: `docker logs vzor-fastapi --tail 50`

## Database Migrations
1. Create migration SQL in `/home/vzor/vzor-app/backend/migrations/`
2. Apply: `docker exec -i vzor-postgres psql -U vzor -d vzor_db < migration.sql`
3. Verify: `docker exec vzor-postgres psql -U vzor -d vzor_db -c "\dt"`

## Rollback Procedures

### Frontend Rollback
```bash
# Option 1: Restore from backup
cp index.html.backup.<timestamp> index.html
docker restart vzor-nginx

# Option 2: Git rollback
git checkout HEAD~1 -- frontend/index.html
docker restart vzor-nginx
```

### Backend Rollback
```bash
git checkout HEAD~1 -- backend/
docker restart vzor-fastapi
```

### Full Rollback
```bash
git revert HEAD
docker compose -f /home/vzor/docker/vzor-app/docker-compose.yml restart
```

## Deployment Checklist
- [ ] Changes tested locally or reviewed
- [ ] Backup created
- [ ] Patches applied successfully
- [ ] index.html validated (non-empty, correct size)
- [ ] Git committed with descriptive message
- [ ] Docker container restarted
- [ ] Site accessible and functional
- [ ] No errors in browser console
- [ ] No errors in container logs
