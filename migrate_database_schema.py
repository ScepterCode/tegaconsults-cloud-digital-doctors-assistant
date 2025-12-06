#!/usr/bin/env python3
"""Migrate database schema to add new columns"""

import sqlite3
import os

def migrate_database():
    db_path = "local_dev.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    try:
        # Check if patients table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='patients'")
        if cursor.fetchone():
            print("✓ Patients table exists")
            
            # Get current columns
            cursor.execute("PRAGMA table_info(patients)")
            columns = [col[1] for col in cursor.fetchall()]
            
            # Add missing columns to patients table
            if 'assigned_doctor_id' not in columns:
                cursor.execute("ALTER TABLE patients ADD COLUMN assigned_doctor_id TEXT")
                print("✓ Added assigned_doctor_id to patients")
            
            if 'hospital_id' not in columns:
                cursor.execute("ALTER TABLE patients ADD COLUMN hospital_id TEXT")
                print("✓ Added hospital_id to patients")
            
            if 'department_id' not in columns:
                cursor.execute("ALTER TABLE patients ADD COLUMN department_id TEXT")
                print("✓ Added department_id to patients")
        
        # Check if departments table exists and update it
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'")
        if cursor.fetchone():
            print("✓ Departments table exists")
            
            cursor.execute("PRAGMA table_info(departments)")
            columns = [col[1] for col in cursor.fetchall()]
            
            if 'hospital_id' not in columns:
                cursor.execute("ALTER TABLE departments ADD COLUMN hospital_id TEXT")
                print("✓ Added hospital_id to departments")
            
            if 'created_by' not in columns:
                cursor.execute("ALTER TABLE departments ADD COLUMN created_by TEXT")
                print("✓ Added created_by to departments")
        
        # Create tickets table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                ticket_number TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                category TEXT,
                created_by TEXT NOT NULL,
                assigned_to TEXT,
                hospital_id TEXT,
                department_id TEXT,
                due_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                resolved_at TIMESTAMP,
                notes TEXT,
                resolution TEXT
            )
        """)
        print("✓ Tickets table ready")
        
        # Create ticket_comments table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id TEXT PRIMARY KEY,
                ticket_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Ticket comments table ready")
        
        # Create teams table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                team_type TEXT NOT NULL,
                hospital_id TEXT,
                department_id TEXT,
                team_lead_id TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_by TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        print("✓ Teams table ready")
        
        # Create team_members table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team_members (
                id TEXT PRIMARY KEY,
                team_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role_in_team TEXT,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Team members table ready")
        
        # Create doctor_notes table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS doctor_notes (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                doctor_id TEXT NOT NULL,
                note_type TEXT NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                tags TEXT,
                is_private TEXT NOT NULL DEFAULT '0',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        print("✓ Doctor notes table ready")
        
        # Create diary_entries table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diary_entries (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT,
                content TEXT,
                entry_type TEXT NOT NULL,
                media_url TEXT,
                mood TEXT,
                tags TEXT,
                is_private TEXT NOT NULL DEFAULT '1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        print("✓ Diary entries table ready")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
