from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from typing import Optional, List
from datetime import datetime
from multi_model import call_model
from db import (get_task, get_task_dependencies, init_db, save_message, get_history, get_all_history, clear_history,
                save_tasks, load_tasks, update_task,
                get_projects, create_project, clone_from_template, delete_project,
                create_guest, find_guest_by_code, find_guest_by_token, record_login, list_guests, revoke_guest)

app = FastAPI(title="VZOR API", version="2.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


class TaskRequest(BaseModel):
    message: str
    model: str = "deepseek"
    context: Optional[dict] = None

class TaskResponse(BaseModel):
    status: str
    response: str
    model: str
    thinking_time: float
    timestamp: str

@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "VZOR API",
        "version": "2.2.0",
        "models": ["deepseek", "claude", "gemini"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/task")
async def process_task(request: TaskRequest) -> TaskResponse:
    import time
    start_time = time.time()
    timestamp = datetime.now().isoformat()

    try:
        category = request.context.get("category") if request.context else None

        # Get history from PostgreSQL
        api_history = await get_history(
            session_id="default",
            category=category,
            limit=20
        )

        # Save user message
        await save_message(
            role="user",
            message=request.message,
            model=request.model,
            category=category or ""
        )

        # Call AI model
        response_text = await call_model(request.model, request.message, api_history, category)

        thinking_time = time.time() - start_time

        # Save assistant response
        await save_message(
            role="assistant",
            message=response_text,
            model=request.model,
            category=category or ""
        )

        return TaskResponse(
            status="success",
            response=response_text,
            model=request.model,
            thinking_time=thinking_time,
            timestamp=timestamp
        )
    except Exception as e:
        return TaskResponse(
            status="error",
            response=f"Error: {str(e)}",
            model=request.model,
            thinking_time=time.time() - start_time,
            timestamp=timestamp
        )

@app.post("/api/voice")
async def process_voice(audio: UploadFile = File(...)):
    return {
        "status": "success",
        "transcription": "[Whisper not connected]",
        "response": "Voice input available after Whisper setup"
    }

@app.get("/api/chat/history")
async def api_get_chat_history():
    messages = await get_all_history(session_id="default")
    return {"messages": messages}

@app.delete("/api/chat/history")
async def api_clear_chat_history():
    await clear_history(session_id="default")
    return {"status": "cleared"}


# ==========================================
# VZOR PROJECTS — Project Management
# ==========================================

@app.get("/api/projects")
async def api_get_projects():
    """List all projects and templates."""
    try:
        projects = await get_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ProjectCreateRequest(BaseModel):
    name: str
    type: str = "project"
    description: str = ""
    source_template_id: Optional[int] = None

@app.post("/api/projects")
async def api_create_project(request: ProjectCreateRequest):
    """Create a new project (empty or from template)."""
    try:
        if request.source_template_id:
            # Clone from template
            result = await clone_from_template(
                template_id=request.source_template_id,
                project_name=request.name,
                description=request.description
            )
            return {"status": "ok", **result}
        else:
            # Create empty project
            result = await create_project(
                name=request.name,
                project_type=request.type,
                description=request.description
            )
            return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/projects/{project_id}")
async def api_delete_project(project_id: int):
    """Delete a project (not templates)."""
    try:
        result = await delete_project(project_id)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# VZOR TASKS — 3D Task Management Endpoints
# ==========================================

class TaskItem(BaseModel):
    id: str
    title: str
    phase: str = ""
    level: int = 1
    status: str = "pending"
    progress: int = 0
    agent: str = ""
    database: str = ""
    dependsOn: List[str] = []
    position_x: float = 0.0
    position_y: float = 0.0
    position_z: float = 0.0
    priority: str = ""
    description: str = ""
    model: str = ""

class TasksSaveRequest(BaseModel):
    tasks: List[TaskItem]
    category: str = ""
    session_id: str = "default"
    project_id: int = 1

class TaskUpdateRequest(BaseModel):
    task_id: str
    project_id: int = 1
    status: Optional[str] = None
    progress: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    title: Optional[str] = None
    agent: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    model: Optional[str] = None


@app.post("/api/tasks/save")
async def api_save_tasks(request: TasksSaveRequest):
    """Save structured tasks to DB."""
    try:
        tasks_data = []
        dependencies = []
        for t in request.tasks:
            tasks_data.append({
                "id": t.id,
                "title": t.title,
                "phase": t.phase,
                "level": t.level,
                "status": t.status,
                "progress": t.progress,
                "agent": t.agent,
                "database": t.database,
                "position_x": t.position_x,
                "position_y": t.position_y,
                "position_z": t.position_z,
                "priority": t.priority,
                "description": t.description,
                "model": t.model,
            })
            for dep_id in t.dependsOn:
                dependencies.append({"from": dep_id, "to": t.id})

        await save_tasks(tasks_data, dependencies, request.category, request.session_id, request.project_id)
        return {"status": "ok", "saved": len(tasks_data), "project_id": request.project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tasks/load")
async def api_load_tasks(category: str = "", session_id: str = "default", project_id: int = 1):
    """Load tasks and dependencies for a project."""
    try:
        result = await load_tasks(category, session_id, project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/tasks/update")
async def api_update_task(request: TaskUpdateRequest):
    """Update a single task (status, position, etc)."""
    try:
        updates = {}
        if request.status is not None:
            updates["status"] = request.status
        if request.progress is not None:
            updates["progress"] = request.progress
        if request.position_x is not None:
            updates["position_x"] = request.position_x
        if request.position_y is not None:
            updates["position_y"] = request.position_y
        if request.position_z is not None:
            updates["position_z"] = request.position_z
        if request.title is not None:
            updates["title"] = request.title
        if request.agent is not None:
            updates["agent"] = request.agent

        ok = await update_task(request.task_id, updates, request.project_id)
        return {"status": "ok" if ok else "no_changes"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ==========================================
# BALANCES — API Provider Balance Endpoints
# ==========================================


@app.get("/api/tasks/get/{task_id:path}")
async def api_get_task(task_id: str, project_id: int = 1):
    """Get a single task with all details."""
    try:
        result = await get_task(task_id, project_id)
        if not result:
            raise HTTPException(status_code=404, detail="Task not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tasks/deps/{task_id:path}")
async def api_get_task_deps(task_id: str, project_id: int = 1):
    """Get task dependencies (blocked_by and blocks)."""
    try:
        result = await get_task_dependencies(task_id, project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/balances")
async def get_balances():
    """Get balances for all API providers."""
    import os
    import httpx

    VPS_PROXY = "http://78.111.86.105:8443"
    balances = {}

    # OpenRouter
    try:
        or_key = os.getenv("OPENROUTER_API_KEY", "")
        async with httpx.AsyncClient(timeout=10) as client:
            # Credits
            r = await client.get(
                f"{VPS_PROXY}/openrouter/api/v1/credits",
                headers={"Authorization": f"Bearer {or_key}"}
            )
            data = r.json().get("data", {})
            total = data.get("total_credits", 0)
            usage = data.get("total_usage", 0)
            balances["openrouter"] = {
                "balance": round(total - usage, 2),
                "total": total,
                "used": round(usage, 2),
                "currency": "USD"
            }
    except Exception:
        balances["openrouter"] = {"balance": None, "error": "unavailable"}

    # DeepSeek
    try:
        ds_key = os.getenv("DEEPSEEK_API_KEY", "")
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://api.deepseek.com/user/balance",
                headers={"Authorization": f"Bearer {ds_key}"}
            )
            data = r.json()
            if data.get("balance_infos"):
                info = data["balance_infos"][0]
                balances["deepseek"] = {
                    "balance": float(info.get("total_balance", 0)),
                    "currency": info.get("currency", "USD")
                }
    except Exception:
        balances["deepseek"] = {"balance": None, "error": "unavailable"}

    # Anthropic (no balance API — check via test request)
    try:
        ant_key = os.getenv("ANTHROPIC_API_KEY", "")
        if ant_key:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(
                    f"{VPS_PROXY}/anthropic/v1/messages",
                    headers={
                        "x-api-key": ant_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={"model": "claude-sonnet-4-5-20250929", "max_tokens": 1, "messages": [{"role": "user", "content": "hi"}]}
                )
                if r.status_code == 200:
                    balances["anthropic"] = {"balance": "active", "currency": "USD"}
                else:
                    err = r.json().get("error", {}).get("message", "")
                    if "credit balance" in err.lower():
                        balances["anthropic"] = {"balance": 0, "currency": "USD", "error": "no credits"}
                    else:
                        balances["anthropic"] = {"balance": None, "error": err[:100]}
        else:
            balances["anthropic"] = {"balance": None, "error": "no key"}
    except Exception:
        balances["anthropic"] = {"balance": None, "error": "unavailable"}

    # Google Gemini (free tier — no balance, just quota status)
    balances["google"] = {"balance": "free tier", "currency": ""}

    return {"balances": balances}


# ==========================================
# AUTH — Guest Authentication Endpoints
# ==========================================

import secrets
import os
import uuid as uuid_mod
import jwt
import qrcode
from io import BytesIO
from fastapi.responses import Response, RedirectResponse
from fastapi import Request

VZOR_JWT_SECRET = os.getenv("VZOR_JWT_SECRET", "change-me-in-production")
VZOR_ADMIN_SECRET = os.getenv("VZOR_ADMIN_SECRET", "AgvzorPse.2327")

# Alphabet without ambiguous chars: 0/O/1/I/L
CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def generate_access_code() -> str:
    """Generate VZOR-XXXX-XXXX code."""
    part1 = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
    part2 = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
    return f"VZOR-{part1}-{part2}"


def create_jwt_token(guest_id: int, guest_name: str) -> str:
    """Create JWT token for session cookie."""
    from datetime import timedelta
    payload = {
        "guest_id": guest_id,
        "name": guest_name,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, VZOR_JWT_SECRET, algorithm="HS256")


def verify_jwt_token(token: str):
    """Verify and decode JWT token. Returns payload or None."""
    try:
        return jwt.decode(token, VZOR_JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


class LoginRequest(BaseModel):
    code: str


@app.get("/api/auth/verify")
async def auth_verify(request: Request):
    """Check if user is authenticated via cookie. Verifies DB status."""
    token = request.cookies.get("vzor_session")
    if not token:
        return {"authenticated": False}
    payload = verify_jwt_token(token)
    if not payload:
        return {"authenticated": False}
    guest_id = payload.get("guest_id")
    if guest_id:
        from db import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id FROM vzor_guests WHERE id = $1 AND is_active = TRUE AND expires_at > NOW()",
                guest_id
            )
            if not row:
                return {"authenticated": False}
    return {"authenticated": True, "name": payload.get("name", "")}


@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    """Login with access code."""
    code = req.code.strip().upper()
    guest = await find_guest_by_code(code)
    if not guest:
        raise HTTPException(status_code=401, detail="Invalid or expired access code")
    await record_login(guest["id"])
    token = create_jwt_token(guest["id"], guest["name"])
    import json as json_mod
    response = Response(
        content=json_mod.dumps({"status": "ok", "name": guest["name"]}),
        media_type="application/json"
    )
    response.set_cookie(
        key="vzor_session",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/"
    )
    return response


@app.get("/api/auth/token/{token_uuid}")
async def auth_token_login(token_uuid: str):
    """Login via QR/link token UUID."""
    guest = await find_guest_by_token(token_uuid)
    if not guest:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    await record_login(guest["id"])
    jwt_token = create_jwt_token(guest["id"], guest["name"])
    response = RedirectResponse(url="/?authenticated=1", status_code=302)
    response.set_cookie(
        key="vzor_session",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/"
    )
    return response


@app.post("/api/auth/logout")
async def auth_logout():
    """Clear session cookie."""
    response = Response(content='{"status":"logged_out"}', media_type="application/json")
    response.delete_cookie(key="vzor_session", path="/")
    return response




@app.get("/go/{short_code}")
async def short_code_redirect(short_code: str):
    """Short URL redirect: /go/S3QB43J8 -> find guest by code -> set cookie -> redirect."""
    # Reconstruct VZOR-XXXX-XXXX from short code
    sc = short_code.upper().replace("-", "")
    if len(sc) == 8:
        code = "VZOR-" + sc[:4] + "-" + sc[4:]
    else:
        raise HTTPException(status_code=404, detail="Invalid code")
    guest = await find_guest_by_code(code)
    if not guest:
        raise HTTPException(status_code=404, detail="Invalid or expired code")
    await record_login(guest["id"])
    jwt_token = create_jwt_token(guest["id"], guest["name"])
    response = RedirectResponse(url="/?authenticated=1", status_code=302)
    response.set_cookie(
        key="vzor_session", value=jwt_token,
        httponly=True, secure=True, samesite="lax",
        max_age=7 * 24 * 3600, path="/"
    )
    return response

# ==========================================
# ADMIN — Guest Management Endpoints
# ==========================================

@app.post("/api/admin/guests")
async def admin_create_guest(request: Request):
    """Create a new guest (requires X-Admin-Secret header)."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    name = body.get("name", "Guest")
    email = body.get("email", "")
    notes = body.get("notes", "")
    expires_days = body.get("expires_days", 90)
    access_code = generate_access_code()
    guest = await create_guest(name, email, access_code, expires_days, notes)
    qr_url = f"https://vzor-ai.com/api/auth/token/{guest['token']}"
    return {
        "status": "ok",
        "guest": guest,
        "access_code": guest["access_code"],
        "qr_url": qr_url,
        "token_login_url": qr_url,
    }


@app.get("/api/admin/guests")
async def admin_list_guests(request: Request):
    """List all guests (requires X-Admin-Secret header)."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    guests = await list_guests()
    return {"guests": guests}


@app.delete("/api/admin/guests/{guest_id}")
async def admin_revoke_guest(guest_id: int, request: Request):
    """Revoke guest access (requires X-Admin-Secret header)."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    result = await revoke_guest(guest_id)
    return result



@app.post("/api/admin/guests/{guest_id}/extend")
async def admin_extend_guest(guest_id: int, request: Request):
    """Extend guest access by N days (requires X-Admin-Secret header)."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    days = body.get("days", 30)
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE vzor_guests SET expires_at = GREATEST(expires_at, NOW()) + make_interval(days => $1) WHERE id = $2",
            days, guest_id
        )
    return {"status": "extended", "guest_id": guest_id, "added_days": days}


@app.patch("/api/admin/guests/{guest_id}")
async def admin_update_guest(guest_id: int, request: Request):
    """Update guest name/email (requires X-Admin-Secret header)."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        if "name" in body:
            await conn.execute("UPDATE vzor_guests SET name = $1 WHERE id = $2", body["name"], guest_id)
        if "email" in body:
            await conn.execute("UPDATE vzor_guests SET email = $1 WHERE id = $2", body["email"], guest_id)
    return {"status": "updated", "guest_id": guest_id}


@app.post("/api/admin/guests/{guest_id}/delete")
async def admin_delete_guest(guest_id: int, request: Request):
    """Permanently delete a guest (requires X-Admin-Secret header)."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM vzor_guests WHERE id = $1", guest_id)
    return {"status": "deleted", "guest_id": guest_id}

@app.get("/api/admin/guests/{guest_id}/qr")
async def admin_guest_qr(guest_id: int, request: Request):
    """Generate QR code PNG for a guest."""
    secret = request.headers.get("X-Admin-Secret", "")
    if secret != VZOR_ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    guests = await list_guests()
    guest = next((g for g in guests if g["id"] == guest_id), None)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    url = f"https://vzor-ai.com/api/auth/token/{guest['token']}"
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="white", back_color="black")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")
