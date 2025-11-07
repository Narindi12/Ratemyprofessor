from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import csv, io
from app.db import get_db
from app.models.models import School, Department, Professor

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/seed")
async def admin_seed(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    school_name: str = "Georgia State University"
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV")

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))

    required = {"first_name","last_name","department","level","email","bio","photo_url","profile_url"}
    missing = required - set(reader.fieldnames or [])
    if missing:
        raise HTTPException(status_code=400, detail=f"CSV missing headers: {missing}")

    school = db.query(School).filter(School.name==school_name).first()
    if not school:
        school = School(name=school_name)
        db.add(school); db.commit(); db.refresh(school)

    def upsert_department(name: str):
        d = db.query(Department).filter(
            Department.school_id==school.id,
            Department.name==name.strip()
        ).first()
        if not d:
            d = Department(school_id=school.id, name=name.strip())
            db.add(d); db.commit(); db.refresh(d)
        return d

    count = 0
    for row in reader:
        dept = upsert_department(row["department"]) if row.get("department") else None
        prof = Professor(
            school_id=school.id,
            department_id=dept.id if dept else None,
            first_name=row["first_name"].strip(),
            last_name=row["last_name"].strip(),
            level=row.get("level"),
            email=row.get("email"),
            bio=row.get("bio"),
            photo_url=row.get("photo_url"),
            profile_url=row.get("profile_url"),
        )
        db.add(prof); count += 1
        if count % 50 == 0:
            db.flush()
    db.commit()
    return {"inserted": count}
