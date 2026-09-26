import logging
from typing import Dict, Any, List
from app.rag.chroma import chroma_service
from app.gemini.client import gemini_client, GeminiAnalysisSchema
from app.database.models import Incident, RAGRetrieval
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class SentinelRAG:
    async def analyze(self, db: AsyncSession, incident: Incident, event_data: Dict[str, Any]) -> GeminiAnalysisSchema:
        # 1. Normalize and mask
        query = self._build_query(incident, event_data)
        
        # 2. Query Chroma collections
        ti_results = chroma_service.query("threat_intelligence", [query], n_results=2)
        guidance_results = chroma_service.query("secure_coding_guidance", [query], n_results=1)
        
        # 3. Build context
        context_docs = []
        if ti_results and "documents" in ti_results and ti_results["documents"]:
            for doc_list in ti_results["documents"]:
                context_docs.extend(doc_list)
                
        if guidance_results and "documents" in guidance_results and guidance_results["documents"]:
            for doc_list in guidance_results["documents"]:
                context_docs.extend(doc_list)
        
        # 4. Save Retrieval Evidence
        retrieval_record = RAGRetrieval(
            incident_id=incident.id,
            query=query,
            retrieved_document_ids=ti_results.get("ids", []) + guidance_results.get("ids", []),
            retrieved_metadata={"ti_meta": ti_results.get("metadatas"), "guidance_meta": guidance_results.get("metadatas")},
            distances=ti_results.get("distances", []) + guidance_results.get("distances", [])
        )
        db.add(retrieval_record)
        await db.commit()
        
        # 5. Gemini Analysis
        analysis = await gemini_client.analyze_incident(event_data, context_docs)
        return analysis

    def _build_query(self, incident: Incident, event_data: Dict) -> str:
        # Mask sensitive info here (simplified for prototype)
        path = event_data.get("request_path", "")
        method = event_data.get("request_method", "")
        return f"Incident: {incident.title} Category: {incident.category} Method: {method} Path: {path}"

sentinel_rag = SentinelRAG()
