from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

# Password hashing context - using bcrypt
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Secret key for JWT tokens
SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-production')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def _prepare_password(password: str) -> str:
    """
    Prepare password for bcrypt by ensuring it's within 72-byte limit.
    If password is too long, hash it with SHA256 first (produces 64 hex chars = 64 bytes).
    """
    # Encode password to bytes
    password_bytes = password.encode('utf-8')
    
    # If password is within limit, return encoded bytes decoded to ensure consistent handling
    if len(password_bytes) <= 72:
        # Return the password bytes decoded to ensure consistent UTF-8 handling
        return password_bytes.decode('utf-8')
    
    # If password is too long, hash it with SHA256 first
    # SHA256 produces 64 hex characters (64 bytes), which is within bcrypt limit
    hashed = hashlib.sha256(password_bytes).hexdigest()
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    Uses _prepare_password to handle bcrypt's 72-byte limit
    """
    prepared_password = _prepare_password(plain_password)
    return pwd_context.verify(prepared_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    Uses _prepare_password to handle bcrypt's 72-byte limit
    """
    prepared_password = _prepare_password(password)
    return pwd_context.hash(prepared_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, credentials_exception):
    """
    Verify a JWT token
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get('sub')
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception


# from datetime import datetime, timedelta
# from typing import Optional
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# import os
# from dotenv import load_dotenv

# load_dotenv()

# # Password hashing context
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Secret key for JWT tokens
# SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """
#     Verify a plain password against a hashed password
#     bcrypt has a maximum password length of 72 bytes, so we truncate the password
#     """
#     # Truncate password to 72 bytes (bcrypt limitation) to match hashing behavior
#     # Encode to bytes, truncate, then decode back to string
#     password_bytes = plain_password.encode('utf-8')[:72]
#     truncated_password = password_bytes.decode('utf-8', errors='ignore')
#     return pwd_context.verify(truncated_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     """
#     Hash a password using bcrypt
#     bcrypt has a maximum password length of 72 bytes, so we truncate the password
#     This function automatically handles any length password
#     """
#     # Truncate password to 72 bytes (bcrypt limitation)
#     # Encode to bytes, truncate, then decode back to string
#     password_bytes = password.encode('utf-8')[:72]
#     truncated_password = password_bytes.decode('utf-8', errors='ignore')
#     return pwd_context.hash(truncated_password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     """
#     Create a JWT access token
#     """
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=15)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt

# def verify_token(token: str, credentials_exception):
#     """
#     Verify a JWT token
#     """
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email: str = payload.get("sub")
#         if email is None:
#             raise credentials_exception
#         return email
#     except JWTError:
#         raise credentials_exception