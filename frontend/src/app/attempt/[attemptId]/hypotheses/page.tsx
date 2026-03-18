"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import type { Attempt, HypothesisItem } from "@/lib/types";

function emptyItem(): HypothesisItem {
  return { label_cn: "", label_en: "", confidence: 50, rationale_bullets: [""] };
}

export default function HypothesesPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;
  const router = useRouter();

  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [items, setItems] = React.useState<HypothesisItem[]>([
    emptyItem(),
    emptyItem(),
    emptyItem(),
  ]);
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
        if (a.hypotheses?.length) setItems(a.hypotheses);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  function updateItem(idx: number, patch: Partial<HypothesisItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function updateRationale(idx: number, text: string) {
    updateItem(idx, { rationale_bullets: [text] });
  }

  function addRow() {
    setItems((prev) => (prev.length >= 8 ? prev : [...prev, emptyItem()]));
  }

  function removeRow(idx: number) {
    setItems((prev) => (prev.length <= 3 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function onSave(nextRoute?: string) {
    setSaving(true);
    setError(null);
    try {
      const cleaned = items
        .map((it) => ({
          ...it,
          label_cn: it.label_cn.trim(),
          label_en: (it.label_en || "").trim() || null,
          confidence: Math.max(0, Math.min(100, Math.round(it.confidence || 0))),
          rationale_bullets: (it.rationale_bullets || [])
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 3),
        }))
        .filter((it) => it.label_cn);

      if (cleaned.length < 3) {
        setError("请至少填写 3 条鉴别诊断（临床模式/功能障碍）。");
        return;
      }

      const updated = await api.submitHypotheses(attemptId, cleaned);
      setAttempt(updated);
      if (nextRoute) router.push(nextRoute);
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">鉴别诊断（临床模式/功能障碍）</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">写出你目前的假设</h1>
          </div>
          <Badge>{items.length}/8</Badge>
        </div>

        <div className="mt-4 text-sm leading-6 text-zinc-700">
          目标是把“可能性”写成可验证的假设：下一步你会用哪些检查去区分它们？
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addRow} disabled={items.length >= 8}>
            + 增加一条
          </Button>
          <Link href={`/attempt/${attemptId}/complaint`}>
            <Button variant="ghost">← 回到追问</Button>
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">输入（3–8 条）</h2>
        <div className="mt-4 grid gap-4">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="中文标签"
                  placeholder="例如：肩袖相关肩痛（负荷相关痛）"
                  value={it.label_cn}
                  onChange={(e) => updateItem(idx, { label_cn: e.target.value })}
                />
                <Input
                  label="英文括注（可选）"
                  placeholder="例如：RCRSP"
                  value={it.label_en ?? ""}
                  onChange={(e) => updateItem(idx, { label_en: e.target.value })}
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-800">置信度（0–100）</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={it.confidence}
                    onChange={(e) => updateItem(idx, { confidence: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-zinc-600">{it.confidence}</div>
                </label>
                <Textarea
                  label="依据要点（≤3条，MVP 先填一句也行）"
                  placeholder="例如：过顶负荷诱发，外侧痛，夜间翻身痛…"
                  value={(it.rationale_bullets?.[0] ?? "").toString()}
                  onChange={(e) => updateRationale(idx, e.target.value)}
                />
              </div>

              <div className="mt-3 flex justify-between">
                <div className="text-xs text-zinc-500">第 {idx + 1} 条</div>
                <Button variant="ghost" size="sm" onClick={() => removeRow(idx)} disabled={items.length <= 3}>
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => onSave()} disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
          <Button variant="secondary" onClick={() => onSave(`/attempt/${attemptId}/tests`)} disabled={saving}>
            保存并进入检查 →
          </Button>
        </div>
      </Card>
    </div>
  );
}

