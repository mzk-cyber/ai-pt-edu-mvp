import Link from "next/link";

export default async function AttemptLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const steps = [
    { slug: "complaint", label: "病例/追问" },
    { slug: "hypotheses", label: "鉴别诊断" },
    { slug: "tests", label: "临床检查" },
    { slug: "final", label: "最终结论" },
    { slug: "feedback", label: "讲评" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-zinc-900">
            ← 返回首页
          </Link>
          <div className="text-xs text-zinc-600">
            Attempt: <code className="rounded bg-zinc-100 px-1">{attemptId}</code>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((s) => (
            <Link
              key={s.slug}
              href={`/attempt/${attemptId}/${s.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
            >
              {s.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}

