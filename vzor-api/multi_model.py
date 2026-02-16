"""
Multi-model client:
- or/* -> OpenRouter (via VPS proxy)
- deepseek -> Direct DeepSeek API
- claude -> Direct Anthropic API (via OpenRouter+VPS proxy)
- gemini -> Direct Google Gemini API (via VPS proxy)
- agent-zero -> Agent Zero
"""
import os
from agent_zero_client import call_agent_zero

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")

VPS_PROXY = "http://78.111.86.105:8443"

# Minimal identity prompts so models correctly identify themselves
MODEL_IDENTITY = {
    "deepseek-chat": "You are DeepSeek V3, an AI assistant by DeepSeek.",
    "anthropic/claude-sonnet-4.5": "You are Claude Sonnet 4.5, an AI assistant by Anthropic.",
    "anthropic/claude-opus-4.6": "You are Claude Opus 4.6, an AI assistant by Anthropic.",
    "openai/gpt-4o": "You are GPT-4o, an AI assistant by OpenAI.",
    "google/gemini-2.0-flash-001": "You are Gemini 2.0 Flash, an AI assistant by Google.",
    "google/gemini-2.5-pro-preview": "You are Gemini 2.5 Pro, an AI assistant by Google.",
    "deepseek/deepseek-chat": "You are DeepSeek V3, an AI assistant by DeepSeek.",
    "meta-llama/llama-3.3-70b-instruct": "You are Llama 3.3 70B by Meta.",
    "mistralai/mistral-large-latest": "You are Mistral Large by Mistral AI.",
    "qwen/qwen-2.5-72b-instruct": "You are Qwen 2.5 72B by Alibaba.",
}


async def call_openai_compatible(message, history, api_key, base_url, model, max_tokens=4000):
    """Generic OpenAI-compatible API client"""
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    messages = []
    identity = MODEL_IDENTITY.get(model, "")
    if identity:
        messages.append({"role": "system", "content": identity})
    if history:
        messages.extend(history[-10:])
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7
    )
    return response.choices[0].message.content


async def call_openrouter(message, history=None, model="anthropic/claude-sonnet-4.5"):
    """OpenRouter API call via VPS proxy"""
    if not OPENROUTER_KEY:
        return "OpenRouter API key not set."
    return await call_openai_compatible(
        message, history, OPENROUTER_KEY,
        f"{VPS_PROXY}/openrouter/api/v1", model, 4000
    )


async def call_deepseek_direct(message, history=None):
    """Direct DeepSeek API call"""
    if not DEEPSEEK_KEY:
        return "DeepSeek API key not set."
    return await call_openai_compatible(
        message, history, DEEPSEEK_KEY,
        "https://api.deepseek.com", "deepseek-chat", 4000
    )


async def call_gemini_direct(message, history=None):
    """Direct Gemini API via VPS proxy"""
    if not GEMINI_KEY:
        return "Gemini API key not set."
    return await call_openai_compatible(
        message, history, GEMINI_KEY,
        f"{VPS_PROXY}/google/v1beta/openai", "gemini-2.0-flash", 4000
    )


async def call_claude_direct(message, history=None):
    """Direct Claude API via OpenRouter VPS proxy"""
    return await call_openrouter(message, history, "anthropic/claude-opus-4.6")


async def call_model(model_id, message, history=None, category=None):
    """Route to appropriate backend based on model_id."""

    # OpenRouter models -> via VPS proxy
    if model_id.startswith("or/"):
        or_model = model_id[3:]
        return await call_openrouter(message, history, or_model)

    # Direct API calls
    if model_id == "deepseek":
        return await call_deepseek_direct(message, history)

    if model_id == "claude":
        return await call_claude_direct(message, history)

    if model_id == "gemini":
        return await call_gemini_direct(message, history)

    # Agent Zero (default)
    return await call_agent_zero(
        message=message,
        history=history,
        category=category,
    )
