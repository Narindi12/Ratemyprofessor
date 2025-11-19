from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    Text,
    UniqueConstraint,
    DateTime,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db import Base


class School(Base):
    __tablename__ = "schools"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)

    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)

    # "Public" / "Private" from CSV
    public_private: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Full text like '$9,286 (in–state), $24,517 (out–of–state)'
    tuition_text: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # relationships
    departments = relationship(
        "Department",
        back_populates="school",
        cascade="all, delete-orphan",
    )
    professors = relationship(
        "Professor",
        back_populates="school",
        cascade="all, delete-orphan",
    )


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    __table_args__ = (
        UniqueConstraint("school_id", "name", name="uq_dept_school_name"),
    )

    # relationships
    school = relationship(
        "School",
        back_populates="departments",
    )
    professors = relationship(
        "Professor",
        back_populates="department",
        cascade="all, delete-orphan",
    )


class Professor(Base):
    __tablename__ = "professors"

    id: Mapped[int] = mapped_column(primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"))
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )

    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))
    level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ⭐ manual RMP-style rating from CSV
    rating: Mapped[float | None] = mapped_column(nullable=True)

    photo_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # relationships
    school = relationship(
        "School",
        back_populates="professors",
    )
    department = relationship(
        "Department",
        back_populates="professors",
    )
    ratings = relationship(
        "Rating",
        back_populates="professor",
        cascade="all, delete-orphan",
    )


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[int] = mapped_column(primary_key=True)
    professor_id: Mapped[int] = mapped_column(
        ForeignKey("professors.id"), nullable=False
    )

    # you don't have auth yet, so make this optional
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 1–5 stars (frontend will enforce 1–5, schema will too)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)

    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professor = relationship(
        "Professor",
        back_populates="ratings",
    )


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200))
    level: Mapped[str | None] = mapped_column(String(10))


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")
