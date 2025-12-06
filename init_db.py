import os
import sys

# Add current directory to path so we can import server_py modules
sys.path.append(os.getcwd())

from server_py.db.session import engine, Base
# Import all models to ensure they are registered with Base
from server_py.models import user, patient, appointment, lab_result, department, notification, subscription

def init_db():
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
