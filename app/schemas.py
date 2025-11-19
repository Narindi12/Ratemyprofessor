from datetime import datetime
from pydantic import BaseModel, EmailStr, conint
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: Optional[str] = None
    email: EmailStr
    class Config:
        from_attributes = True

class RatingIn(BaseModel):
    stars: int
    comment: Optional[str] = None
    course_id: Optional[int] = None

class RatingOut(BaseModel):
    id: int
    stars: int
    comment: Optional[str] = None
    user_id: int
    class Config:
        from_attributes = True
class RatingBase(BaseModel):
    stars: conint(ge=1, le=5)
    comment: str | None = None


class RatingCreate(RatingBase):
    pass


class RatingOut(RatingBase):
    id: int
    professor_id: int
    created_at: datetime

    class Config:
        orm_mode = True
class ProfessorOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    department: Optional[str] = None
    level: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    class Config:
        from_attributes = True
