from fastapi import APIRouter
import sqlite3

router = APIRouter()

def get_db():
    conn = sqlite3.connect('lab.db')
    # Simple setup
    conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, secret TEXT)")
    conn.execute("INSERT OR IGNORE INTO users (id, name, secret) VALUES (1, 'admin', 'admin_secret_key')")
    conn.commit()
    return conn

@router.get("/users")
def get_user_vulnerable(name: str):
    conn = get_db()
    cursor = conn.cursor()
    # INTENTIONALLY VULNERABLE: Direct string concatenation
    query = f"SELECT id, name, secret FROM users WHERE name = '{name}'"
    try:
        cursor.execute(query)
        results = cursor.fetchall()
        return {"data": results}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()
