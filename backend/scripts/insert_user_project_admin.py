import psycopg2
from datetime import datetime

conn = psycopg2.connect('dbname=ScrumBoard user=postgres password=password-1 host=localhost')
cur = conn.cursor()

# Insert user with id=1 if not exists
cur.execute("""
INSERT INTO users (id, name, email, settings, created_at, updated_at)
VALUES (1, 'Admin User', 'admin@example.com', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
""")

# Insert dummy project with id=1 if not exists
cur.execute("""
INSERT INTO projects (id, org_id, name, key, description, methodology, state, lead, color, icon, sprint_duration, created_at, updated_at)
VALUES (1, NULL, 'Dummy Project', 'DUMMY', 'Temporary project for admin role', 'Scrum', 'active', 'Admin User', '#0078d4', '📁', 14, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
""")

# Insert admin ProjectRole for user 1 and project 1
cur.execute("""
INSERT INTO project_roles (user_id, project_id, role, permissions)
VALUES (1, 1, 'Admin', '{}')
ON CONFLICT DO NOTHING;
""")

conn.commit()
cur.close()
conn.close()
print("Inserted user_id=1, dummy project_id=1, and admin ProjectRole.")
