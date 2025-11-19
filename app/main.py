from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import engine
from app.models.base import Base

from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.schools import router as schools_router
from app.api.endpoints.professors import router as professors_router


# Create FastAPI app
app = FastAPI(
    title="RMP-Style API",
    version="0.1.0",
    description="Backend for Rate-My-Professor style project",
)

# CORS so your Next.js frontend (localhost:3000) can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create all tables when the API starts
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# Simple health-check endpoint
@app.get("/health")
def health():
    return {"status": "ok"}


# Register routers (each router already has its own prefix)
app.include_router(auth_router)
app.include_router(schools_router)
app.include_router(professors_router)
