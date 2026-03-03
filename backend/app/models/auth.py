from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import UserRole
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
class UserLogin(BaseModel):
    email: EmailStr
    password: str
class UserOut(BaseModel):
    id: str
    email: EmailStr
    username: str
    role: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
class TokenData(BaseModel):
    user_id: str | None = None