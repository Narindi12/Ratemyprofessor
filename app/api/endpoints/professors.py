from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.models.models import Professor, Department, Rating, User, Course
from app.schemas import RatingIn, RatingOut
from app.utils.deps import get_current_user

router = APIRouter(prefix="/professors", tags=["professors"])

@router.post("/{professor_id}/ratings", response_model=RatingOut)
def add_rating(
    professor_id: int,
    payload: RatingIn,
    db: Session = Depends(get_db),
):
    if payload.stars < 1 or payload.stars > 5:
        raise HTTPException(status_code=400, detail="Stars must be 1-5")
    prof = db.query(Professor).get(professor_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Professor not found")
    r = Rating(user_id=0, professor_id=professor_id, stars=payload.stars, comment=payload.comment, course_id=payload.course_id)
    db.add(r); db.commit(); db.refresh(r)
    return r

@router.get("/{professor_id}")
def get_professor(professor_id: int, db: Session = Depends(get_db)):
    p = db.query(Professor).get(professor_id)
    if not p:
        raise HTTPException(status_code=404, detail="Professor not found")
    dept = db.query(Department).get(p.department_id) if p.department_id else None

    # rating stats
    rows = db.query(Rating.stars).filter(Rating.professor_id == professor_id).all()
    stars_list = [r[0] for r in rows]
    count = len(stars_list)
    avg = round(sum(stars_list) / count, 2) if count else None
    dist = {s: 0 for s in [1, 2, 3, 4, 5]}
    for s in stars_list:
        if s in dist: dist[s] += 1
    # simple “would take again” proxy: % of ratings >= 4
    would_take_again = round(100 * (sum(1 for s in stars_list if s >= 4) / count), 0) if count else None

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
        "avg_stars": avg,
        "ratings_count": count,
        "distribution": dist,        # {1: n, 2: n, 3: n, 4: n, 5: n}
        "would_take_again_pct": would_take_again
    }

@router.post("/ratings/{rating_id}/flag")
def flag_rating(rating_id: int, db: Session = Depends(get_db)):
    r = db.query(Rating).get(rating_id)
    if not r:
        raise HTTPException(status_code=404, detail="Rating not found")
    # Stub for now (no DB column yet)
    return {"ok": True, "message": "Flag received (store in DB when you add is_flagged column)."}
