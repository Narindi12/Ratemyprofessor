import sys, csv, os, re, glob
from typing import Optional
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.models import School, Department, Professor

# Map short filename tokens to school names in schools.csv
FILENAME_HINTS = {
    "georgia_state": "Georgia State University",
    "georgia_tech": "Georgia Institute of Technology",
    "ucb": "University of California, Berkeley",
    "university_of_michigan": "University of Michigan",
    "university_of_virginia": "University of Virginia",
    "mit": "Massachusetts Institute of Technology (MIT)",
    "harvard": "Harvard University",
    "stanford": "Stanford University",
    "yale": "Yale University",
    "princeton": "Princeton University",
}

def norm(s: Optional[str]): 
    return s.strip() if isinstance(s,str) else None

def norm_type(s: Optional[str]) -> Optional[str]:
    if not s: return None
    v = s.strip().lower()
    if v.startswith("pub"): return "public"
    if v.startswith("pri"): return "private"
    return v

def parse_city_state(value: Optional[str]):
    if not value: return (None, None)
    parts = [p.strip() for p in value.split(",")]
    if len(parts) >= 2:
        city = parts[0]
        state = parts[-1]  # support "Atlanta, Georgia"
        return (city, state)
    return (value.strip(), None)

def norm_level(s: Optional[str]):
    if not s: return None
    v = s.lower()
    has_ug = "undergrad" in v or "ug" in v
    has_grad = "grad" in v
    if has_ug and not has_grad: return "UG"
    if has_grad and not has_ug: return "Grad"
    if has_ug and has_grad: return "UG"  # choose UG if both appear
    return None

def upsert_department(db: Session, school_id: int, name: str):
    name = name.strip()
    dept = db.query(Department).filter(Department.school_id==school_id, Department.name==name).first()
    if not dept:
        dept = Department(school_id=school_id, name=name)
        db.add(dept); db.commit(); db.refresh(dept)
    return dept

def seed_schools(db: Session, schools_csv: str):
    with open(schools_csv, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        # Expected headers exactly as in your screenshot
        # id,Type,College Name,"City, State","Tuition & Fees (approx.)"
        for row in r:
            sid = int(row["id"])
            type_txt = norm_type(row.get("Type"))
            city, state = parse_city_state(row.get("City, State"))
            tuition_text = norm(row.get("Tuition & Fees (approx.)"))
            name = norm(row.get("College Name"))

            school = db.query(School).get(sid)
            if not school:
                school = School(
                    id=sid,
                    name=name,
                    city=city,
                    state=state,
                    public_private=type_txt,
                    tuition_text=tuition_text
                )
                db.add(school)
            else:
                school.name = name
                school.city = city
                school.state = state
                school.public_private = type_txt
                school.tuition_text = tuition_text
        db.commit()

def find_school_id_for_file(db: Session, filepath: str) -> Optional[int]:
    """Infer school by filename using FILENAME_HINTS or fuzzy match."""
    fname = os.path.basename(filepath).lower()
    stem = re.sub(r"\.csv$", "", fname)
    # pick the bit before _professors_
    token = stem.split("_professors_")[0]
    # direct map
    hint_name = FILENAME_HINTS.get(token)
    if hint_name:
        s = db.query(School).filter(School.name.ilike(f"%{hint_name}%")).first()
        if s: return s.id
    # fuzzy: split token by underscores and ensure all appear in school name
    tokens = token.replace("_", " ").split()
    schools = db.query(School).all()
    for s in schools:
        name_l = s.name.lower()
        if all(t in name_l for t in tokens):
            return s.id
    # special case: mit token should match "Massachusetts Institute of Technology"
    if "mit" in token:
        s = db.query(School).filter(School.name.ilike("%Massachusetts Institute of Technology%")).first()
        if s: return s.id
    return None

def seed_professors_from_many_files(db: Session, data_dir: str):
    paths = glob.glob(os.path.join(data_dir, "*_professors_*.csv"))
    total = 0
    for pth in paths:
        school_id = find_school_id_for_file(db, pth)
        if not school_id:
            print(f"[WARN] Could not infer school for {pth}; skipping.")
            continue
        with open(pth, newline="", encoding="utf-8") as f:
            r = csv.DictReader(f)
            # Columns can vary; we’ll .get(...) safely
            for row in r:
                dept_name = row.get("department") or row.get("dept") or ""
                dept = upsert_department(db, school_id, dept_name) if dept_name else None
                prof = Professor(
                    school_id=school_id,
                    department_id=dept.id if dept else None,
                    first_name=(row.get("first_name") or "").strip(),
                    last_name=(row.get("last_name") or "").strip(),
                    level=norm_level(row.get("level")),
                    email=norm(row.get("email")),
                    bio=norm(row.get("bio")),
                    photo_url=norm(row.get("photo_url")),
                    profile_url=norm(row.get("profile_url")),
                )
                db.add(prof)
                total += 1
        db.commit()
    print(f"Inserted {total} professors from {len(paths)} files.")

def main(schools_csv: str = "data/schools.csv", data_dir: str = "data"):
    with SessionLocal() as db:
        seed_schools(db, schools_csv)
        seed_professors_from_many_files(db, data_dir)

if __name__ == "__main__":
    # Allow optional args: python -m app.seed [schools_csv] [data_dir]
    schools_csv = sys.argv[1] if len(sys.argv) >= 2 else "data/schools.csv"
    data_dir = sys.argv[2] if len(sys.argv) >= 3 else "data"
    main(schools_csv, data_dir)
