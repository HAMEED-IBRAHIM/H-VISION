from fastapi import APIRouter
import sqlite3

router = APIRouter()

def get_db():
    conn = sqlite3.connect('lab.db')
    conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, secret TEXT)")
    conn.execute("INSERT OR IGNORE INTO users (id, name, secret) VALUES (1, 'admin', 'admin_secret_key')")
    conn.commit()
    return conn

@router.get("/users")
def get_user_secure(name: str):
    conn = get_db()
    cursor = conn.cursor()
    # SECURE: Parameterized query
    query = "SELECT id, name, secret FROM users WHERE name = ?"
    try:
        cursor.execute(query, (name,))
        results = cursor.fetchall()
        return {"data": results}
    except Exception as e:
        return {"error": "An error occurred"}
    finally:
        conn.close()
