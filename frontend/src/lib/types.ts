export type Region = "shoulder" | "knee";
export type Difficulty = "beginner" | "intermediate";
export type Style = "sport" | "daily" | "work";

export type AttemptCreateIn = {
  region: Region;
  difficulty?: Difficulty;
  style?: Style;
  include_red_flags?: boolean;
};

export type AskedQuestion = {
  topic: string;
  question_cn: string;
  answer_cn: string;
  key_terms_en: string[];
  confidence: "stated" | "uncertain" | "not_mentioned";
};

export type CasePrompt = {
  complaint_cn: string;
  key_terms_en: string[];
  initial_story_cn: string;
  disclaimer_cn: string;
  available_question_topics: string[];
};

export type HypothesisItem = {
  label_cn: string;
  label_en?: string | null;
  confidence: number;
  rationale_bullets: string[];
};

export type TestResult = {
  test_id: string;
  name_cn: string;
  name_en?: string | null;
  result: "positive" | "negative" | "equivocal" | "not_available";
  quant: Record<string, unknown>;
  short_interp_cn: string;
};

export type FinalAnswerIn = {
  primary_pattern_cn: string;
  primary_pattern_en?: string | null;
  supporting_evidence: string[];
  ruled_out: string[];
  stage_or_irritability?: string | null;
  goals: Record<string, string>;
};

export type ScoreBreakdown = {
  info_gathering: number;
  hypotheses_quality: number;
  test_selection: number;
  final_and_plan: number;
  total: number;
};

export type FeedbackOut = {
  best_practice_treatment_cn: string;
  reasoning_path_cn: string;
  scores: ScoreBreakdown;
  strengths: string[];
  improvements: string[];
  safety_note_cn: string;
};

export type Attempt = {
  attempt_id: string;
  region: Region;
  difficulty: Difficulty;
  style: Style;
  include_red_flags: boolean;
  case_seed_id: string;
  case_prompt: CasePrompt;
  questions_asked: AskedQuestion[];
  hypotheses: HypothesisItem[];
  tests_done: string[];
  test_results: TestResult[];
  final_answer?: FinalAnswerIn | null;
  feedback?: FeedbackOut | null;
};

export type TestCatalogItem = {
  test_id: string;
  name_cn: string;
  name_en?: string | null;
  synonyms: string[];
  region_tags: string[];
};

