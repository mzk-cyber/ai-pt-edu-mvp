from __future__ import annotations

import os
from typing import Any

import httpx

# 智谱 AI 开放平台（OpenAI 兼容 Chat Completions）
ZHIPU_CHAT_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"


class ZhipuClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or os.getenv("ZHIPU_API_KEY")
        self.model = model or os.getenv("ZHIPU_MODEL", "glm-4-flash")

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    async def complete_text(self, *, system: str, user: str, max_tokens: int = 2000) -> str | None:
        if not self.enabled:
            return None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(ZHIPU_CHAT_URL, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        choices = data.get("choices") or []
        if not choices:
            return None
        msg = choices[0].get("message") or {}
        content = msg.get("content")
        if content is None:
            return None
        if isinstance(content, list):
            parts: list[str] = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(str(block.get("text", "")))
            return "\n".join(parts).strip() or None
        return str(content).strip() or None
