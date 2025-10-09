from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.models.models import School, Professor, Department

router = APIRouter(prefix="/schools", tags=["schools"])

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
        # join through Department to filter by name
        q = q.join(Department, Professor.department_id == Department.id).filter(Department.name.ilike(f"%{department}%"))
    if search:
        s = f"%{search}%"
        q = q.filter((Professor.first_name.ilike(s)) | (Professor.last_name.ilike(s)))
    total = q.count()
    items = q.offset((page-1)*page_size).limit(page_size).all()
    # Minimal projection
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": p.id,
                "name": f"{p.first_name} {p.last_name}",
                "department": db.query(Department).get(p.department_id).name if p.department_id else None,
                "level": p.level,
                "email": p.email,
                "photo_url": p.photo_url,
            } for p in items
        ]
    }
