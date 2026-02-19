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
    If password is too long, hash it with SHA256 first (produces 64 hex chars = 64 bytes).
    """
    # Encode password to bytes
    password_bytes = password.encode('utf-8')

    # If password is within limit, return as-is
    if len(password_bytes) <= 72:
        return password

    # If password is too long, hash it with SHA256 first
    # SHA256 produces 64 hex characters (64 bytes), which is within bcrypt limit
    hashed = hashlib.sha256(password_bytes).hexdigest()
    return hashed

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    """
    try:
        prepared_password = _prepare_password(plain_password)
        return pwd_context.verify(prepared_password, hashed_password)
    except ValueError as e:
        # Handle "password cannot be longer than 72 bytes" error
        if "72" in str(e):
            # Truncate password to 72 bytes and try again
            password_bytes = plain_password.encode('utf-8')[:72]
            truncated_password = password_bytes.decode('utf-8', errors='ignore')
            return pwd_context.verify(truncated_password, hashed_password)
        return False
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    Automatically handles passwords of any length
    """
    try:
        # Prepare password (truncate or hash if too long)
        prepared_password = _prepare_password(password)
        # Now hash with bcrypt
        return pwd_context.hash(prepared_password)
    except ValueError as e:
        # Handle "password cannot be longer than 72 bytes" error
        if "72" in str(e):
            # Truncate password to 72 bytes and try again
            password_bytes = password.encode('utf-8')[:72]
            truncated_password = password_bytes.decode('utf-8', errors='ignore')
            return pwd_context.hash(truncated_password)
        raise
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
