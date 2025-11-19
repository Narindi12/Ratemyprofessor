import csv
import sys
from typing import List

from .db import SessionLocal, engine, Base
from .models import models as models_module  # noqa: F401

Base.metadata.create_all(bind=engine)

from .models.models import School, Professor, Department

# -----------------------------
# UPSERT HELPERS
# -----------------------------
def upsert_school(db, row: dict):
    """
    Create or update a School record from schools.csv row.

    Expected columns in data/schools.csv:
      - id
      - Type
      - College Name
      - City, State
      - Tuition & Fees (approx.)
    """
    sid = int(row["id"])
    name = row["College Name"]
    college_type = row["Type"]
    city_state = row["City, State"]
    tuition = row["Tuition & Fees (approx.)"]

    if "," in city_state:
        city, state = [x.strip() for x in city_state.split(",", 1)]
    else:
        city, state = city_state, ""

    school = db.get(School, sid)
    if not school:
        school = School(id=sid)

    school.name = name
    school.city = city
    school.state = state
    school.public_private = college_type
    school.tuition_text = tuition

    db.merge(school)
    db.commit()


def upsert_professor(db, row: dict):
    """
    Create a Professor record from a CSV row.

    Expected columns in your professor CSVs (no id needed):
      - first_name
      - last_name
      - department
      - level
      - email
      - rating
      - bio
      - school_id
    """

    # Flexible keys for first/last names
    first = (
        row.get("first_name")
        or row.get("Firstname")
        or row.get("First name")
        or row.get("First Name")
        or ""
    )
    last = (
        row.get("last_name")
        or row.get("Lastname")
        or row.get("Last name")
        or row.get("Last Name")
        or ""
    )

    dept_name = row.get("department") or row.get("Department") or ""
    level = row.get("level") or row.get("Level") or ""
    email = row.get("email") or row.get("emailid") or row.get("Email") or ""
    rating_str = row.get("rating") or row.get("Rating") or ""
    bio = row.get("bio") or row.get("Bio") or ""

    # Flexible keys for school_id
    school_id_str = (
        row.get("school_id")
        or row.get("School_id")
        or row.get("School ID")
        or row.get("college_id")
        or row.get("College_id")
    )

    if not school_id_str:
        raise ValueError(f"Missing school_id in row: {row}")

    try:
        school_id = int(school_id_str)
    except ValueError:
        raise ValueError(f"Invalid school_id value: {school_id_str}")

    # Convert rating
    rating = None
    if rating_str not in ("", "N/A", None):
        try:
            rating = float(rating_str)
        except ValueError:
            rating = None

    # --- Department handling: create/find Department and use department_id ---
    department_id = None
    if dept_name:
        dept_obj = (
            db.query(Department)
            .filter(Department.name == dept_name, Department.school_id == school_id)
            .first()
        )
        if not dept_obj:
            dept_obj = Department(name=dept_name, school_id=school_id)
            db.add(dept_obj)
            db.commit()
            db.refresh(dept_obj)
        department_id = dept_obj.id

    # IMPORTANT:
    # Only pass column fields to Professor(...), NOT the relationship.
    prof = Professor(
        first_name=first,
        last_name=last,
        level=level,
        email=email,
        rating=rating,
        bio=bio,
        school_id=school_id,
        department_id=department_id,  # FK column, not relationship object
    )

    db.add(prof)
    db.commit()



# -----------------------------
# SEEDING FUNCTIONS
# -----------------------------
def seed_schools(db, csv_path: str):
    print(f"Seeding schools from {csv_path} ...")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            upsert_school(db, row)
    print(f"✔ Seeded schools from {csv_path}")


def seed_professors(db, csv_path: str):
    print(f"Seeding professors from {csv_path} ...")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            upsert_professor(db, row)
    print(f"✔ Seeded professors from {csv_path}")


# -----------------------------
# MAIN ENTRY POINT
# -----------------------------
def main():
    if len(sys.argv) < 3:
        print("Usage: python -m app.seed schools.csv profs1.csv profs2.csv ...")
        sys.exit(1)

    schools_csv = sys.argv[1]
    professor_files: List[str] = sys.argv[2:]

    db = SessionLocal()

    # 1) Seed schools
    seed_schools(db, schools_csv)

    # 2) Seed all professor CSV files
    for pfile in professor_files:
        seed_professors(db, pfile)

    db.close()
    print("🎉 Done seeding all data!")


if __name__ == "__main__":
    main()
