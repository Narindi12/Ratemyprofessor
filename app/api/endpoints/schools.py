from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.models.models import School, Professor, Department

router = APIRouter(prefix="/schools", tags=["schools"])

def _normalize_state_filter(value: str | None):
    if not value: return None
    v = value.strip()
    # Accept "GA" or "Georgia"
    if len(v) == 2:
        return v.upper()  # we'll match by abbreviation substring
    return v.title()

@router.get("/search")
def search_schools(
    state: str | None = None,
    public_private: str | None = None,   # "public" | "private"
    tuition_contains: str | None = None, # substring search in tuition_text
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    q = db.query(School)
    if state:
        f = _normalize_state_filter(state)
        # match either abbreviation within tuition "City, State" text or full name
        q = q.filter((School.state.ilike(f"%{f}%")) | (School.city.ilike(f"%{f}%")))
    if public_private:
        q = q.filter(School.public_private.ilike(public_private))
    if tuition_contains:
        q = q.filter(School.tuition_text.ilike(f"%{tuition_contains}%"))

    total = q.count()
    items = q.offset((page-1)*page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": s.id,
                "name": s.name,
                "city": s.city,
                "state": s.state,
                "public_private": s.public_private,
                "tuition": s.tuition_text,
            } for s in items
        ]
    }

@router.get("/{school_id}")
def get_school(school_id: int, db: Session = Depends(get_db)):
    return db.query(School).get(school_id)

@router.get("/{school_id}/professors")
def list_professors(
    school_id: int,
    level: Optional[str] = Query(default=None, description="UG or Grad"),
    department: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    q = db.query(Professor).filter(Professor.school_id == school_id)
    if level:
        q = q.filter(Professor.level == level)
    if department:
        q = q.join(Department, Professor.department_id == Department.id).filter(Department.name.ilike(f"%{department}%"))
    if search:
        s = f"%{search}%"
        from sqlalchemy import or_
        q = q.filter(or_(Professor.first_name.ilike(s), Professor.last_name.ilike(s)))
    total = q.count()
    items = q.offset((page-1)*page_size).limit(page_size).all()
    def dept_name(pid):
        d = db.query(Department).get(pid)
        return d.name if d else None
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": p.id,
                "name": f"{p.first_name} {p.last_name}",
                "department": dept_name(p.department_id),
                "level": p.level,
                "email": p.email,
                "photo_url": p.photo_url,
            } for p in items
        ]
    }
