import sqlite3

conn = sqlite3.connect('local_dev.db')
cursor = conn.cursor()

# Check all departments
cursor.execute("SELECT id, name, description, hospital_id FROM departments")
departments = cursor.fetchall()

print(f"Total departments: {len(departments)}\n")

if departments:
    for dept in departments:
        print(f"Department: {dept[1]}")
        print(f"  ID: {dept[0]}")
        print(f"  Description: {dept[2]}")
        print(f"  Hospital ID: {dept[3]}")
        
        # Count staff in this department
        cursor.execute("SELECT COUNT(*) FROM users WHERE department_id = ?", (dept[0],))
        staff_count = cursor.fetchone()[0]
        print(f"  Staff Count: {staff_count}")
        
        if staff_count > 0:
            cursor.execute("SELECT username, full_name FROM users WHERE department_id = ?", (dept[0],))
            staff = cursor.fetchall()
            print(f"  Staff:")
            for s in staff:
                print(f"    - {s[1]} ({s[0]})")
        print()
else:
    print("No departments found in database")

conn.close()
