from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, computed_field


class Region(str, Enum):
    shoulder = "shoulder"
    knee = "knee"


class Difficulty(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"


class Style(str, Enum):
    sport = "sport"
    daily = "daily"
    work = "work"


class AttemptCreateIn(BaseModel):
    region: Region
    difficulty: Difficulty = Difficulty.beginner
    style: Style = Style.daily
    include_red_flags: bool = False


class CasePrompt(BaseModel):
    complaint_cn: str
    key_terms_en: list[str] = Field(default_factory=list)
    initial_story_cn: str
    disclaimer_cn: str
    available_question_topics: list[str]


class CaseSeed(BaseModel):
    id: str
    region: Region
    pattern_truth_cn: str
    pattern_truth_en: str
    variant_tags: list[str] = Field(default_factory=list)
    complaint_cn: str
    initial_story_cn: str
    key_terms_en: list[str] = Field(default_factory=list)
    include_red_flags_ok: bool = False
    history_by_topic: dict[str, str]
    exam_evidence_table: dict[str, dict[str, Any]]


class AskedQuestion(BaseModel):
    topic: str
    question_cn: str
    answer_cn: str
    key_terms_en: list[str] = Field(default_factory=list)
    confidence: Literal["stated", "uncertain", "not_mentioned"] = "stated"


class HypothesisItem(BaseModel):
    label_cn: str
    label_en: str | None = None
    confidence: int = Field(ge=0, le=100)
    rationale_bullets: list[str] = Field(default_factory=list, max_length=3)


class HypothesesIn(BaseModel):
    items: list[HypothesisItem] = Field(min_length=3, max_length=8)


class TestSelectIn(BaseModel):
    tests: list[str] = Field(min_length=1, max_length=8, description="test_id list for this round")


class TestResult(BaseModel):
    test_id: str
    name_cn: str
    name_en: str | None = None
    result: Literal["positive", "negative", "equivocal", "not_available"]
    quant: dict[str, Any] = Field(default_factory=dict)
    short_interp_cn: str


class FinalAnswerIn(BaseModel):
    primary_pattern_cn: str
    primary_pattern_en: str | None = None
    supporting_evidence: list[str] = Field(default_factory=list, max_length=6)
    ruled_out: list[str] = Field(default_factory=list, max_length=4)
    stage_or_irritability: str | None = None
    goals: dict[str, str] = Field(default_factory=dict)


class ScoreBreakdown(BaseModel):
    info_gathering: int = Field(ge=0, le=20)
    hypotheses_quality: int = Field(ge=0, le=30)
    test_selection: int = Field(ge=0, le=25)
    final_and_plan: int = Field(ge=0, le=25)

    @computed_field  # type: ignore[misc]
    def total(self) -> int:
        return self.info_gathering + self.hypotheses_quality + self.test_selection + self.final_and_plan


class FeedbackOut(BaseModel):
    best_practice_treatment_cn: str
    reasoning_path_cn: str
    scores: ScoreBreakdown
    strengths: list[str]
    improvements: list[str]
    safety_note_cn: str


class Attempt(BaseModel):
    attempt_id: str
    region: Region
    difficulty: Difficulty
    style: Style
    include_red_flags: bool
    case_seed_id: str
    case_prompt: CasePrompt
    questions_asked: list[AskedQuestion] = Field(default_factory=list)
    hypotheses: list[HypothesisItem] = Field(default_factory=list)
    tests_done: list[str] = Field(default_factory=list)
    test_results: list[TestResult] = Field(default_factory=list)
    final_answer: FinalAnswerIn | None = None
    feedback: FeedbackOut | None = None

