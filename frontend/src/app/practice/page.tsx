"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button, Card, Input } from "@/components/ui";
import { api } from "@/lib/api";
import type { Region, Style } from "@/lib/types";
import { addAttemptToIndex } from "@/lib/storage";

export default function PracticePage() {
  const router = useRouter();
  const [region, setRegion] = React.useState<Region>("shoulder");
  const [style, setStyle] = React.useState<Style>("daily");
  const [includeRedFlags, setIncludeRedFlags] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onStart() {
    setLoading(true);
    setError(null);
    try {
      const attempt = await api.createAttempt({
        region,
        style,
        difficulty: "beginner",
        include_red_flags: includeRedFlags,
      });
      addAttemptToIndex({ attemptId: attempt.attempt_id, region, createdAt: Date.now() });
      router.push(`/attempt/${attempt.attempt_id}/complaint`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container py-10">
        <div className="mb-6">
          <div className="text-sm text-zinc-600">自由练习</div>
          <h1 className="text-2xl font-semibold tracking-tight">开始一个病例</h1>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-zinc-800">部位</div>
              <select
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
              >
                <option value="shoulder">肩（Shoulder）</option>
                <option value="knee">膝（Knee）</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-zinc-800">场景风格</div>
              <select
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
              >
                <option value="daily">日常（Daily）</option>
                <option value="sport">运动（Sport）</option>
                <option value="work">工作（Work）</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="rf"
              type="checkbox"
              className="h-4 w-4"
              checked={includeRedFlags}
              onChange={(e) => setIncludeRedFlags(e.target.checked)}
            />
            <label htmlFor="rf" className="text-sm text-zinc-700">
              允许出现红旗/转诊意识训练（教学用）
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={onStart} disabled={loading}>
              {loading ? "生成中…" : "开始"}
            </Button>
            <div className="text-xs text-zinc-600">
              说明：病例叙事会改写，但检查结果由证据表驱动，避免“胡编结果”。
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </Card>

        <div className="mt-6 text-sm text-zinc-600">
          后端默认地址为 <code className="rounded bg-zinc-100 px-1">http://127.0.0.1:8000</code>。如需修改，
          在 <code className="rounded bg-zinc-100 px-1">frontend/.env.local</code> 设置{" "}
          <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_API_BASE</code>。
        </div>
      </div>
    </div>
  );
}

