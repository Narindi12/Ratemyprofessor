from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.models.models import Professor, Department, Rating, User, Course
from app.schemas import RatingIn, RatingOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/professors", tags=["professors"])

@router.get("/{professor_id}")
def get_professor(professor_id: int, db: Session = Depends(get_db)):
    p = db.query(Professor).get(professor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Professor not found")
    dept = db.query(Department).get(p.department_id) if p.department_id else None
    avg = db.query(Rating).with_entities(Rating.stars).filter(Rating.professor_id==professor_id).all()
    avg_value = round(sum(r[0] for r in avg)/len(avg), 2) if avg else None
    return {
        "id": p.id,
        "first_name": p.first_name,
        "last_name": p.last_name,
        "department": dept.name if dept else None,
        "level": p.level,
        "email": p.email,
        "bio": p.bio,
        "photo_url": p.photo_url,
        "profile_url": p.profile_url,
        "avg_stars": avg_value,
        "ratings_count": len(avg),
    }

@router.get("/{professor_id}/ratings")
def list_ratings(professor_id: int, db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(Rating.professor_id == professor_id).all()
    return [{"id": r.id, "stars": r.stars, "comment": r.comment, "user_id": r.user_id} for r in ratings]

@router.post("/{professor_id}/ratings", response_model=RatingOut)
def add_rating(
    professor_id: int,
    payload: RatingIn,
    db: Session = Depends(get_db),
    authorization: str | None = None
):
    user = get_current_user(db=db, authorization=authorization)  # will raise if invalid

    if payload.stars < 1 or payload.stars > 5:
        raise HTTPException(status_code=400, detail="Stars must be 1-5")

    # Ensure professor exists
    prof = db.query(Professor).get(professor_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Professor not found")

    r = Rating(user_id=user.id, professor_id=professor_id, stars=payload.stars, comment=payload.comment, course_id=payload.course_id)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
