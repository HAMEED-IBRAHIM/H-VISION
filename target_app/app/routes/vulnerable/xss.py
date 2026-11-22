from fastapi import APIRouter
router = APIRouter()

@router.get("/comment")
async def get_comment(content: str = ""):
    # Intentionally vulnerable - reflects input without sanitization
    return {"content": content, "rendered": f"<div>{content}</div>"}

@router.post("/comment")
async def post_comment(content: str = ""):
    return {"content": content, "stored": True}

@router.get("/search")
async def search(q: str = ""):
    return {"query": q, "results": [], "reflected": q}

@router.get("/feedback")
async def feedback(message: str = ""):
    return {"message": message}
