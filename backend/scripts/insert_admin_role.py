import psycopg2

conn = psycopg2.connect('dbname=ScrumBoard user=postgres password=password-1 host=localhost')
cur = conn.cursor()
# Insert admin role for user 1 and org 1 (adjust org_id as needed)
cur.execute("INSERT INTO project_roles (user_id, project_id, role, permissions) VALUES (1, 1, 'Admin', '{}') ON CONFLICT DO NOTHING;")
conn.commit()
cur.close()
conn.close()
print("Inserted admin ProjectRole for user_id=1, project_id=1.")
