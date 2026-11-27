from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import characters, sessions, auth 

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    
app = FastAPI(title="Dating Sim API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(characters.router)
app.include_router(sessions.router)
app.include_router(auth.router)

@app.get("/api/health")
async def health():
    return {"ok": True}