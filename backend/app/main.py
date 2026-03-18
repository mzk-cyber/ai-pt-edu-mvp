from __future__ import annotations

import random
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .ai_claude import ClaudeClient
from .data_loader import load_case_seeds, load_test_catalog
from .models import (
    AskedQuestion,
    Attempt,
    AttemptCreateIn,
    CasePrompt,
    FeedbackOut,
    FinalAnswerIn,
    HypothesesIn,
    ScoreBreakdown,
    TestSelectIn,
)
from .simulator import build_test_index, map_user_test_inputs_to_ids, simulate_test_result
from .store import MemoryStore


load_dotenv()

app = FastAPI(title="AI PT Education Platform API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = MemoryStore()
case_seeds = load_case_seeds()
test_catalog = load_test_catalog()
tests_by_id, synonym_to_id = build_test_index(test_catalog)
claude = ClaudeClient()


def pick_seed(payload: AttemptCreateIn) -> Any:
    seeds = [s for s in case_seeds if s.region == payload.region]
    if payload.include_red_flags:
        seeds = [s for s in seeds if s.include_red_flags_ok]
    if not seeds:
        raise HTTPException(status_code=400, detail="No case seeds available for selection.")
    return random.choice(seeds)


def build_case_prompt(seed) -> CasePrompt:
    topics = list(seed.history_by_topic.keys())
    return CasePrompt(
        complaint_cn=seed.complaint_cn,
        key_terms_en=seed.key_terms_en,
        initial_story_cn=seed.initial_story_cn,
        disclaimer_cn="本平台为教育模拟训练，不构成医疗建议。若现实中出现红旗症状或病情恶化，请及时就医/转诊。",
        available_question_topics=topics,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/catalog/tests")
def catalog_tests(region: str | None = None) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for test_id, meta in test_catalog.items():
        if region and region not in (meta.get("region_tags") or []):
            continue
        items.append(
            {
                "test_id": test_id,
                "name_cn": meta.get("name_cn"),
                "name_en": meta.get("name_en"),
                "synonyms": meta.get("synonyms", []),
                "region_tags": meta.get("region_tags", []),
            }
        )
    items.sort(key=lambda x: x["test_id"])
    return items


@app.post("/attempts", response_model=Attempt)
async def create_attempt(payload: AttemptCreateIn) -> Attempt:
    seed = pick_seed(payload)
    attempt_id = store.new_id()
    attempt = Attempt(
        attempt_id=attempt_id,
        region=payload.region,
        difficulty=payload.difficulty,
        style=payload.style,
        include_red_flags=payload.include_red_flags,
        case_seed_id=seed.id,
        case_prompt=build_case_prompt(seed),
    )
    store.put(attempt)
    return attempt


@app.get("/attempts/{attempt_id}", response_model=Attempt)
async def get_attempt(attempt_id: str) -> Attempt:
    attempt = store.get(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    return attempt


@app.post("/attempts/{attempt_id}/questions", response_model=Attempt)
async def ask_question(attempt_id: str, payload: dict[str, str]) -> Attempt:
    attempt = store.get(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if len(attempt.questions_asked) >= 8:
        raise HTTPException(status_code=400, detail="Question limit reached (8).")

    topic = payload.get("topic", "").strip()
    question_cn = payload.get("question_cn", "").strip() or topic
    seed = next(s for s in case_seeds if s.id == attempt.case_seed_id)
    answer_cn = seed.history_by_topic.get(topic)
    if answer_cn is None:
        answer_cn = "患者表示目前不确定/未提及相关信息。"
        conf = "not_mentioned"
    else:
        conf = "stated"

    attempt.questions_asked.append(
        AskedQuestion(
            topic=topic or "custom",
            question_cn=question_cn,
            answer_cn=answer_cn,
            key_terms_en=seed.key_terms_en,
            confidence=conf,  # type: ignore[arg-type]
        )
    )
    store.put(attempt)
    return attempt


@app.post("/attempts/{attempt_id}/hypotheses", response_model=Attempt)
async def submit_hypotheses(attempt_id: str, payload: HypothesesIn) -> Attempt:
    attempt = store.get(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    attempt.hypotheses = payload.items
    store.put(attempt)
    return attempt


@app.post("/attempts/{attempt_id}/tests", response_model=Attempt)
async def submit_tests_round(attempt_id: str, payload: TestSelectIn) -> Attempt:
    attempt = store.get(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    mapped, unknown = map_user_test_inputs_to_ids(payload.tests, synonym_to_id)
    if unknown:
        # Keep behavior strict for MVP to avoid drifting results.
        raise HTTPException(
            status_code=400,
            detail={"message": "Some tests could not be recognized.", "unknown": unknown},
        )

    remaining = 8 - len(attempt.tests_done)
    to_add = [t for t in mapped if t not in attempt.tests_done][:remaining]
    if not to_add:
        store.put(attempt)
        return attempt

    seed = next(s for s in case_seeds if s.id == attempt.case_seed_id)
    for test_id in to_add:
        attempt.tests_done.append(test_id)
        tm = tests_by_id[test_id]
        attempt.test_results.append(simulate_test_result(seed, test_id, tm))

    store.put(attempt)
    return attempt


@app.post("/attempts/{attempt_id}/final", response_model=Attempt)
async def submit_final(attempt_id: str, payload: FinalAnswerIn) -> Attempt:
    attempt = store.get(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    attempt.final_answer = payload
    store.put(attempt)
    return attempt


def heuristic_score(attempt: Attempt) -> ScoreBreakdown:
    info = min(20, int(len(attempt.questions_asked) / 8 * 20))
    hyp = 0
    if attempt.hypotheses:
        hyp = 18
        if len(attempt.hypotheses) >= 5:
            hyp += 6
        if any("红旗" in (b or "") for h in attempt.hypotheses for b in h.rationale_bullets):
            hyp += 6
    hyp = min(30, hyp)
    test_sel = min(25, 10 + int(len(attempt.tests_done) / 8 * 15))
    final_plan = 0
    if attempt.final_answer:
        final_plan = 15
        if attempt.final_answer.supporting_evidence:
            final_plan += 5
        if attempt.final_answer.goals:
            final_plan += 5
    final_plan = min(25, final_plan)
    return ScoreBreakdown(
        info_gathering=info,
        hypotheses_quality=hyp,
        test_selection=test_sel,
        final_and_plan=final_plan,
    )


@app.post("/attempts/{attempt_id}/feedback", response_model=Attempt)
async def generate_feedback(attempt_id: str) -> Attempt:
    attempt = store.get(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if not attempt.final_answer:
        raise HTTPException(status_code=400, detail="Final answer required before feedback.")

    seed = next(s for s in case_seeds if s.id == attempt.case_seed_id)
    scores = heuristic_score(attempt)

    system = (
        "你是一名资深物理治疗临床带教。你要基于给定的模拟病例与学员作答，"
        "用中文为主（关键术语英文括注）输出：最佳治疗框架、推理路径、3条优点、3条改进建议，并给出安全提醒。"
        "这是教育模拟，不要给现实医疗指令。"
    )
    user = {
        "case_truth": {"pattern_cn": seed.pattern_truth_cn, "pattern_en": seed.pattern_truth_en},
        "case_prompt": attempt.case_prompt.model_dump(),
        "questions_asked": [q.model_dump() for q in attempt.questions_asked],
        "hypotheses": [h.model_dump() for h in attempt.hypotheses],
        "tests_done": attempt.tests_done,
        "test_results": [r.model_dump() for r in attempt.test_results],
        "final_answer": attempt.final_answer.model_dump(),
        "score_hint": scores.model_dump(),
    }

    claude_text = await claude.complete_text(system=system, user=str(user), max_tokens=1300)

    if claude_text:
        best = claude_text
        reasoning = "（由 Claude 生成，详见上方讲评内容中的推理与依据引用）"
        strengths = ["结构清晰地完成了病例推理流程。", "能将病史与检查结果结合形成结论。", "治疗计划包含可执行要点。"]
        improvements = ["把每个检查与要区分的假设明确对应。", "结论里补充阶段/激惹性判断与复评指标。", "加强红旗/转诊阈值的表述。"]
    else:
        best = (
            f"建议治疗框架（{seed.pattern_truth_cn} / {seed.pattern_truth_en}）：\n"
            "- 教育：负荷管理（load management），解释疼痛与组织适应。\n"
            "- 运动：以可耐受剂量开始，逐步增加强度；用功能目标驱动进阶。\n"
            "- 症状控制：必要时短期调整活动与疼痛调节策略。\n"
            "- 复评：每1–2周评估ROM/力量/功能量表与目标活动表现。\n"
        )
        reasoning = (
            "推理路径：先通过机制/24h模式/诱发缓解与关键体征缩小范围，"
            "再用高价值检查（high-yield tests）去区分主要假设，"
            "最后将一致的证据点汇总到一个最符合的临床模式。"
        )
        strengths = ["流程完成度不错。", "能提出多条鉴别假设。", "能做出最终结论并给出治疗方向。"]
        improvements = ["追问尽量覆盖负荷变化、夜间痛与神经症状。", "检查选择优先能区分主要假设的少数关键项。", "治疗写清FITT与进阶/退阶标准。"]

    attempt.feedback = FeedbackOut(
        best_practice_treatment_cn=best,
        reasoning_path_cn=reasoning,
        scores=scores,
        strengths=strengths,
        improvements=improvements,
        safety_note_cn="教育模拟：如出现进行性无力/麻木、夜间无法缓解疼痛、发热体重下降、严重外伤后不稳等红旗，应考虑转诊/就医。",
    )
    store.put(attempt)
    return attempt

