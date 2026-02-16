from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from typing import Optional, List
from datetime import datetime
from multi_model import call_model
from db import (init_db, save_message, get_history, get_all_history, clear_history,
                save_tasks, load_tasks, update_task,
                get_projects, create_project, clone_from_template, delete_project)

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
