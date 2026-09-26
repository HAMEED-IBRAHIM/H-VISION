import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any

from app.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patches", tags=["Patches"])

class PatchProposal(BaseModel):
    incident_id: str
    patch_type: str
    target_file: str
    original_hash: str
    unified_diff: str
    explanation: str
    generated_waf_rules: List[Dict[str, Any]] = []

# In-memory store for patch proposals since we are building rapidly
PATCHES_DB = {}

@router.post("/", status_code=201)
async def receive_patch(proposal: PatchProposal):
    """Blue Agent sends patch proposals here."""
    patch_id = f"patch_{len(PATCHES_DB) + 1}"
    PATCHES_DB[patch_id] = proposal.dict()
    PATCHES_DB[patch_id]["id"] = patch_id
    PATCHES_DB[patch_id]["status"] = "pending"
    logger.info(f"Received new patch proposal {patch_id} for {proposal.target_file}")
    return {"status": "success", "id": patch_id}

@router.get("/")
async def list_patches():
    return {"items": list(PATCHES_DB.values())}

class ApplyPatchRequest(BaseModel):
    patch_id: str

@router.post("/{patch_id}/apply")
async def apply_patch(patch_id: str):
    """1-Click Self-Healing Code: Applies the patch to the target app."""
    if patch_id not in PATCHES_DB:
        raise HTTPException(status_code=404, detail="Patch not found")
        
    patch = PATCHES_DB[patch_id]
    
    # Push the patch to the target app's internal self-healing endpoint
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "http://target_app:8001/waf/self-heal",
                json={
                    "target_file": patch["target_file"],
                    "unified_diff": patch["unified_diff"]
                },
                timeout=10.0
            )
            resp.raise_for_status()
            
        patch["status"] = "applied"
        return {"status": "success", "message": f"Successfully applied patch to {patch['target_file']}. Target app is restarting securely."}
    except Exception as e:
        logger.error(f"Failed to apply patch: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to apply patch to target app: {e}")
