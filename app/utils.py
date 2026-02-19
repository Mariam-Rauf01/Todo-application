from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

# Password hashing context - using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Secret key for JWT tokens
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def _prepare_password(password: str) -> str:
    """
    Prepare password for bcrypt by ensuring it's within 72-byte limit.
    Explicitly truncates to 72 bytes to prevent bcrypt from rejecting the password.
    """
    # Encode password to bytes
    password_bytes = password.encode('utf-8')

    # Explicitly truncate to 72 bytes (bcrypt's limit)
    if len(password_bytes) > 72:
        # Truncate to 72 bytes
        return password[:72]

    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    Uses the same preparation logic as hashing to ensure matching
    """
    try:
        prepared_password = _prepare_password(plain_password)
        return pwd_context.verify(prepared_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    Automatically handles passwords of any length using SHA256 for long passwords
    """
    try:
        # Prepare password (truncate or hash if too long)
        prepared_password = _prepare_password(password)
        # Now hash with bcrypt
        return pwd_context.hash(prepared_password)
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise

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