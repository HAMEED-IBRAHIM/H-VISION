"""
JANUS-Sentinel Audit Logger
============================
Implements tamper-evident hash-chained audit log.

Each event's hash is computed as:
    SHA256(previous_event_hash || timestamp || actor_id || action || object_id || json(details))

This creates an immutable linked chain. Any alteration of a past event
will cause all subsequent hashes to fail verification.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import AuditEvent

logger = logging.getLogger(__name__)

SENTINEL_GENESIS_HASH = "0" * 64  # Genesis block hash


def _compute_event_hash(
    previous_hash: str,
    timestamp: str,
    actor_id: str,
    action: str,
    object_id: str,
    details: dict[str, Any],
) -> str:
    """Compute SHA256 hash for an audit event."""
    payload = "|".join([
        previous_hash or SENTINEL_GENESIS_HASH,
        timestamp,
        actor_id or "",
        action,
        object_id or "",
        json.dumps(details, sort_keys=True, default=str),
    ])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class AuditLogger:
    """
    Cryptographically linked audit event logger.
    
    Usage:
        await AuditLogger.log_event(
            db=db,
            actor_type="user",
            actor_id=current_user.id,
            action="patch.approved",
            object_type="patch_proposal",
            object_id=patch.id,
            details={"risk_level": patch.risk_level},
        )
    """

    @staticmethod
    async def log_event(
        db: AsyncSession,
        actor_type: str,
        actor_id: str | None,
        action: str,
        object_type: str | None = None,
        object_id: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> AuditEvent:
        """
        Create a new audit event linked to the previous event's hash.
        
        Args:
            db: Async database session.
            actor_type: 'user' | 'system' | 'agent'
            actor_id: UUID of the actor (user_id, agent name, etc.)
            action: Dot-notation action string e.g. 'patch.approved'
            object_type: Type of the affected object e.g. 'patch_proposal'
            object_id: UUID of the affected object
            details: Additional structured context (will be JSON-serialised)
            
        Returns:
            The persisted AuditEvent with hash and previous_hash set.
        """
        if details is None:
            details = {}

        # Retrieve the most recent event hash (for chaining)
        result = await db.execute(
            select(AuditEvent)
            .order_by(AuditEvent.timestamp.desc())
            .limit(1)
        )
        last_event = result.scalar_one_or_none()
        previous_hash = last_event.event_hash if last_event else SENTINEL_GENESIS_HASH

        timestamp_str = datetime.now(timezone.utc).isoformat()

        event_hash = _compute_event_hash(
            previous_hash=previous_hash,
            timestamp=timestamp_str,
            actor_id=actor_id or "",
            action=action,
            object_id=object_id or "",
            details=details,
        )

        event = AuditEvent(
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            object_type=object_type,
            object_id=object_id,
            details=details,
            previous_event_hash=previous_hash,
            event_hash=event_hash,
        )

        db.add(event)
        await db.commit()
        await db.refresh(event)

        logger.info(
            "Audit event recorded",
            extra={
                "action": action,
                "actor_type": actor_type,
                "object_type": object_type,
                "object_id": object_id,
                "event_hash_prefix": event_hash[:16],
            },
        )

        return event

    @staticmethod
    async def verify_chain(db: AsyncSession) -> dict[str, Any]:
        """
        Verify the integrity of the entire audit event chain.
        
        Returns:
            dict with 'is_valid', 'verified_count', 'first_broken_event_id' (if any)
        """
        result = await db.execute(
            select(AuditEvent).order_by(asc(AuditEvent.timestamp))
        )
        events = result.scalars().all()

        if not events:
            return {"is_valid": True, "verified_count": 0, "first_broken_event_id": None}

        previous_hash = SENTINEL_GENESIS_HASH
        verified = 0

        for event in events:
            expected_hash = _compute_event_hash(
                previous_hash=event.previous_event_hash or SENTINEL_GENESIS_HASH,
                timestamp=event.timestamp.isoformat() if event.timestamp else "",
                actor_id=event.actor_id or "",
                action=event.action,
                object_id=event.object_id or "",
                details=event.details or {},
            )

            if event.event_hash != expected_hash:
                logger.error(
                    f"Audit chain broken at event {event.id}: "
                    f"stored={event.event_hash[:16]}, expected={expected_hash[:16]}"
                )
                return {
                    "is_valid": False,
                    "verified_count": verified,
                    "first_broken_event_id": event.id,
                    "message": "Audit chain integrity violation detected.",
                }

            if event.previous_event_hash != previous_hash:
                return {
                    "is_valid": False,
                    "verified_count": verified,
                    "first_broken_event_id": event.id,
                    "message": "Previous hash link is broken.",
                }

            previous_hash = event.event_hash
            verified += 1

        return {
            "is_valid": True,
            "verified_count": verified,
            "first_broken_event_id": None,
            "message": f"All {verified} audit events verified successfully.",
        }
