from __future__ import annotations

import os
from typing import Any

import httpx


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


class ClaudeClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-7-sonnet-latest")

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    async def complete_text(self, *, system: str, user: str, max_tokens: int = 1200) -> str | None:
        if not self.enabled:
            return None
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(ANTHROPIC_API_URL, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        parts = data.get("content") or []
        out = []
        for p in parts:
            if p.get("type") == "text":
                out.append(p.get("text", ""))
        return "\n".join(out).strip() or None

