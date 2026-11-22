from fastapi import APIRouter
router = APIRouter()

@router.get("/user/{user_id}")
async def get_user_secure(user_id: str):
    return {"message": "Access controlled - authorization required"}
