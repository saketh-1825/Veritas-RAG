from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.database.mongo import get_db
from app.models.user import UserInDB
from app.models.auth import Token, UserCreate, UserLogin, UserOut
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db = Depends(get_db)) -> Token:
    existing_email = await db["users"].find_one({"email": payload.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    existing_username = await db["users"].find_one({"username": payload.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken",
        )
    new_user = UserInDB(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
    )
    user_dict = new_user.model_dump(by_alias=True)
    await db["users"].insert_one(user_dict)
    token = create_access_token({"sub": new_user.id, "role": new_user.role.value})
    user_out = UserOut(**new_user.model_dump())
    return Token(access_token=token, user=user_out)
@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db = Depends(get_db)) -> Token:
    user_dict = await db["users"].find_one({"email": payload.email})
    if not user_dict or not verify_password(payload.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = UserInDB(**user_dict)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    token = create_access_token({"sub": user.id, "role": user.role.value})
    user_out = UserOut(**user.model_dump())
    return Token(access_token=token, user=user_out)
@router.get("/me", response_model=UserOut)
async def get_me(current_user: UserInDB = Depends(get_current_user)) -> UserOut:
    return UserOut(**current_user.model_dump())