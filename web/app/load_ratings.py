import csv
from app.db import SessionLocal
from app.models.models import Rating

def main():
    with SessionLocal() as db:
        with open("data/ratings.csv", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rating = Rating(
                    user_id=0,  
                    professor_id=int(row["professor_id"]),
                    stars=float(row["stars"]),
                    comment=row.get("comment")
                )
                db.add(rating)
        db.commit()
        print("Ratings inserted successfully!")

if __name__ == "__main__":
    main()
