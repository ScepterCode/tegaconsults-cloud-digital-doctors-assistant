import sqlite3

conn = sqlite3.connect('local_dev.db')
cursor = conn.cursor()

# Check dr.chiji's department assignment
cursor.execute("SELECT id, username, full_name, department_id FROM users WHERE username = 'dr.chiji'")
user = cursor.fetchone()

if user:
    print(f"User found:")
    print(f"  ID: {user[0]}")
    print(f"  Username: {user[1]}")
    print(f"  Full Name: {user[2]}")
    print(f"  Department ID: {user[3]}")
    
    if user[3]:
        cursor.execute("SELECT id, name, description FROM departments WHERE id = ?", (user[3],))
        dept = cursor.fetchone()
        if dept:
            print(f"\nDepartment:")
            print(f"  ID: {dept[0]}")
            print(f"  Name: {dept[1]}")
            print(f"  Description: {dept[2]}")
        else:
            print(f"\nDepartment ID {user[3]} not found in departments table")
    else:
        print("\nNo department assigned")
else:
    print("User 'dr.chiji' not found")

conn.close()
