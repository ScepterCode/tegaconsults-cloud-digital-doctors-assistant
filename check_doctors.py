import sqlite3

conn = sqlite3.connect('local_dev.db')
cursor = conn.cursor()

# Check all doctors
cursor.execute("SELECT id, username, full_name, hospital_id FROM users WHERE role = 'doctor'")
doctors = cursor.fetchall()

print(f"Total doctors: {len(doctors)}\n")

if doctors:
    for doc in doctors:
        print(f"Doctor: {doc[2]}")
        print(f"  ID: {doc[0]}")
        print(f"  Username: {doc[1]}")
        print(f"  Hospital ID: {doc[3]}")
        print()
else:
    print("No doctors found in database")

conn.close()
