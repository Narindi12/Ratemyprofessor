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
    school = db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    profs = (
        db.query(Professor)
        .filter(Professor.school_id == school_id)
        .order_by(Professor.last_name.asc())
        .all()
    )

    items = []
    for p in profs:
        dept = db.get(Department, p.department_id) if p.department_id else None
        items.append(
            {
                "id": p.id,
                "name": f"{p.first_name} {p.last_name}",
                "department": dept.name if dept else None,
                "level": p.level,
                "email": p.email,
                "rating": p.rating, 
                "bio": p.bio,         
                "school_id": p.school_id,
            }
        )

    return {"items": items}
