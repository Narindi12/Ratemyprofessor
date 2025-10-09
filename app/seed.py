import sys, csv, re
from typing import Optional
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.models import School, Department, Professor

def normalize_level(level: Optional[str]) -> Optional[str]:
    if not level:
        return None
    s = level.strip().lower()
    if "grad" in s:
        return "Grad"
    if "ug" in s or "under" in s:
        return "UG"
    return None

def upsert_department(db: Session, school_id: int, name: str):
    name_norm = name.strip()
    dept = db.query(Department).filter(Department.school_id==school_id, Department.name==name_norm).first()
    if not dept:
        dept = Department(school_id=school_id, name=name_norm)
        db.add(dept); db.commit(); db.refresh(dept)
    return dept

def main(csv_path: str, school_name: str = "Georgia State University"):
    with SessionLocal() as db:
        school = db.query(School).filter(School.name==school_name).first()
        if not school:
            school = School(name=school_name)
            db.add(school); db.commit(); db.refresh(school)

        with open(csv_path, newline='', encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required = {"first_name","last_name","department","level","email","bio","photo_url","profile_url"}
            missing = required - set(reader.fieldnames)
            if missing:
                raise RuntimeError(f"CSV missing headers: {missing}")

            count = 0
            for row in reader:
                dept = upsert_department(db, school.id, row["department"]) if row.get("department") else None
                prof = Professor(
                    school_id=school.id,
                    department_id=dept.id if dept else None,
                    first_name=row.get("first_name","").strip(),
                    last_name=row.get("last_name","").strip(),
                    level=normalize_level(row.get("level")),
                    email=row.get("email"),
                    bio=row.get("bio"),
                    photo_url=row.get("photo_url"),
                    profile_url=row.get("profile_url"),
                )
                db.add(prof)
                count += 1
                if count % 50 == 0:
                    db.flush()
            db.commit()
            print(f"Inserted {count} professors.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.seed <path_to_professors_csv>")
        sys.exit(1)
    main(sys.argv[1])
