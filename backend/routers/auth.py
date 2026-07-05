from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from backend.database import users
from backend.auth import hash_password, verify_password, create_access_token, get_current_user_id
from cognee.modules.users.methods import create_user as create_cognee_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


class MeResponse(BaseModel):
    user_id: str
    email: str


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    existing = await users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    cognee_user = await create_cognee_user(body.email, body.password)

    result = await users.insert_one({
        "email": body.email,
        "password_hash": hash_password(body.password),
        "cognee_user_id": str(cognee_user.id),
    })
    user_id = str(result.inserted_id)
    return TokenResponse(access_token=create_access_token(user_id), user_id=user_id)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    user_id = str(user["_id"])
    return TokenResponse(access_token=create_access_token(user_id), user_id=user_id)


@router.get("/me", response_model=MeResponse)
async def me(user_id: str = Depends(get_current_user_id)):
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(user_id=user_id, email=user["email"])