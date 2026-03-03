from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.auth.security import decode_token
from app.database.mongo import get_db
from app.models.user import UserInDB, UserRole
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user_dict = await db["users"].find_one({"_id": user_id})
    if user_dict is None or not user_dict.get("is_active"):
        raise credentials_exception
    return UserInDB(**user_dict)
async def require_admin(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    if current_user.role != UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user