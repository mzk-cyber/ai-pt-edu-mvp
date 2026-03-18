"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { Badge, Button, Card, Input } from "@/components/ui";
import { api } from "@/lib/api";
import type { Attempt, TestCatalogItem } from "@/lib/types";

export default function TestsPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const router = useRouter();

  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [catalog, setCatalog] = React.useState<TestCatalogItem[]>([]);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [custom, setCustom] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const testsDone = attempt?.tests_done?.length ?? 0;
  const remaining = Math.max(0, 8 - testsDone);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const a = await api.getAttempt(attemptId);
        setAttempt(a);
        const items = await api.getTestCatalog(a.region);
        setCatalog(items);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function onSubmitRound() {
    if (!attempt) return;
    setSubmitting(true);
    setError(null);
    try {
      const chosen = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k);

      const extras = custom
        .split(/[\n,，]/g)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = [...chosen, ...extras];
      if (!payload.length) {
        setError("请至少选择或输入 1 个检查。");
        return;
      }
      if (payload.length > remaining) {
        setError(`本次选择了 ${payload.length} 个，但剩余额度只有 ${remaining} 个。请减少选择或分轮追加。`);
        return;
      }

      const updated = await api.submitTests(attemptId, payload);
      setAttempt(updated);
      setSelected({});
      setCustom("");
      router.push(`/attempt/${attemptId}/results`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = catalog.filter((t) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const hay = `${t.test_id} ${t.name_cn} ${t.name_en ?? ""} ${(t.synonyms || []).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });

  if (loading) return <div className="text-sm text-zinc-600">加载中…</div>;
  if (!attempt) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">临床检查（Clinical tests）</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">选择检查（可分多轮追加）</h1>
          </div>
          <Badge>剩余 {remaining}/8</Badge>
        </div>

        <div className="mt-4 text-sm leading-6 text-zinc-700">
          这是训练平台：检查结果由病例证据表驱动。无法识别/不支持的检查会被后端拒绝（MVP 先走强约束）。
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/attempt/${attemptId}/hypotheses`}>
            <Button variant="ghost">← 回到鉴别</Button>
          </Link>
          <Link href={`/attempt/${attemptId}/results`}>
            <Button variant="secondary">查看已有结果</Button>
          </Link>
        </div>

        {testsDone ? (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-900">已做检查（{testsDone}/8）</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {attempt.tests_done.map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-800">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">检查库（按关键词筛选）</h2>
          <div className="text-xs text-zinc-600">{attempt.region}</div>
        </div>

        <div className="mt-4">
          <Input
            label="搜索"
            placeholder="输入 test_id / 中文名 / 英文名 / 同义词…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-zinc-200 bg-white">
          {filtered.map((t) => {
            const isChecked = !!selected[t.test_id];
            return (
              <label
                key={t.test_id}
                className="flex cursor-pointer items-start gap-3 border-b border-zinc-100 p-4 last:border-b-0 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={isChecked}
                  onChange={() => toggle(t.test_id)}
                  disabled={remaining <= 0}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900">
                    {t.name_cn}{" "}
                    {t.name_en ? <span className="text-zinc-500">({t.name_en})</span> : null}
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    <span className="font-mono">{t.test_id}</span>
                    {t.synonyms?.length ? ` · 同义词：${t.synonyms.slice(0, 4).join(" / ")}${t.synonyms.length > 4 ? "…" : ""}` : ""}
                  </div>
                </div>
              </label>
            );
          })}
          {!filtered.length ? (
            <div className="p-4 text-sm text-zinc-600">没有匹配的检查。</div>
          ) : null}
        </div>

        <div className="mt-4">
          <Input
            label="自定义输入（可选，支持英文/中文，同义词映射；用逗号或换行分隔）"
            placeholder="例如：Hawkins / Neer / Lachman"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            disabled={remaining <= 0}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onSubmitRound} disabled={submitting || remaining <= 0}>
            {submitting ? "提交中…" : "提交本轮检查并获取结果 →"}
          </Button>
          {remaining <= 0 ? (
            <Button variant="secondary" onClick={() => router.push(`/attempt/${attemptId}/results`)}>
              已满 8 个，查看结果
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

