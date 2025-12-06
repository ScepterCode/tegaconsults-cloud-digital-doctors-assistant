from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./local_dev.db")

# Handle empty string case
if not DATABASE_URL or DATABASE_URL.strip() == "":
    DATABASE_URL = "sqlite:///./local_dev.db"

# Render PostgreSQL compatibility: convert postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine based on database type
if DATABASE_URL.startswith("postgresql://"):
    # PostgreSQL configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=10,  # Number of connections to maintain
        max_overflow=20,  # Additional connections when pool is full
        pool_recycle=3600,  # Recycle connections after 1 hour
        echo=False,
        connect_args={
            "connect_timeout": 10,
            "options": "-c timezone=utc"
        }
    )
else:
    # SQLite configuration (for local development)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
