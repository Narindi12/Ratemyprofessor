from fastapi import FastAPI
from sqlalchemy.orm import Session
from app.db import engine, SessionLocal
from app.models.base import Base
from app.models.models import School, Department
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.schools import router as schools_router
from app.api.endpoints.professors import router as professors_router

app = FastAPI(title="RMP-Style API", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok"}

# Create tables on startup (dev convenience)
Base.metadata.create_all(bind=engine)

# Ensure a default GSU school exists
with SessionLocal() as db:
    school = db.query(School).filter(School.name=="Georgia State University").first()
    if not school:
        school = School(name="Georgia State University", city="Atlanta", state="GA", public_private="public")
        db.add(school)
        db.commit()

# Routers
app.include_router(auth_router)
app.include_router(schools_router)
app.include_router(professors_router)
