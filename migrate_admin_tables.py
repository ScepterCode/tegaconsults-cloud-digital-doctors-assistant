"""
Database migration to add audit logs and security events tables
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///local_dev.db"

from server_py.db.session import engine, Base
from server_py.models.audit_log import AuditLog
from server_py.models.security_event import SecurityEvent

def migrate():
    """Create new tables for audit logs and security events"""
    print("Creating audit_logs and security_events tables...")
    
    # Create tables
    Base.metadata.create_all(bind=engine, tables=[
        AuditLog.__table__,
        SecurityEvent.__table__
    ])
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
