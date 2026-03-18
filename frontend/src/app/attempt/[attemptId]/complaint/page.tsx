"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import type { Attempt } from "@/lib/types";

export default function ComplaintPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const router = useRouter();

  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [topic, setTopic] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [asking, setAsking] = React.useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const a = await api.getAttempt(attemptId);
      setAttempt(a);
      if (!topic && a.case_prompt.available_question_topics.length) {
        setTopic(a.case_prompt.available_question_topics[0] ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  async function onAsk() {
    if (!attempt) return;
    if (!topic.trim()) return;
    setAsking(true);
    setError(null);
    try {
      const next = await api.askQuestion(attemptId, {
        topic: topic.trim(),
        question_cn: question.trim() || topic.trim(),
      });
      setAttempt(next);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAsking(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-600">加载中…</div>;
  }
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-red-700">{error}</div>
        <div className="mt-4">
          <Button variant="secondary" onClick={refresh}>
            重试
          </Button>
        </div>
      </Card>
    );
  }
  if (!attempt) return null;

  const asked = attempt.questions_asked.length;
  const remaining = Math.max(0, 8 - asked);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">
              部位：{attempt.region === "shoulder" ? "肩（Shoulder）" : "膝（Knee）"}
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">患者主诉与初始病史</h1>
          </div>
          <Badge>追问剩余 {remaining}/8</Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold text-zinc-900">主诉</div>
          <div className="mt-1 text-sm leading-6 text-zinc-800">{attempt.case_prompt.complaint_cn}</div>
          {attempt.case_prompt.key_terms_en.length ? (
            <div className="mt-2 text-xs text-zinc-600">
              关键词（Key terms）：{attempt.case_prompt.key_terms_en.join(", ")}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-zinc-900">初始叙事</div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
            {attempt.case_prompt.initial_story_cn}
          </p>
        </div>

        <div className="mt-4 text-xs text-zinc-600">{attempt.case_prompt.disclaimer_cn}</div>

        <div className="mt-6 flex items-center gap-3">
          <Link href={`/attempt/${attemptId}/hypotheses`}>
            <Button>进入鉴别诊断 →</Button>
          </Link>
          <Link href={`/attempt/${attemptId}/tests`}>
            <Button variant="secondary">我先做检查</Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">追问病史（最多 8 次）</h2>

        <div className="mt-4 grid gap-3">
          <label className="block">
            <div className="mb-1 text-sm font-medium text-zinc-800">主题（topic）</div>
            <select
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={remaining <= 0}
            >
              {attempt.case_prompt.available_question_topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="custom">custom</option>
            </select>
          </label>

          <Input
            label="你的问题（可选）"
            placeholder="例如：是否有麻木/刺痛？夜间静息痛？近期负荷变化？"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={remaining <= 0}
          />

          <Button onClick={onAsk} disabled={asking || remaining <= 0}>
            {asking ? "询问中…" : "提交追问"}
          </Button>

          {remaining <= 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              追问次数已用完（8/8）。请进入下一步：鉴别诊断或检查。
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-zinc-900">已追问记录</div>
          {attempt.questions_asked.length ? (
            <div className="mt-2 grid gap-3">
              {attempt.questions_asked
                .slice()
                .reverse()
                .map((q, idx) => (
                  <div key={`${q.topic}-${idx}`} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="text-xs text-zinc-500">topic: {q.topic}</div>
                    <div className="mt-1 text-sm font-medium text-zinc-900">{q.question_cn}</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{q.answer_cn}</div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-600">还没有追问记录。</div>
          )}
        </div>
      </Card>
    </div>
  );
}

