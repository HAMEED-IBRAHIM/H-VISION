from fastapi import APIRouter
router = APIRouter()

@router.get("/user/{user_id}")
async def get_user(user_id: str):
    # Intentionally vulnerable IDOR - no authorization check
    return {"id": user_id, "username": "user", "email": f"user{user_id}@lab.local", "role": "user"}

@router.get("/admin/user/{user_id}")
async def admin_get_user(user_id: str):
    return {"id": user_id, "username": "admin", "email": "admin@lab.local", "role": "admin"}

@router.get("/order/{order_id}")
async def get_order(order_id: str):
    return {"id": order_id, "payment_ref": f"PAY-{order_id}", "shipping_address": "123 Test St"}
