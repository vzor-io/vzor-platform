"""
VZOR Chat Memory + Tasks — PostgreSQL
Stores chat history and project tasks persistently.
"""
import asyncpg
import json
from datetime import datetime

import os

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "database": os.getenv("POSTGRES_DB", "vzor_db"),
    "user": os.getenv("POSTGRES_USER", "vzor"),
    "password": os.getenv("POSTGRES_PASSWORD", "VzorDB_Secure_2026!"),
}

_pool = None


async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(**DB_CONFIG, min_size=2, max_size=10)
    return _pool


async def init_db():
    """Create tables if they don't exist."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                session_id TEXT DEFAULT 'default',
                category TEXT DEFAULT '',
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                model TEXT DEFAULT '',
                timestamp TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_chat_session
                ON chat_messages(session_id, timestamp DESC);

            CREATE INDEX IF NOT EXISTS idx_chat_category
                ON chat_messages(category, timestamp DESC);
        """)


async def save_message(role, message, model="", category="", session_id="default"):
    """Save a single message to the database."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO chat_messages (session_id, category, role, message, model, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            session_id, category or "", role, message, model, datetime.now()
        )


async def get_history(session_id="default", category=None, limit=20):
    """Get recent chat history. Optionally filter by category."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        if category:
            rows = await conn.fetch(
                """SELECT role, message FROM chat_messages
                   WHERE session_id = $1 AND category = $2
                   ORDER BY timestamp DESC LIMIT $3""",
                session_id, category, limit
            )
        else:
            rows = await conn.fetch(
                """SELECT role, message FROM chat_messages
                   WHERE session_id = $1
                   ORDER BY timestamp DESC LIMIT $2""",
                session_id, limit
            )
        # Reverse so oldest first
        return [{"role": r["role"], "content": r["message"]} for r in reversed(rows)]


async def get_all_history(session_id="default"):
    """Get all messages for a session."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT role, message, model, category, timestamp
               FROM chat_messages
               WHERE session_id = $1
               ORDER BY timestamp ASC""",
            session_id
        )
        return [
            {
                "role": r["role"],
                "message": r["message"],
                "model": r["model"],
                "category": r["category"],
                "timestamp": r["timestamp"].isoformat(),
            }
            for r in rows
        ]


async def clear_history(session_id="default"):
    """Clear chat history for a session."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM chat_messages WHERE session_id = $1", session_id
        )


# ==========================================
# VZOR PROJECTS — CRUD
# ==========================================

async def get_projects():
    """Get all projects and templates."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT p.id, p.name, p.type, p.source_template_id, p.created_at, p.description,
                   (SELECT count(*) FROM vzor_tasks t WHERE t.project_id = p.id) as task_count
            FROM vzor_projects p
            ORDER BY p.type DESC, p.created_at ASC
        """)
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "source_template_id": r["source_template_id"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "description": r["description"],
                "task_count": r["task_count"],
            }
            for r in rows
        ]


async def create_project(name, project_type="project", source_template_id=None, description=""):
    """Create a new project. Returns the new project id."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO vzor_projects (name, type, source_template_id, description)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, type, created_at
        """, name, project_type, source_template_id, description)
        return {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "created_at": row["created_at"].isoformat(),
        }


async def clone_from_template(template_id, project_name, description=""):
    """Clone all tasks and dependencies from a template into a new project."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Create new project
            row = await conn.fetchrow("""
                INSERT INTO vzor_projects (name, type, source_template_id, description)
                VALUES ($1, 'project', $2, $3)
                RETURNING id
            """, project_name, template_id, description)
            new_id = row["id"]

            # Clone tasks (reset status to pending, progress to 0, clear agent)
            await conn.execute("""
                INSERT INTO vzor_tasks (task_id, title, phase, level, status, progress,
                    agent, database_ref, category, position_x, position_y, position_z,
                    session_id, project_id, priority, description, model,
                    start_date, end_date, deadline, documents, knowledge_sources)
                SELECT task_id, title, phase, level, 'pending', 0,
                    '', database_ref, category, position_x, position_y, position_z,
                    'default', $1, priority, description, model,
                    start_date, end_date, deadline, documents, knowledge_sources
                FROM vzor_tasks WHERE project_id = $2
            """, new_id, template_id)

            # Clone dependencies
            await conn.execute("""
                INSERT INTO vzor_task_dependencies (from_task_id, to_task_id, project_id)
                SELECT from_task_id, to_task_id, $1
                FROM vzor_task_dependencies WHERE project_id = $2
            """, new_id, template_id)

            # Count what was cloned
            task_count = await conn.fetchval(
                "SELECT count(*) FROM vzor_tasks WHERE project_id = $1", new_id
            )
            dep_count = await conn.fetchval(
                "SELECT count(*) FROM vzor_task_dependencies WHERE project_id = $1", new_id
            )

            return {
                "project_id": new_id,
                "name": project_name,
                "tasks_cloned": task_count,
                "dependencies_cloned": dep_count,
            }


async def delete_project(project_id):
    """Delete a project and all its tasks/dependencies (CASCADE)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Don't allow deleting templates
        ptype = await conn.fetchval(
            "SELECT type FROM vzor_projects WHERE id = $1", project_id
        )
        if ptype == "template":
            return {"error": "Cannot delete a template"}
        await conn.execute(
            "DELETE FROM vzor_projects WHERE id = $1", project_id
        )
        return {"status": "deleted", "project_id": project_id}


# ==========================================
# VZOR TASKS — Save / Load / Update
# ==========================================

async def save_tasks(tasks, dependencies, category="", session_id="default", project_id=1):
    """Save array of tasks and their dependencies to DB."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        for t in tasks:
            await conn.execute("""
                INSERT INTO vzor_tasks (task_id, title, phase, level, status, progress,
                    agent, database_ref, category, position_x, position_y, position_z,
                    session_id, project_id, priority, description, model)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                ON CONFLICT (project_id, task_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    phase = EXCLUDED.phase,
                    level = EXCLUDED.level,
                    status = EXCLUDED.status,
                    progress = EXCLUDED.progress,
                    agent = EXCLUDED.agent,
                    database_ref = EXCLUDED.database_ref,
                    category = EXCLUDED.category,
                    position_x = EXCLUDED.position_x,
                    position_y = EXCLUDED.position_y,
                    position_z = EXCLUDED.position_z,
                    priority = EXCLUDED.priority,
                    description = EXCLUDED.description,
                    model = EXCLUDED.model
            """,
                t.get("id", ""),
                t.get("title", ""),
                t.get("phase", ""),
                t.get("level", 1),
                t.get("status", "pending"),
                t.get("progress", 0),
                t.get("agent", ""),
                t.get("database", ""),
                category,
                t.get("position_x", 0.0),
                t.get("position_y", 0.0),
                t.get("position_z", 0.0),
                session_id,
                project_id,
                t.get("priority", ""),
                t.get("description", ""),
                t.get("model", "")
            )

        # Save dependencies
        for dep in dependencies:
            await conn.execute("""
                INSERT INTO vzor_task_dependencies (from_task_id, to_task_id, project_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (project_id, from_task_id, to_task_id) DO NOTHING
            """, dep["from"], dep["to"], project_id)


async def load_tasks(category="", session_id="default", project_id=1):
    """Load tasks and dependencies for a project."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        if category:
            rows = await conn.fetch(
                """SELECT task_id, title, phase, level, status, progress, agent, database_ref,
                          category, position_x, position_y, position_z, created_at,
                          start_date, end_date, deadline, priority, description,
                          documents, knowledge_sources, model
                   FROM vzor_tasks
                   WHERE project_id = $1 AND category = $2 AND session_id = $3
                   ORDER BY created_at ASC""",
                project_id, category, session_id
            )
        else:
            rows = await conn.fetch(
                """SELECT task_id, title, phase, level, status, progress, agent, database_ref,
                          category, position_x, position_y, position_z, created_at,
                          start_date, end_date, deadline, priority, description,
                          documents, knowledge_sources, model
                   FROM vzor_tasks
                   WHERE project_id = $1 AND session_id = $2
                   ORDER BY created_at ASC""",
                project_id, session_id
            )

        tasks = []
        for r in rows:
            tasks.append({
                "id": r["task_id"],
                "title": r["title"],
                "phase": r["phase"],
                "level": r["level"],
                "status": r["status"],
                "progress": r["progress"],
                "agent": r["agent"],
                "database": r["database_ref"],
                "category": r["category"],
                "position_x": r["position_x"],
                "position_y": r["position_y"],
                "position_z": r["position_z"],
                "start_date": r["start_date"].isoformat() if r["start_date"] else None,
                "end_date": r["end_date"].isoformat() if r["end_date"] else None,
                "deadline": r["deadline"].isoformat() if r["deadline"] else None,
                "priority": r["priority"] or "",
                "description": r["description"] or "",
                "documents": json.loads(r["documents"]) if isinstance(r["documents"], str) else (r["documents"] if r["documents"] else []),
                "knowledge_sources": json.loads(r["knowledge_sources"]) if isinstance(r["knowledge_sources"], str) else (r["knowledge_sources"] if r["knowledge_sources"] else []),
                "model": r["model"] or "",
            })

        # Load dependencies for this project
        dep_rows = await conn.fetch(
            """SELECT from_task_id, to_task_id
               FROM vzor_task_dependencies
               WHERE project_id = $1""",
            project_id
        )

        dependencies = [{"from": r["from_task_id"], "to": r["to_task_id"]} for r in dep_rows]

        return {"tasks": tasks, "dependencies": dependencies, "project_id": project_id}


async def update_task(task_id, updates, project_id=1):
    """Update a single task's fields (status, progress, position)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        allowed = ["status", "progress", "position_x", "position_y", "position_z", "title", "agent", "priority", "description", "model"]
        sets = []
        vals = []
        idx = 1
        for key in allowed:
            if key in updates:
                sets.append(f"{key} = ${idx}")
                vals.append(updates[key])
                idx += 1
        if not sets:
            return False
        vals.append(project_id)
        vals.append(task_id)
        query = f"UPDATE vzor_tasks SET {', '.join(sets)} WHERE project_id = ${idx} AND task_id = ${idx + 1}"
        await conn.execute(query, *vals)
        return True


# ==========================================
# VZOR GUESTS — Auth / Access Management
# ==========================================

async def create_guest(name: str, email: str, access_code: str, expires_days: int = 90, notes: str = ""):
    """Create a new guest entry."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO vzor_guests (name, email, access_code, expires_at, notes)
            VALUES ($1, $2, $3, NOW() + make_interval(days => $4), $5)
            RETURNING id, name, email, access_code, token, is_active, created_at, expires_at
        """, name, email, access_code, expires_days, notes)
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "access_code": row["access_code"],
            "token": str(row["token"]),
            "is_active": row["is_active"],
            "created_at": row["created_at"].isoformat(),
            "expires_at": row["expires_at"].isoformat(),
        }


async def find_guest_by_code(code: str):
    """Find an active, non-expired guest by access code."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, name, email, access_code, token, is_active, created_at, expires_at
            FROM vzor_guests
            WHERE access_code = $1 AND is_active = TRUE AND expires_at > NOW()
        """, code)
        if not row:
            return None
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "access_code": row["access_code"],
            "token": str(row["token"]),
            "is_active": row["is_active"],
            "created_at": row["created_at"].isoformat(),
            "expires_at": row["expires_at"].isoformat(),
        }


async def find_guest_by_token(token_uuid: str):
    """Find an active, non-expired guest by token UUID."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, name, email, access_code, token, is_active, created_at, expires_at
            FROM vzor_guests
            WHERE token = $1::uuid AND is_active = TRUE AND expires_at > NOW()
        """, token_uuid)
        if not row:
            return None
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "access_code": row["access_code"],
            "token": str(row["token"]),
            "is_active": row["is_active"],
            "created_at": row["created_at"].isoformat(),
            "expires_at": row["expires_at"].isoformat(),
        }


async def record_login(guest_id: int):
    """Record a guest login (update last_login_at and increment login_count)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE vzor_guests
            SET last_login_at = NOW(), login_count = login_count + 1
            WHERE id = $1
        """, guest_id)


async def list_guests():
    """List all guests."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, name, email, access_code, token, is_active,
                   created_at, expires_at, last_login_at, login_count, notes
            FROM vzor_guests
            ORDER BY created_at DESC
        """)
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "access_code": r["access_code"],
                "token": str(r["token"]),
                "is_active": r["is_active"],
                "created_at": r["created_at"].isoformat(),
                "expires_at": r["expires_at"].isoformat() if r["expires_at"] else None,
                "last_login_at": r["last_login_at"].isoformat() if r["last_login_at"] else None,
                "login_count": r["login_count"],
                "notes": r["notes"],
            }
            for r in rows
        ]


async def revoke_guest(guest_id: int):
    """Revoke guest access (set is_active = FALSE)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE vzor_guests SET is_active = FALSE WHERE id = $1
        """, guest_id)
        return {"status": "revoked", "guest_id": guest_id}

async def activate_guest(guest_id):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE vzor_guests SET is_active = TRUE WHERE id = $1", guest_id)

async def get_task(task_id, project_id=1):
    """Get a single task by ID."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        r = await conn.fetchrow(
            """SELECT task_id, title, phase, level, status, progress, agent, database_ref,
                      category, position_x, position_y, position_z, created_at,
                      start_date, end_date, deadline, priority, description,
                      documents, knowledge_sources, model
               FROM vzor_tasks
               WHERE project_id = $1 AND task_id = $2""",
            project_id, task_id
        )
        if not r:
            return None
        return {
            "id": r["task_id"],
            "title": r["title"],
            "phase": r["phase"],
            "level": r["level"],
            "status": r["status"],
            "progress": r["progress"],
            "agent": r["agent"],
            "database": r["database_ref"],
            "priority": r["priority"] or "",
            "description": r["description"] or "",
            "model": r["model"] or "",
            "start_date": r["start_date"].isoformat() if r["start_date"] else None,
            "end_date": r["end_date"].isoformat() if r["end_date"] else None,
            "deadline": r["deadline"].isoformat() if r["deadline"] else None,
            "documents": json.loads(r["documents"]) if isinstance(r["documents"], str) else (r["documents"] if r["documents"] else []),
            "knowledge_sources": json.loads(r["knowledge_sources"]) if isinstance(r["knowledge_sources"], str) else (r["knowledge_sources"] if r["knowledge_sources"] else []),
        }


async def get_task_dependencies(task_id, project_id=1):
    """Get dependencies for a task (what blocks it and what it blocks)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        blocked_by = await conn.fetch(
            """SELECT d.from_task_id, t.title, t.status, t.progress
               FROM vzor_task_dependencies d
               JOIN vzor_tasks t ON t.task_id = d.from_task_id AND t.project_id = d.project_id
               WHERE d.to_task_id = $1 AND d.project_id = $2""",
            task_id, project_id
        )
        blocks = await conn.fetch(
            """SELECT d.to_task_id, t.title, t.status, t.progress
               FROM vzor_task_dependencies d
               JOIN vzor_tasks t ON t.task_id = d.to_task_id AND t.project_id = d.project_id
               WHERE d.from_task_id = $1 AND d.project_id = $2""",
            task_id, project_id
        )
        return {
            "blocked_by": [{"id": r["from_task_id"], "title": r["title"], "status": r["status"], "progress": r["progress"]} for r in blocked_by],
            "blocks": [{"id": r["to_task_id"], "title": r["title"], "status": r["status"], "progress": r["progress"]} for r in blocks],
        }
