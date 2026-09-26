"""
JANUS-Sentinel WebSocket Connection Manager
============================================
Manages authenticated, real-time WebSocket connections for the SOC dashboard.
Broadcasts lifecycle events to all connected clients.
"""
from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

from app.core.config import settings

logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL_SECONDS = 30


@dataclass
class WSConnection:
    websocket: WebSocket
    user_id: str
    user_role: str
    connection_id: str = field(default_factory=lambda: str(uuid4()))
    connected_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass
class WSEvent:
    event_type: str
    data: dict[str, Any]
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    event_id: str = field(default_factory=lambda: str(uuid4()))


class ConnectionManager:
    """
    Manages all active WebSocket connections and broadcasts events.
    
    Supported event_types:
        run_started, test_request_sent, detection_created, incident_opened,
        rag_retrieved, gemini_completed, patch_proposed, patch_approved,
        patch_applied, validation_passed, validation_failed, incident_resolved,
        heartbeat
    """

    def __init__(self) -> None:
        self._connections: dict[str, WSConnection] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, token: str) -> WSConnection | None:
        """Authenticate and register a new WebSocket connection."""
        try:
            payload = jwt.decode(token, settings.APP_SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            user_role = payload.get("role", "viewer")
            if not user_id:
                await websocket.close(code=4001, reason="Invalid token")
                return None
        except JWTError:
            await websocket.close(code=4001, reason="Authentication failed")
            return None

        await websocket.accept()
        conn = WSConnection(
            websocket=websocket,
            user_id=user_id,
            user_role=user_role,
        )

        async with self._lock:
            self._connections[conn.connection_id] = conn

        logger.info(
            f"WebSocket connected: user={user_id} "
            f"conn_id={conn.connection_id} "
            f"total_connections={len(self._connections)}"
        )

        # Send initial connection confirmation
        await self._send_to(
            conn,
            WSEvent(
                event_type="connected",
                data={"connection_id": conn.connection_id, "user_id": user_id},
            ),
        )

        return conn

    async def disconnect(self, connection_id: str) -> None:
        """Remove a connection from the registry."""
        async with self._lock:
            conn = self._connections.pop(connection_id, None)
        if conn:
            logger.info(f"WebSocket disconnected: conn_id={connection_id}")

    async def broadcast_event(self, event_type: str, data: dict[str, Any]) -> None:
        """
        Broadcast an event to all connected clients.
        Automatically removes dead connections.
        """
        if not self._connections:
            return

        event = WSEvent(event_type=event_type, data=data)
        event_json = json.dumps(asdict(event))

        dead_connections: list[str] = []

        async with self._lock:
            connections_snapshot = list(self._connections.values())

        for conn in connections_snapshot:
            try:
                await conn.websocket.send_text(event_json)
            except Exception:
                dead_connections.append(conn.connection_id)

        # Clean up dead connections
        if dead_connections:
            async with self._lock:
                for cid in dead_connections:
                    self._connections.pop(cid, None)

    async def _send_to(self, conn: WSConnection, event: WSEvent) -> None:
        """Send an event to a single connection."""
        try:
            await conn.websocket.send_text(json.dumps(asdict(event)))
        except Exception as exc:
            logger.warning(f"Failed to send to {conn.connection_id}: {exc}")

    async def heartbeat_loop(self) -> None:
        """Continuously sends heartbeat pings to all connections."""
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
            if self._connections:
                await self.broadcast_event(
                    "heartbeat",
                    {"timestamp": datetime.now(timezone.utc).isoformat()},
                )

    def connection_count(self) -> int:
        return len(self._connections)


# Singleton shared across the application
ws_manager = ConnectionManager()
