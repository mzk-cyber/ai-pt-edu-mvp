"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Attempt } from "@/lib/types";

function ResultBadge({ r }: { r: string }) {
  const cls =
    r === "positive"
      ? "bg-red-100 text-red-800"
      : r === "negative"
        ? "bg-emerald-100 text-emerald-800"
        : r === "equivocal"
          ? "bg-amber-100 text-amber-900"
          : "bg-zinc-100 text-zinc-700";
  const label =
    r === "positive"
      ? "阳性"
      : r === "negative"
        ? "阴性"
        : r === "equivocal"
          ? "不确定"
          : "不提供";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}

export default function ResultsPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
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
    })();
  }, [attemptId]);

  if (loading) return <div className="text-sm text-zinc-600">加载中…</div>;
  if (error) return <div className="text-sm text-red-700">{error}</div>;
  if (!attempt) return null;

  const used = attempt.tests_done.length;
  const remaining = Math.max(0, 8 - used);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">检查结果（Exam results）</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">返回结果与简要解释</h1>
          </div>
          <Badge>剩余 {remaining}/8</Badge>
        </div>

        <div className="mt-4 text-sm leading-6 text-zinc-700">
          结果来自病例证据表（evidence table）。你可以根据结果回去追加检查（如果还有额度），也可以直接进入最终结论。
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/attempt/${attemptId}/tests`}>
            <Button variant="secondary">追加/选择检查</Button>
          </Link>
          <Link href={`/attempt/${attemptId}/final`}>
            <Button>进入最终结论 →</Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">已做检查（{used}/8）</h2>
        {attempt.test_results.length ? (
          <div className="mt-4 grid gap-3">
            {attempt.test_results.map((tr) => (
              <div key={tr.test_id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-900">
                      {tr.name_cn} {tr.name_en ? <span className="text-zinc-500">({tr.name_en})</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 font-mono">{tr.test_id}</div>
                  </div>
                  <ResultBadge r={tr.result} />
                </div>
                {Object.keys(tr.quant || {}).length ? (
                  <pre className="mt-3 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
                    {JSON.stringify(tr.quant, null, 2)}
                  </pre>
                ) : null}
                <div className="mt-3 text-sm leading-6 text-zinc-800">{tr.short_interp_cn}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-zinc-600">你还没做任何检查。</div>
        )}
      </Card>
    </div>
  );
}

