import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

# Requires: pip install "python-jose[cryptography]" "passlib[bcrypt]"
# Requires: a JWT_SECRET_KEY environment variable set to a long random string.

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable must be set before starting the app "
        "(e.g. export JWT_SECRET_KEY=$(openssl rand -hex 32))"
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    # 1. Convert the plain text password to bytes
    password_bytes = password.encode('utf-8')
    # 2. Generate a salt
    salt = bcrypt.gensalt()
    # 3. Hash it and decode back to a string so MongoDB can store it safely
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 1. Convert plain text input to bytes
    plain_bytes = plain_password.encode('utf-8')
    # 2. Convert stored DB string hash back to bytes
    hashed_bytes = hashed_password.encode('utf-8')
    # 3. Check them (Crucial: plain text MUST be first)
    return bcrypt.checkpw(plain_bytes, hashed_bytes)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Real replacement for the old hardcoded `return "user1"` stub.
    Verifies the Bearer token sent by the frontend and returns the user id
    encoded in it. Any request with a missing, malformed, or expired token
    is rejected with 401 before it ever reaches a route.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")