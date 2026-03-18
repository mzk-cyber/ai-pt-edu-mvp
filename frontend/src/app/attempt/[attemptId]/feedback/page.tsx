"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Attempt } from "@/lib/types";

export default function FeedbackPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const a = await api.getAttempt(attemptId);
      setAttempt(a);
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

  async function onGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const a = await api.generateFeedback(attemptId);
      setAttempt(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="text-sm text-zinc-600">加载中…</div>;
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-red-700">{error}</div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={refresh}>
            重试
          </Button>
          <Link href={`/attempt/${attemptId}/final`}>
            <Button variant="ghost">← 回到最终结论</Button>
          </Link>
        </div>
      </Card>
    );
  }
  if (!attempt) return null;

  const fb = attempt.feedback;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">讲评与治疗建议（教育模拟）</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">AI 反馈</h1>
          </div>
          {fb ? <Badge>总分 {fb.scores.total}/100</Badge> : <Badge>未生成</Badge>}
        </div>

        <div className="mt-4 text-sm leading-6 text-zinc-700">
          若你已提交“最终结论”，点击生成即可获得：最佳治疗框架、推理路径、优点/改进建议与评分。
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/attempt/${attemptId}/final`}>
            <Button variant="secondary">← 回到最终结论</Button>
          </Link>
          <Button onClick={onGenerate} disabled={generating || !attempt.final_answer}>
            {generating ? "生成中…" : "生成讲评"}
          </Button>
          <Link href="/practice">
            <Button variant="ghost">开始新病例</Button>
          </Link>
        </div>

        {!attempt.final_answer ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            需要先在“最终结论”页提交你的结论，才能生成讲评。
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        {fb ? (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">分项评分</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-800">
                <div>信息采集：{fb.scores.info_gathering}/20</div>
                <div>鉴别诊断：{fb.scores.hypotheses_quality}/30</div>
                <div>检查选择：{fb.scores.test_selection}/25</div>
                <div>最终结论与计划：{fb.scores.final_and_plan}/25</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">最佳治疗框架</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                {fb.best_practice_treatment_cn}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">推理路径</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                {fb.reasoning_path_cn}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">你做得好的点</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-zinc-800">
                {fb.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">下一次的改进建议</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-zinc-800">
                {fb.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">安全提示（红旗/转诊）</div>
              <p className="mt-2 text-sm leading-6 text-zinc-800">{fb.safety_note_cn}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-600">尚未生成讲评。</div>
        )}
      </Card>
    </div>
  );
}

