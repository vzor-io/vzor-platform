import os
# TUN mode активен - прокси не нужны, весь трафик уже маскируется на уровне системы
# Очищаем переменные прокси, которые могут быть установлены Hiddify
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)

import asyncio
import sys
from types import ModuleType
from python.helpers.dotenv import load_dotenv # custom helper with utf-8 fix

# Фикс для Windows (заглушка отсутствующего модуля pwd)
if os.name == 'nt': 
    sys.modules['pwd'] = ModuleType('pwd')

print("DEBUG: Importing models...")
import models # При импорте настроится LiteLLM
print("DEBUG: models imported")
from agent import Agent, AgentConfig, UserMessage
print("DEBUG: agent imported")

load_dotenv()

import litellm

# Убедимся, что LiteLLM не пытается использовать Vertex AI
litellm.vertex_project = None
litellm.vertex_location = None

# ПРОВЕРКА КЛЮЧЕЙ
deepseek_key = os.getenv("DEEPSEEK_API_KEY")
if deepseek_key:
    print("--- [VZOR] РЕЖИМ DEEPSEEK АКТИВИРОВАН ---")
else:
    print(f"DEBUG: GEMINI_API_KEY present: {bool(os.environ.get('GEMINI_API_KEY'))}")
    print("INFO: Using TUN mode for system-wide VPN routing")

# --- DEBUG: Enable verbose logging ---
os.environ["OTEL_SDK_DISABLED"] = "TRUE"
litellm.set_verbose = False

print("--- [VZOR] Инициализация системы ---")
print(f"DEBUG: DEEPSEEK_API_KEY present: {bool(deepseek_key)}")

async def main():
    # [VZOR] Читаем модель из .env
    target_model = os.getenv("CHAT_MODEL", "deepseek/deepseek-reasoner")
    provider = target_model.split("/")[0] if "/" in target_model else "deepseek"
    embedding_model = os.getenv("EMBEDDING_MODEL", "huggingface/sentence-transformers/all-MiniLM-L6-v2")
    
    config = AgentConfig(
        chat_model=models.ModelConfig(provider=provider, name=target_model, type=models.ModelType.CHAT),
        utility_model=models.ModelConfig(provider=provider, name=os.getenv("SUB_MODEL", target_model), type=models.ModelType.CHAT),
        embeddings_model=models.ModelConfig(provider="huggingface", name="sentence-transformers/all-MiniLM-L6-v2", type=models.ModelType.EMBEDDING),
        browser_model=models.ModelConfig(provider=provider, name=target_model, type=models.ModelType.CHAT),
        mcp_servers=[]
    )
    
    try:
        # Создаем агента
        print("\n⏳ Инициализация агента...")
        agent = Agent(number=0, config=config)
        print(f"\n🚀 ВЗОР В СЕТИ (Модель: {target_model})")
        print("💡 Введите 'exit' или 'quit' для выхода.\n")

        while True:
            try:
                # Получаем ввод от пользователя (в отдельном потоке, чтобы не блокировать loop)
                user_text = await asyncio.to_thread(input, "\n👤 Вы: ")
                
                if user_text.lower() in ['exit', 'quit', 'выход']:
                    print("\n🛑 Завершение работы...")
                    break
                
                if not user_text.strip():
                    continue

                user_msg = UserMessage(message=user_text)
                
                # Запускаем задачу
                print("🤖 ВЗОР думает...", end="", flush=True)
                task = agent.context.communicate(user_msg)
                
                # Ждем ответа
                while True:
                    try:
                        res = task.result()
                        if asyncio.iscoroutine(res):
                            res = await res
                        
                        if res:
                            print(f"\r🤖 ВЗОР: {res}\n")
                            break
                    except Exception:
                        await asyncio.sleep(0.1)
                        
            except KeyboardInterrupt:
                print("\n🛑 Прервано пользователем")
                break
            except Exception as e:
                print(f"\n❌ Ошибка: {e}")

    except Exception as e:
        print(f"\n💥 Критический сбой запуска: {e}")

if __name__ == "__main__":
    import nest_asyncio
    nest_asyncio.apply()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nОстановка пользователем.")