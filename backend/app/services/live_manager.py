from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import WebSocket


LIVE_ROLES = {"judge", "contestant"}
SIGNALING_TYPES = {"offer", "answer", "ice_candidate"}


def _normalize_gender(value: object | None) -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"male", "female"}:
        return normalized
    return "unknown"


def _normalize_preferred_gender(value: object | None) -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"male", "female", "both"}:
        return normalized
    return "both"


def _normalize_country_code(value: object | None) -> str:
    normalized = str(value or "").strip().upper()
    if len(normalized) != 2:
        return "GL"
    return normalized


def _preference_allows(preferred_gender: str, actual_gender: str) -> bool:
    if preferred_gender == "both":
        return True
    if actual_gender == "unknown":
        return True
    return preferred_gender == actual_gender


@dataclass(frozen=True)
class LiveQueueEntry:
    user_id: int
    role: str
    gender: str
    preferred_gender: str
    country_code: str
    enqueued_at: datetime


@dataclass(frozen=True)
class LiveRoom:
    room_id: str
    judge_id: int
    contestant_ids: tuple[int, int, int]
    created_at: datetime

    @property
    def participant_ids(self) -> tuple[int, ...]:
        return (self.judge_id, *self.contestant_ids)


class LiveConnectionManager:
    def __init__(self) -> None:
        self._state_lock = asyncio.Lock()
        self._active_connections: dict[int, WebSocket] = {}
        self._judge_queue: list[LiveQueueEntry] = []
        self._contestant_queue: list[LiveQueueEntry] = []
        self._queue_by_user_id: dict[int, LiveQueueEntry] = {}
        self._rooms_by_id: dict[str, LiveRoom] = {}
        self._room_by_user_id: dict[int, str] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        previous_socket: WebSocket | None = None
        async with self._state_lock:
            previous_socket = self._active_connections.get(user_id)
            self._active_connections[user_id] = websocket

        if previous_socket is not None and previous_socket is not websocket:
            try:
                await previous_socket.close(code=1000)
            except Exception:
                pass

        await self._send_to_user(
            user_id,
            {
                "type": "connected",
                "user_id": user_id,
            },
        )

    async def disconnect(self, user_id: int) -> None:
        notifications: list[tuple[int, dict[str, object]]] = []
        async with self._state_lock:
            self._active_connections.pop(user_id, None)
            self._remove_from_queue_locked(user_id)
            notifications.extend(self._remove_from_room_locked(user_id))

        await self._fanout_notifications(notifications)

    async def join_queue(
        self,
        *,
        user_id: int,
        role: str,
        gender: object | None = None,
        preferred_gender: object | None = None,
        country_code: object | None = None,
    ) -> None:
        normalized_role = str(role or "").strip().lower()
        if normalized_role not in LIVE_ROLES:
            await self._send_to_user(
                user_id,
                {
                    "type": "error",
                    "detail": "invalid_role",
                    "allowed_roles": sorted(LIVE_ROLES),
                },
            )
            return

        immediate_error: dict[str, object] | None = None
        notifications: list[tuple[int, dict[str, object]]] = []
        async with self._state_lock:
            self._remove_from_queue_locked(user_id)

            if user_id in self._room_by_user_id:
                immediate_error = {
                    "type": "error",
                    "detail": "already_in_room",
                }
            else:
                entry = LiveQueueEntry(
                    user_id=user_id,
                    role=normalized_role,
                    gender=_normalize_gender(gender),
                    preferred_gender=_normalize_preferred_gender(preferred_gender),
                    country_code=_normalize_country_code(country_code),
                    enqueued_at=datetime.now(UTC),
                )
                if normalized_role == "judge":
                    self._judge_queue.append(entry)
                else:
                    self._contestant_queue.append(entry)
                self._queue_by_user_id[user_id] = entry

                notifications.append(
                    (
                        user_id,
                        {
                            "type": "queue_joined",
                            "role": entry.role,
                            "gender": entry.gender,
                            "preferred_gender": entry.preferred_gender,
                            "country_code": entry.country_code,
                        },
                    )
                )

                notifications.extend(self._consume_ready_rooms_locked())

        if immediate_error is not None:
            await self._send_to_user(user_id, immediate_error)
            return

        await self._fanout_notifications(notifications)

    async def leave_queue(self, *, user_id: int) -> bool:
        removed = False
        async with self._state_lock:
            removed = self._remove_from_queue_locked(user_id)

        await self._send_to_user(
            user_id,
            {
                "type": "queue_left",
                "removed": removed,
            },
        )
        return removed

    async def relay_signaling_message(
        self,
        *,
        from_user_id: int,
        payload: dict[str, object],
    ) -> None:
        message_type = str(payload.get("type") or "").strip().lower()
        if message_type not in SIGNALING_TYPES:
            await self._send_to_user(
                from_user_id,
                {
                    "type": "error",
                    "detail": "invalid_signal_type",
                    "allowed_types": sorted(SIGNALING_TYPES),
                },
            )
            return

        target_raw = payload.get("target_user_id")
        try:
            target_user_id = int(target_raw)  # type: ignore[arg-type]
        except Exception:
            await self._send_to_user(
                from_user_id,
                {
                    "type": "error",
                    "detail": "invalid_target_user_id",
                },
            )
            return

        room_id: str | None = None
        relay_payload: dict[str, object] | None = None
        error_payload: dict[str, object] | None = None

        async with self._state_lock:
            room_id = self._room_by_user_id.get(from_user_id)
            target_room_id = self._room_by_user_id.get(target_user_id)
            if room_id is None or target_room_id is None or room_id != target_room_id:
                error_payload = {
                    "type": "error",
                    "detail": "target_not_in_same_room",
                }
            else:
                room = self._rooms_by_id.get(room_id)
                if room is None:
                    error_payload = {
                        "type": "error",
                        "detail": "room_not_found",
                    }
                elif target_user_id not in room.participant_ids:
                    error_payload = {
                        "type": "error",
                        "detail": "target_not_in_room",
                    }
                else:
                    relay_payload = {
                        "type": message_type,
                        "room_id": room_id,
                        "from_user_id": from_user_id,
                        "target_user_id": target_user_id,
                        "sdp": payload.get("sdp"),
                        "candidate": payload.get("candidate"),
                        "mid": payload.get("mid"),
                        "mline_index": payload.get("mline_index"),
                    }

        if error_payload is not None:
            await self._send_to_user(from_user_id, error_payload)
            return
        if relay_payload is None:
            await self._send_to_user(
                from_user_id,
                {
                    "type": "error",
                    "detail": "relay_payload_missing",
                },
            )
            return
        await self._send_to_user(target_user_id, relay_payload)

    async def _fanout_notifications(self, notifications: list[tuple[int, dict[str, object]]]) -> None:
        if not notifications:
            return
        for target_user_id, payload in notifications:
            await self._send_to_user(target_user_id, payload)

    async def _send_to_user(self, user_id: int, payload: dict[str, object]) -> None:
        websocket = self._active_connections.get(user_id)
        if websocket is None:
            return
        try:
            await websocket.send_json(payload)
        except Exception:
            async with self._state_lock:
                current_socket = self._active_connections.get(user_id)
                if current_socket is websocket:
                    self._active_connections.pop(user_id, None)

    def _remove_from_queue_locked(self, user_id: int) -> bool:
        entry = self._queue_by_user_id.pop(user_id, None)
        if entry is None:
            return False

        if entry.role == "judge":
            self._judge_queue = [queued for queued in self._judge_queue if queued.user_id != user_id]
        else:
            self._contestant_queue = [
                queued for queued in self._contestant_queue if queued.user_id != user_id
            ]
        return True

    def _remove_from_room_locked(self, user_id: int) -> list[tuple[int, dict[str, object]]]:
        room_id = self._room_by_user_id.get(user_id)
        if room_id is None:
            return []

        room = self._rooms_by_id.pop(room_id, None)
        if room is None:
            self._room_by_user_id.pop(user_id, None)
            return []

        notifications: list[tuple[int, dict[str, object]]] = []
        for participant_id in room.participant_ids:
            self._room_by_user_id.pop(participant_id, None)
            if participant_id == user_id:
                continue
            notifications.append(
                (
                    participant_id,
                    {
                        "type": "room_member_left",
                        "room_id": room.room_id,
                        "user_id": user_id,
                    },
                )
            )
        return notifications

    def _consume_ready_rooms_locked(self) -> list[tuple[int, dict[str, object]]]:
        notifications: list[tuple[int, dict[str, object]]] = []
        while True:
            picked = self._pick_room_members_locked()
            if picked is None:
                break

            judge_entry, contestant_entries = picked
            room_id = uuid4().hex
            room = LiveRoom(
                room_id=room_id,
                judge_id=judge_entry.user_id,
                contestant_ids=tuple(entry.user_id for entry in contestant_entries),  # type: ignore[arg-type]
                created_at=datetime.now(UTC),
            )
            self._rooms_by_id[room_id] = room
            for participant_id in room.participant_ids:
                self._room_by_user_id[participant_id] = room_id

            notifications.append(
                (
                    judge_entry.user_id,
                    {
                        "type": "match_found",
                        "room_id": room_id,
                        "role": "judge",
                        "participants": list(room.participant_ids),
                    },
                )
            )
            for contestant in contestant_entries:
                notifications.append(
                    (
                        contestant.user_id,
                        {
                            "type": "match_found",
                            "room_id": room_id,
                            "role": "contestant",
                            "participants": list(room.participant_ids),
                        },
                    )
                )

        return notifications

    def _pick_room_members_locked(self) -> tuple[LiveQueueEntry, list[LiveQueueEntry]] | None:
        if not self._judge_queue or len(self._contestant_queue) < 3:
            return None

        for judge_entry in self._judge_queue:
            compatible_contestants = [
                contestant
                for contestant in self._contestant_queue
                if contestant.country_code == judge_entry.country_code
                and self._is_compatible_pair(judge_entry, contestant)
            ]
            if len(compatible_contestants) < 3:
                continue

            picked_contestants = compatible_contestants[:3]
            self._judge_queue = [entry for entry in self._judge_queue if entry.user_id != judge_entry.user_id]
            picked_ids = {entry.user_id for entry in picked_contestants}
            self._contestant_queue = [
                entry for entry in self._contestant_queue if entry.user_id not in picked_ids
            ]
            self._queue_by_user_id.pop(judge_entry.user_id, None)
            for picked in picked_contestants:
                self._queue_by_user_id.pop(picked.user_id, None)
            return judge_entry, picked_contestants

        return None

    def _is_compatible_pair(self, judge_entry: LiveQueueEntry, contestant_entry: LiveQueueEntry) -> bool:
        judge_accepts = _preference_allows(judge_entry.preferred_gender, contestant_entry.gender)
        contestant_accepts = _preference_allows(
            contestant_entry.preferred_gender,
            judge_entry.gender,
        )
        return judge_accepts and contestant_accepts
