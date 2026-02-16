import aiohttp

AGENT_ZERO_URL = "http://vzor-agent-zero"

# LLM backend configs for AgentVzor.0
LLM_BACKENDS = {
    "deepseek": {
        "provider": "deepseek",
        "model_name": "deepseek-chat",
    },
    "claude": {
        "provider": "anthropic",
        "model_name": "claude-sonnet-4.5",
    },
    "gemini": {
        "provider": "google",
        "model_name": "gemini-2.0-flash-001",
    },
}

_current_backend = "deepseek"


async def _switch_llm_backend(model_id: str):
    """Switch Agent Zero's LLM backend via settings API."""
    global _current_backend
    if model_id == _current_backend:
        return  # already on this backend

    backend = LLM_BACKENDS.get(model_id)
    if not backend:
        return

    # Update Agent Zero settings via API
    settings_payload = {
        "chat_model_provider": backend["provider"],
        "chat_model_name": backend["model_name"],
        "util_model_provider": backend["provider"],
        "util_model_name": backend["model_name"],
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{AGENT_ZERO_URL}/api/settings/set",
                headers={"X-API-KEY": "vzor-agent-key-2026"},
                json=settings_payload,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status == 200:
                    _current_backend = model_id
    except Exception:
        pass  # Fallback to default model


async def call_agent_zero(message, history=None, system_prompt=None, category=None, llm_backend=None):
    """Send message to AgentVzor.0. Optionally switch LLM backend first."""
    if llm_backend and llm_backend in LLM_BACKENDS:
        await _switch_llm_backend(llm_backend)

    payload = {
        "message": message,
        "lifetime_hours": 24
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{AGENT_ZERO_URL}/api_message",
                json=payload,
                headers={'X-API-KEY': 'vzor-agent-key-2026'},
                timeout=aiohttp.ClientTimeout(total=300)
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    return f"AgentVzor.0 error ({resp.status}): {text}"
                data = await resp.json()
                return data.get("response", "Нет ответа от AgentVzor.0")
    except aiohttp.ClientConnectorError:
        return "AgentVzor.0 недоступен. Проверьте: systemctl status agent-zero"
    except Exception as e:
        return f"Ошибка AgentVzor.0: {str(e)}"
