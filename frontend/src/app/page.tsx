import Link from "next/link";

import { Badge, Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-zinc-900" />
            <div>
              <div className="text-base font-semibold">AI 物理治疗师教育平台（MVP）</div>
              <div className="text-sm text-zinc-600">肩/膝 · 病史追问 → 鉴别 → 检查 → 讲评</div>
            </div>
          </div>
          <Badge>教育模拟</Badge>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            用分步病例训练你的临床推理（clinical reasoning）
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            流程：患者主诉/病史（可追问 ≤8）→ 你写鉴别诊断 → 选择/追加检查（累计 ≤8）→
            获取检查结果 → 下最终模式结论 → AI 给治疗框架与推理讲评（中文为主，英文括注）。
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/practice">
              <Button>开始练习</Button>
            </Link>
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
              <Button variant="secondary">查看后端 API 文档</Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
