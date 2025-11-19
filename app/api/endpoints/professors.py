from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import Professor

router = APIRouter(prefix="/professors", tags=["professors"])


@router.get("/{professor_id}")
def get_professor(professor_id: int, db: Session = Depends(get_db)):
    """
    Return a single professor by id.
    We flatten department to a plain string so the frontend can render it safely.
    """
    prof = db.get(Professor, professor_id)
    if prof is None:
        raise HTTPException(status_code=404, detail="Professor not found")

    # rating / avg_rating
    rating = getattr(prof, "rating", None)
    if rating is None and hasattr(prof, "avg_rating"):
        rating = getattr(prof, "avg_rating")

    # 🔹 FLATTEN department: if it's an object, use its .name
    dept = getattr(prof, "department", None)
    if dept is not None and not isinstance(dept, str):
        dept = getattr(dept, "name", str(dept))

    return {
        "id": prof.id,
        "first_name": getattr(prof, "first_name", None),
        "last_name": getattr(prof, "last_name", None),
        "name": getattr(prof, "name", None),
        "department": dept,
        "level": getattr(prof, "level", None),
        "email": getattr(prof, "email", None),
        "rating": rating,
        "bio": getattr(prof, "bio", None),
    }
