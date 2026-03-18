from __future__ import annotations

import json
from pathlib import Path

from .models import CaseSeed


DATA_DIR = Path(__file__).resolve().parent / "data"


def load_case_seeds() -> list[CaseSeed]:
    path = DATA_DIR / "case_seeds.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [CaseSeed.model_validate(item) for item in raw]


def load_test_catalog() -> dict[str, dict]:
    path = DATA_DIR / "test_catalog.json"
    return json.loads(path.read_text(encoding="utf-8"))

