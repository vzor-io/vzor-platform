from agent_engine import engine

app = FastAPI(title="BlendGraph Core")

@app.post("/execute_agent")
async def execute_agent(req: AgentRequest):
    """
    Main endpoint called when user clicks 'Play' on a Node.
    """
    result = engine.run_agent(
        role=req.role,
        instruction=req.instruction,
        input_data=req.input_text
    )
    return result

@app.get("/")
def health():
    return {"status": "Im Alive", "version": "0.2.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
