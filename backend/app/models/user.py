import uuid
from datetime import datetime, timezone
import enum as py_enum
from pydantic import BaseModel, Field, EmailStr
class UserRole(str, py_enum.Enum):
    user = "user"
    admin = "admin"
class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole = UserRole.user
    is_active: bool = True
class UserCreate(UserBase):
    password: str
class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime