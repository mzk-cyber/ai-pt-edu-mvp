from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from .models import CaseSeed, TestResult


@dataclass(frozen=True)
class TestMeta:
    test_id: str
    name_cn: str
    name_en: str | None
    synonyms: list[str]
    region_tags: list[str]


def normalize_free_text(s: str) -> str:
    return "".join(ch.lower() for ch in s.strip())


def build_test_index(test_catalog: dict[str, Any]) -> tuple[dict[str, TestMeta], dict[str, str]]:
    by_id: dict[str, TestMeta] = {}
    synonym_to_id: dict[str, str] = {}
    for test_id, meta in test_catalog.items():
        tm = TestMeta(
            test_id=test_id,
            name_cn=meta["name_cn"],
            name_en=meta.get("name_en"),
            synonyms=meta.get("synonyms", []),
            region_tags=meta.get("region_tags", []),
        )
        by_id[test_id] = tm
        for s in [test_id, tm.name_cn, tm.name_en or "", *tm.synonyms]:
            ns = normalize_free_text(s)
            if ns:
                synonym_to_id[ns] = test_id
    return by_id, synonym_to_id


def map_user_test_inputs_to_ids(user_inputs: Iterable[str], synonym_to_id: dict[str, str]) -> tuple[list[str], list[str]]:
    mapped: list[str] = []
    unknown: list[str] = []
    for raw in user_inputs:
        k = normalize_free_text(raw)
        test_id = synonym_to_id.get(k)
        if test_id is None:
            unknown.append(raw)
            continue
        if test_id not in mapped:
            mapped.append(test_id)
    return mapped, unknown


def simulate_test_result(case_seed: CaseSeed, test_id: str, test_meta: TestMeta) -> TestResult:
    evidence = case_seed.exam_evidence_table.get(test_id)
    if evidence is None:
        return TestResult(
            test_id=test_id,
            name_cn=test_meta.name_cn,
            name_en=test_meta.name_en,
            result="not_available",
            quant={},
            short_interp_cn="该检查在本训练病例中未提供结果（教学限制）。可尝试选择更常用的鉴别检查。",
        )

    result = evidence.get("result", "equivocal")
    quant = evidence.get("quant", {}) or {}
    interp = evidence.get("interp_cn") or "该检查结果可用于鉴别部分假设，但仍需结合病史与其他检查综合判断。"
    return TestResult(
        test_id=test_id,
        name_cn=test_meta.name_cn,
        name_en=test_meta.name_en,
        result=result,
        quant=quant,
        short_interp_cn=interp,
    )

