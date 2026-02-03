import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatPanel from "./session-chat";

export default async function SessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return null;
  }

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, title, summary, key_points, next_questions, created_at, prompt_id"
    )
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (!session) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">セッションタイトル</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          {session.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {new Date(session.created_at).toLocaleString("ja-JP")}
        </p>
      </div>

      <ChatPanel
        sessionId={session.id}
        messages={messages ?? []}
        summary={session.summary}
        keyPoints={session.key_points as string[] | null}
        nextQuestions={session.next_questions as string[] | null}
      />
    </div>
  );
}
