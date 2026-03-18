from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from typing import Dict

from .models import Attempt


@dataclass
class MemoryStore:
    attempts: Dict[str, Attempt] = field(default_factory=dict)

    def new_id(self) -> str:
        return secrets.token_urlsafe(12)

    def put(self, attempt: Attempt) -> None:
        self.attempts[attempt.attempt_id] = attempt

    def get(self, attempt_id: str) -> Attempt | None:
        return self.attempts.get(attempt_id)

