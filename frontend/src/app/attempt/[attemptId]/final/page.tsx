"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { Button, Card, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import type { Attempt, FinalAnswerIn } from "@/lib/types";

export default function FinalPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const router = useRouter();

  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [final, setFinal] = React.useState<FinalAnswerIn>({
    primary_pattern_cn: "",
    primary_pattern_en: "",
    supporting_evidence: [],
    ruled_out: [],
    stage_or_irritability: "",
    goals: {},
  });
  const [evidenceText, setEvidenceText] = React.useState("");
  const [ruledOutText, setRuledOutText] = React.useState("");
  const [goalsText, setGoalsText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const a = await api.getAttempt(attemptId);
        setAttempt(a);
        if (a.final_answer) {
          setFinal({
            primary_pattern_cn: a.final_answer.primary_pattern_cn || "",
            primary_pattern_en: a.final_answer.primary_pattern_en || "",
            supporting_evidence: a.final_answer.supporting_evidence || [],
            ruled_out: a.final_answer.ruled_out || [],
            stage_or_irritability: a.final_answer.stage_or_irritability || "",
            goals: a.final_answer.goals || {},
          });
          setEvidenceText((a.final_answer.supporting_evidence || []).join("\n"));
          setRuledOutText((a.final_answer.ruled_out || []).join("\n"));
          setGoalsText(
            Object.entries(a.final_answer.goals || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n"),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  function parseLines(s: string) {
    return s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  function parseGoals(s: string) {
    const out: Record<string, string> = {};
    for (const line of s.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const idx = t.indexOf(":");
      if (idx === -1) continue;
      const k = t.slice(0, idx).trim();
      const v = t.slice(idx + 1).trim();
      if (k && v) out[k] = v;
    }
    return out;
  }

  async function onSave(next?: "feedback") {
    setSaving(true);
    setError(null);
    try {
      const payload: FinalAnswerIn = {
        primary_pattern_cn: final.primary_pattern_cn.trim(),
        primary_pattern_en: (final.primary_pattern_en || "").trim() || null,
        stage_or_irritability: (final.stage_or_irritability || "").trim() || null,
        supporting_evidence: parseLines(evidenceText).slice(0, 6),
        ruled_out: parseLines(ruledOutText).slice(0, 4),
        goals: parseGoals(goalsText),
      };
      if (!payload.primary_pattern_cn) {
        setError("请填写主要临床模式/功能障碍（primary pattern）。");
        return;
      }
      const updated = await api.submitFinal(attemptId, payload);
      setAttempt(updated);
      if (next === "feedback") router.push(`/attempt/${attemptId}/feedback`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-zinc-600">加载中…</div>;
  if (!attempt) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="text-sm text-zinc-600">最终结论</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">写下你的主要模式与依据</h1>
        <div className="mt-4 text-sm leading-6 text-zinc-700">
          这里的“正确答案”是临床模式/功能障碍层级。尽量把依据写成可追溯的证据点（来自你追问与检查结果）。
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/attempt/${attemptId}/results`}>
            <Button variant="secondary">← 回到结果</Button>
          </Link>
          <Button onClick={() => onSave()} disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
          <Button onClick={() => onSave("feedback")} disabled={saving}>
            保存并生成讲评 →
          </Button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="grid gap-4">
          <Input
            label="主要临床模式（中文）"
            placeholder="例如：髌股疼痛模式（负荷相关）"
            value={final.primary_pattern_cn}
            onChange={(e) => setFinal((p) => ({ ...p, primary_pattern_cn: e.target.value }))}
          />
          <Input
            label="英文括注（可选）"
            placeholder="例如：PFP"
            value={final.primary_pattern_en ?? ""}
            onChange={(e) => setFinal((p) => ({ ...p, primary_pattern_en: e.target.value }))}
          />
          <Input
            label="阶段/激惹性（可选）"
            placeholder="例如：高激惹 / 亚急性 / 慢性…"
            value={final.stage_or_irritability ?? ""}
            onChange={(e) => setFinal((p) => ({ ...p, stage_or_irritability: e.target.value }))}
          />

          <Textarea
            label="支持依据（最多 6 行）"
            placeholder={"每行一个证据点，例如：\n- 下楼诱发膝前痛\n- 单腿下蹲阳性\n- 无明显积液"}
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
          />

          <Textarea
            label="排除要点（最多 4 行）"
            placeholder={"例如：\n- 无PROM明显受限 → 不像冻结肩\n- 无明显积液/锁膝 → 不像急性桶柄撕裂"}
            value={ruledOutText}
            onChange={(e) => setRuledOutText(e.target.value)}
          />

          <Textarea
            label="目标（Goals，格式：时间: 目标；可选）"
            placeholder={"例如：\n2w: 夜间痛下降到≤2/10\n6w: 下楼可耐受且疼痛≤3/10"}
            value={goalsText}
            onChange={(e) => setGoalsText(e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
}

