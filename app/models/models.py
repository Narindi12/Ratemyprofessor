from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import Base

class School(Base):
    __tablename__ = "schools"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)  # Full name like "Georgia"
    public_private: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "public"/"private"
    tuition_text: Mapped[str | None] = mapped_column(String(300), nullable=True)   # e.g., "$11,764 (in-state)..."

    departments = relationship("Department", back_populates="school", cascade="all, delete-orphan")
    professors = relationship("Professor", back_populates="school", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    school = relationship("School", back_populates="departments")
    professors = relationship("Professor", back_populates="department")
    __table_args__ = (UniqueConstraint("school_id", "name", name="uq_dept_school_name"),)

class Professor(Base):
    __tablename__ = "professors"
    id: Mapped[int] = mapped_column(primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    level: Mapped[str | None] = mapped_column(String(10))  # 'UG' or 'Grad'
    email: Mapped[str | None] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    profile_url: Mapped[str | None] = mapped_column(String(500))

    school = relationship("School", back_populates="professors")
    department = relationship("Department", back_populates="professors")

class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
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

class Rating(Base):
    __tablename__ = "ratings"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column()  # 0 for anonymous
    professor_id: Mapped[int] = mapped_column(ForeignKey("professors.id"), nullable=False)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"))
    stars: Mapped[int] = mapped_column()
    comment: Mapped[str | None] = mapped_column(Text)
