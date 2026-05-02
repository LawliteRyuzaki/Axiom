from datetime import datetime
from typing import List, Optional
from app.core.database import get_db
from app.models.schemas import ResearchSession, SessionSummary
from app.core.logging import logger

class SessionService:
    """
    Handles all database operations for research sessions.
    """
    
    @staticmethod
    async def create_session(goal: str, model: Optional[str]) -> ResearchSession:
        db = get_db()
        session = ResearchSession(goal=goal, model=model)
        await db.research_sessions.insert_one(session.model_dump())
        logger.info(f"Session Created: {session.id}")
        return session

    @staticmethod
    async def get_session(session_id: str) -> Optional[ResearchSession]:
        db = get_db()
        doc = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
        if doc:
            return ResearchSession(**doc)
        return None

    @staticmethod
    async def update_session(session_id: str, updates: dict):
        db = get_db()
        if "completed_at" not in updates and updates.get("status") in ["completed", "failed", "partial"]:
            updates["completed_at"] = datetime.utcnow()
            
        await db.research_sessions.update_one(
            {"id": session_id},
            {"$set": updates}
        )

    @staticmethod
    async def get_history(limit: int = 20, skip: int = 0) -> List[SessionSummary]:
        db = get_db()
        cursor = (
            db.research_sessions
            .find({}, {"_id": 0, "id": 1, "goal": 1, "status": 1, "partial": 1, "created_at": 1, "duration_seconds": 1})
            .sort("created_at", -1)
            .skip(skip)
            .limit(min(limit, 50))
        )
        docs = await cursor.to_list(length=50)
        return [SessionSummary(**doc) for doc in docs]
