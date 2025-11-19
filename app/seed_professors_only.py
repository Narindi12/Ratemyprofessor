import csv
import sys
from typing import Optional

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.models import Professor, Department


def norm(s: Optional[str]) -> Optional[str]:
    return s.strip() if s else None


def norm_level(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    s = s.lower()
    if "grad" in s:
        return "Grad"
    if "under" in s or "ug" in s:
        return "UG"
    return s.title()


def get_or_create_department(db: Session, school_id: int, name: str) -> Department:
    name = name.strip()
    dept = (
        db.query(Department)
        .filter(Department.school_id == school_id, Department.name == name)
        .first()
    )
    if not dept:
        dept = Department(school_id=school_id, name=name)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    return dept


def seed_professors(db: Session, path: str) -> int:
    """
    Seed professors from CSV with columns:
    school_id,first_name,last_name,department,level,email,bio,rating
    """
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print(f"No rows found in {path}")
        return 0

    # all rows in this file should belong to same school_id
    school_id = int(rows[0]["school_id"])

    # optional: clear existing professors for that school to avoid duplicates
    db.query(Professor).filter(Professor.school_id == school_id).delete()
    db.commit()

    count = 0
    for row in rows:
        dept = get_or_create_department(db, school_id, row["department"]) if row.get("department") else None
        prof = Professor(
            school_id=school_id,
            department_id=dept.id if dept else None,
            first_name=row["first_name"].strip(),
            last_name=row["last_name"].strip(),
            level=norm_level(row.get("level")),
            email=norm(row.get("email")),
            bio=norm(row.get("bio")),
            rating=float(row["rating"]) if row.get("rating") else None,
        )
        db.add(prof)
        count += 1

    db.commit()
    print(f"Inserted {count} professors from {path}")
    return count


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.seed_professors_only data/your_file.csv")
        sys.exit(1)

    prof_csv = sys.argv[1]

    with SessionLocal() as db:
        seed_professors(db, prof_csv)


if __name__ == "__main__":
    main()
