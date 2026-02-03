import os
import traceback
from agent import Agent
from initialize import initialize_mcp
from models import ModelConfig

try:
    print("--- [VZOR] ШАГ 1: ИНИЦИАЛИЗАЦИЯ MCP ---")
    initialize_mcp() 
    
    print("--- [VZOR] ШАГ 2: ПОДГОТОВКА КОНФИГУРАЦИИ ---")
    # Пробуем передать модель просто как первый аргумент, 
    # не называя само поле, чтобы Python сам подставил его куда надо
    my_config = ModelConfig("openai/deepseek-chat")
    
    print("--- [VZOR] ШАГ 3: СОЗДАНИЕ АГЕНТА ---")
    agent = Agent(number=0, config=my_config) 
    
    print("--- [VZOR] АГЕНТ ЗАПУЩЕН ---")
    # Используем базовый метод для этой версии
    print("Проверка связи с DeepSeek...")
    response = agent.interaction("Привет! Ты готов к работе?")
    print(f"\nОТВЕТ АГЕНТА: {response}")

except Exception as e:
    print("\n!!! КРИТИЧЕСКАЯ ОШИБКА !!!")
    traceback.print_exc()

input("\nНажми Enter, чтобы закрыть...")