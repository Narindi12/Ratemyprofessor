from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import EmailStr
from app.schemas import UserCreate, UserOut, Token
from app.utils.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.db import get_db
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

def is_allowed_email(email: str) -> bool:
    domain = email.split("@")[-1].lower()
    return domain.endswith(settings.ALLOWED_EMAIL_DOMAIN)

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if not is_allowed_email(user_in.email):
        raise HTTPException(status_code=400, detail=f"Only {settings.ALLOWED_EMAIL_DOMAIN} emails may register")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=user_in.name, email=user_in.email, password_hash=hash_password(user_in.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)
