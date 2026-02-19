from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# Updated: 2026-02-19 - Fixed password truncation for bcrypt 72-byte limit
from dotenv import load_dotenv

load_dotenv()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Secret key for JWT tokens
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    bcrypt has a maximum password length of 72 bytes, so we truncate the password
    to match the hashing behavior
    """
    # Truncate password to 72 characters to match hashing behavior
    truncated_password = plain_password[:72]
    return pwd_context.verify(truncated_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    bcrypt has a maximum password length of 72 bytes, so we truncate the password
    This function automatically handles any length password
    """
    # Ensure password is truncated to 72 bytes (bcrypt limitation)
    # This is critical - bcrypt will reject passwords longer than 72 bytes
    truncated_password = password[:72]  # Take first 72 characters
    return pwd_context.hash(truncated_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    """
    Verify a JWT token
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception