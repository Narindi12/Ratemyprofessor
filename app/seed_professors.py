import sys
import csv
from typing import Optional

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.models import School, Department, Professor


def normalize_level(level: Optional[str]) -> Optional[str]:
    if not level:
        return None
    s = level.lower()
    if "grad" in s:
        return "Grad"
    if "under" in s or "ug" in s:
        return "UG"
    return level


def upsert_department(db: Session, school_id: int, name: str) -> Department:
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


def main(csv_path: str, school_id: int):
    with SessionLocal() as db:
        # make sure the school exists
        school = db.query(School).get(school_id)
        if not school:
            raise RuntimeError(f"School with id={school_id} not found. Seed schools first.")

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required = {"first_name", "last_name", "department", "level", "email", "bio", "rating"}
            missing = required - set(reader.fieldnames)
            if missing:
                raise RuntimeError(f"CSV {csv_path} missing headers: {missing}")

            count = 0
            for row in reader:
                dept = upsert_department(db, school_id, row["department"]) if row.get("department") else None

                prof = Professor(
                    school_id=school_id,
                    department_id=dept.id if dept else None,
                    first_name=row["first_name"].strip(),
                    last_name=row["last_name"].strip(),
                    level=normalize_level(row.get("level")),
                    email=row.get("email"),
                    bio=row.get("bio"),
                    rating=float(row["rating"]) if row.get("rating") else None,
                )
                db.add(prof)
                count += 1

            db.commit()
            print(f"Inserted {count} professors for school_id={school_id} from {csv_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python -m app.seed_professors <csv_path> <school_id>")
        sys.exit(1)
    main(sys.argv[1], int(sys.argv[2]))
