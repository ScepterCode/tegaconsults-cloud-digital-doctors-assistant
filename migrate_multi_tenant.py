"""
Migration Script: Multi-Tenant Hospital Management
Adds new tables and updates existing users table for multi-tenancy
"""
import os
import sys
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from server_py.db.session import engine, SessionLocal
from server_py.models import Hospital, TelemedicineSession, ClinicalIntegration, User

def migrate():
    """Run migration to add new tables and update users table"""
    db = SessionLocal()
    
    try:
        print("Starting migration...")
        
        # Step 1: Add hospital_id and permissions columns to users table
        print("1. Updating users table...")
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN hospital_id TEXT"))
            print("   ✓ Added hospital_id column")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("   ⚠ hospital_id column already exists")
            else:
                raise
        
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN permissions TEXT"))
            print("   ✓ Added permissions column")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("   ⚠ permissions column already exists")
            else:
                raise
        
        db.commit()
        
        # Step 2: Create new tables
        print("2. Creating new tables...")
        from server_py.db.session import Base
        Base.metadata.create_all(bind=engine, tables=[
            Hospital.__table__,
            TelemedicineSession.__table__,
            ClinicalIntegration.__table__
        ])
        print("   ✓ Created hospitals table")
        print("   ✓ Created telemedicine_sessions table")
        print("   ✓ Created clinical_integrations table")
        
        # Step 3: Create default system admin if not exists
        print("3. Checking for system admin...")
        result = db.execute(text("SELECT COUNT(*) FROM users WHERE role = 'system_admin'"))
        count = result.scalar()
        
        if count == 0:
            print("   Creating default system admin...")
            db.execute(text("""
                INSERT INTO users (id, username, password, full_name, role, is_active, hospital_id, permissions)
                VALUES (
                    'system-admin-001',
                    'sysadmin',
                    'admin123',
                    'System Administrator',
                    'system_admin',
                    1,
                    NULL,
                    '{"can_manage_hospitals": true, "can_view_all_data": true}'
                )
            """))
            db.commit()
            print("   ✓ Created system admin (username: sysadmin, password: admin123)")
        else:
            print("   ⚠ System admin already exists")
        
        print("\n✅ Migration completed successfully!")
        print("\nNew user roles available:")
        print("  - system_admin: Manages all hospitals")
        print("  - hospital_admin: Manages one hospital")
        print("  - doctor, nurse, pharmacist, lab_tech, receptionist: Hospital staff")
        print("  - patient: End users")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
