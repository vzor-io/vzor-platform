import os
from typing import Annotated, Literal, Union
from urllib.parse import urlparse
from openai import BaseModel
from pydantic import Field
from fastmcp import FastMCP

from agent import AgentContext, AgentContextType, UserMessage
from python.helpers.persist_chat import remove_chat
from initialize import initialize_agent
from python.helpers.print_style import PrintStyle
from python.helpers import settings
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import ASGIApp, Receive, Scope, Send
from fastmcp.server.http import create_sse_app
from starlette.requests import Request
import threading

_PRINTER = PrintStyle(italic=True, font_color="green", padding=False)

mcp_server: FastMCP = FastMCP(
    name="Agent Zero integrated MCP Server",
    instructions="""
    Connect to remote Agent Zero instance.
    Agent Zero is a general AI assistant controlling it's linux environment.
    Agent Zero can install software, manage files, execute commands, code, use internet, etc.
    Agent Zero's environment is isolated unless configured otherwise.
    """,
)

class ToolResponse(BaseModel):
    status: Literal["success"] = Field(
        description="The status of the response", default="success"
    )
    response: str = Field(
        description="The response from the remote Agent Zero Instance"
    )
    chat_id: str = Field(description="The id of the chat this message belongs to.")

class ToolError(BaseModel):
    status: Literal["error"] = Field(
        description="The status of the response", default="error"
    )
    error: str = Field(
        description="The error message from the remote Agent Zero Instance"
    )
    chat_id: str = Field(description="The id of the chat this message belongs to.")

SEND_MESSAGE_DESCRIPTION = "Send a message to the remote Agent Zero Instance."

@mcp_server.tool(name="send_message")
async def send_message(
    message: Annotated[str, Field(description="Message text")],
    attachments: Annotated[list[str], Field(default=None)] = None,
    chat_id: Annotated[str, Field(default=None)] = None,
    persistent_chat: Annotated[bool, Field(default=None)] = None,
) -> Union[ToolResponse, ToolError]:
    context: AgentContext | None = None
    if chat_id:
        context = AgentContext.get(chat_id)
        if not context: return ToolError(error="Chat not found", chat_id=chat_id)
        persistent_chat = True
    else:
        config = initialize_agent()
        context = AgentContext(config=config, type=AgentContextType.BACKGROUND)

    if not message: return ToolError(error="Message is required", chat_id=context.id if persistent_chat else "")

    try:
        response = await _run_chat(context, message, attachments)
        if not persistent_chat:
            context.reset()
            AgentContext.remove(context.id)
            remove_chat(context.id)
        return ToolResponse(response=response, chat_id=context.id if persistent_chat else "")
    except Exception as e:
        return ToolError(error=str(e), chat_id=context.id if persistent_chat else "")

@mcp_server.tool(name="finish_chat")
async def finish_chat(chat_id: str) -> Union[ToolResponse, ToolError]:
    context = AgentContext.get(chat_id)
    if not context: return ToolError(error="Chat not found", chat_id=chat_id)
    context.reset()
    AgentContext.remove(context.id)
    remove_chat(context.id)
    return ToolResponse(response="Chat finished", chat_id=chat_id)

async def _run_chat(context: AgentContext, message: str, attachments: list[str] | None = None):
    try:
        _PRINTER.print(f"MCP User message: > {message}")
        task = context.communicate(UserMessage(message=message, attachments=attachments or []))
        result = await task.result()
        return result
    except Exception as e:
        _PRINTER.print(f"MCP Error: {e}")
        raise RuntimeError(f"Failed: {e}")

class DynamicMcpProxy:
    _instance: "DynamicMcpProxy | None" = None

    def __init__(self):
        cfg = settings.get_settings()
        self.token = ""
        self.sse_app: ASGIApp | None = None
        self.http_app: ASGIApp | None = None
        self._lock = threading.RLock()
        self.reconfigure(cfg["mcp_server_token"])

    @staticmethod
    def get_instance():
        if DynamicMcpProxy._instance is None:
            DynamicMcpProxy._instance = DynamicMcpProxy()
        return DynamicMcpProxy._instance

    def reconfigure(self, token: str):
        if self.token == token: return
        self.token = token
        
        # Безопасная настройка путей
        try:
            mcp_server.settings.message_path = f"/t-{self.token}/messages/"
            mcp_server.settings.sse_path = f"/t-{self.token}/sse"
        except: pass

        with self._lock:
            # Исправленный вызов create_sse_app без проблемных аргументов
            self.sse_app = create_sse_app(
                server=mcp_server,
                message_path=f"/t-{self.token}/messages/",
                sse_path=f"/t-{self.token}/sse",
                middleware=[Middleware(BaseHTTPMiddleware, dispatch=mcp_middleware)],
            )
            # В версии 0.4.1 http_app часто не требуется или настраивается проще
            self.http_app = self.sse_app 

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        await self.sse_app(scope, receive, send)

async def mcp_middleware(request: Request, call_next):
    cfg = settings.get_settings()
    if not cfg.get("mcp_server_enabled", True):
        raise StarletteHTTPException(status_code=403, detail="MCP disabled")
    return await call_next(request)