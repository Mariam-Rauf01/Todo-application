from app.database import engine, Base
from app import models

print("Checking if models are registered with Base...")
print("Registry keys:", list(Base.registry._class_registry.keys()))

# Create all tables
print("\nCreating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")

# Verify tables exist
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Created tables: {tables}")

# Let's also check what tables are defined in the metadata
print(f"Tables in metadata: {list(Base.metadata.tables.keys())}")