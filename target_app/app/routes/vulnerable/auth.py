from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str = ""
    password: str = ""

@router.post("/login")
async def login(req: LoginRequest):
    # Intentionally vulnerable - no rate limiting, plaintext comparison
    if req.username == "admin" and req.password == "Admin1234":
        return {"token": "fake-jwt-token", "role": "admin"}
    return {"error": "Invalid credentials"}

@router.get("/profile")
async def profile(user_id: str = "1"):
    # Intentionally vulnerable IDOR
    return {"user_id": user_id, "username": "admin", "email": "admin@lab.local"}
