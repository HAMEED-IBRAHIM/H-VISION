from fastapi import APIRouter
import html
router = APIRouter()

@router.get("/comment")
async def get_comment_secure(content: str = ""):
    return {"content": html.escape(content), "sanitized": True}

@router.get("/search")
async def search_secure(q: str = ""):
    return {"query": html.escape(q), "results": []}
