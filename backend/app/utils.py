from datetime import datetime, timedelta
      2 from typing import Optional
      3 from jose import JWTError, jwt
      4 from passlib.context import CryptContext
      5 import hashlib
      6 import os
      7 from dotenv import load_dotenv
      8
      9 load_dotenv()
     10
     11 # Password hashing context - using bcrypt
     12 pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
     13
     14 # Secret key for JWT tokens
     15 SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-production')
     16 ALGORITHM = 'HS256'
     17 ACCESS_TOKEN_EXPIRE_MINUTES = 30
     18
     19 def _prepare_password(password: str) -> str:
     20     """
     21     Prepare password for bcrypt by ensuring it's within 72-byte limit.
     22     If password is too long, hash it with SHA256 first (produces 64 hex chars = 64 bytes).
     23     """
     24     # Encode password to bytes
     25     password_bytes = password.encode('utf-8')
     26
     27     # If password is within limit, return as-is
     28     if len(password_bytes) <= 72:
     29         return password
     30
     31     # If password is too long, hash it with SHA256 first
     32     # SHA256 produces 64 hex characters (64 bytes), which is within bcrypt limit
     33     hashed = hashlib.sha256(password_bytes).hexdigest()
     34     return hashed
     35
     36 def verify_password(plain_password: str, hashed_password: str) -> bool:
     37     """
     38     Verify a plain password against a hashed password
     39     """
     40     try:
     41         prepared_password = _prepare_password(plain_password)
     42         return pwd_context.verify(prepared_password, hashed_password)
     43     except Exception as e:
     44         print(f'Password verification error: {e}')
     45         return False
     46
     47 def get_password_hash(password: str) -> str:
     48     """
     49     Hash a password using bcrypt
     50     Automatically handles passwords of any length
     51     """
     52     try:
     53         # Prepare password (truncate or hash if too long)
     54         prepared_password = _prepare_password(password)
     55         # Now hash with bcrypt
     56         return pwd_context.hash(prepared_password)
     57     except Exception as e:
     58         print(f'Password hashing error: {e}')
     59         raise
     60
     61 def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
     62     """
     63     Create a JWT access token
     64     """
     65     to_encode = data.copy()
     66     if expires_delta:
     67         expire = datetime.utcnow() + expires_delta
     68     else:
     69         expire = datetime.utcnow() + timedelta(minutes=15)
     70     to_encode.update({'exp': expire})
     71     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
     72     return encoded_jwt
     73
     74 def verify_token(token: str, credentials_exception):
     75     """
     76     Verify a JWT token
     77     """
     78     try:
     79         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
     80         email: str = payload.get('sub')
     81         if email is None:
     82             raise credentials_exception
     83         return email
     84     except JWTError:
     85         raise credentials_exception