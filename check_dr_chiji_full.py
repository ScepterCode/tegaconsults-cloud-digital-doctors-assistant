import sqlite3

conn = sqlite3.connect('local_dev.db')
cursor = conn.cursor()

# Get Dr. Chiji's info
cursor.execute("SELECT id, username, full_name, department_id FROM users WHERE username = 'dr.chiji'")
user = cursor.fetchone()

if user:
    user_id = user[0]
    print(f"Dr. Chiji:")
    print(f"  ID: {user_id}")
    print(f"  Full Name: {user[2]}")
    print(f"  Department ID: {user[3]}")
    
    # Check if he's a department head
    cursor.execute("SELECT id, name FROM departments WHERE head_staff_id = ?", (user_id,))
    dept_head = cursor.fetchall()
    if dept_head:
        print(f"\n  Department Head of:")
        for dept in dept_head:
            print(f"    - {dept[1]} (ID: {dept[0]})")
    
    # Check team memberships
    cursor.execute("""
        SELECT t.id, t.name, t.team_type 
        FROM team_members tm 
        JOIN teams t ON tm.team_id = t.id 
        WHERE tm.user_id = ?
    """, (user_id,))
    teams = cursor.fetchall()
    if teams:
        print(f"\n  Team Memberships:")
        for team in teams:
            print(f"    - {team[1]} ({team[2]})")
    else:
        print(f"\n  No team memberships found")
    
    # Check if he's a team lead
    cursor.execute("SELECT id, name, team_type FROM teams WHERE team_lead_id = ?", (user_id,))
    team_lead = cursor.fetchall()
    if team_lead:
        print(f"\n  Team Lead of:")
        for team in team_lead:
            print(f"    - {team[1]} ({team[2]})")
    
    # Check assigned patients
    cursor.execute("SELECT COUNT(*) FROM patients WHERE assigned_doctor_id = ?", (user_id,))
    patient_count = cursor.fetchone()[0]
    print(f"\n  Assigned Patients: {patient_count}")
    
    if patient_count > 0:
        cursor.execute("SELECT mrn, first_name, last_name FROM patients WHERE assigned_doctor_id = ?", (user_id,))
        patients = cursor.fetchall()
        print(f"  Patients:")
        for p in patients:
            print(f"    - {p[1]} {p[2]} (MRN: {p[0]})")

conn.close()
