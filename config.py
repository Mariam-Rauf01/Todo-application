import os

# Database configuration
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_X1j5vWxfkBpH@ep-bitter-brook-ad70lb1c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
)

# For backward compatibility with the task_db module
DB_CONNECTION_STRING = DATABASE_URL