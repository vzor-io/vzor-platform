FROM python:3.11-slim

WORKDIR /app

COPY packages/ /usr/local/lib/python3.11/site-packages/
COPY main.py multi_model.py db.py system_prompt.py agent_zero_client.py simple_agent.py requirements.txt ./

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
