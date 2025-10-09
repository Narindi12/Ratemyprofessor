from pydantic import BaseModel, EmailStr
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
