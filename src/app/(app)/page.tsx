import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDailyPrompt } from "@/lib/prompts";
import StartSessionForm from "./start-session-form";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return null;
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, summary, created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  const prompt = getDailyPrompt();

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-zinc-500">今日のプロンプト</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
              {prompt.text}
            </h1>
          </div>
          <StartSessionForm promptId={prompt.id} promptText={prompt.text} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            過去のセッション
          </h2>
          <Link href="/" className="text-sm text-zinc-500">
            すべて表示
          </Link>
        </div>
        <div className="space-y-3">
          {sessions?.length ? (
            sessions.map((session) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-zinc-900">
                      {session.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {new Date(session.created_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                    {session.summary ? "要約あり" : "進行中"}
                  </span>
                </div>
                {session.summary && (
                  <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
                    {session.summary}
                  </p>
                )}
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              まだセッションがありません。今日のプロンプトから始めてみましょう。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
