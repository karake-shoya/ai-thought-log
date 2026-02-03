"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export default function ChatPanel({
  sessionId,
  messages,
  summary,
  keyPoints,
  nextQuestions,
}: {
  sessionId: string;
  messages: Message[];
  summary: string | null;
  keyPoints: string[] | null;
  nextQuestions: string[] | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "送信に失敗しました。");
      }

      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
              まずは今日のプロンプトへの答えを書いてみましょう。AIが深掘り質問を返します。
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "assistant"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "bg-zinc-100 text-zinc-700"
                    : "bg-zinc-900 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        {summary ? (
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-900">
            <h3 className="text-base font-semibold">セッション要約</h3>
            <p className="mt-2 whitespace-pre-wrap">{summary}</p>
            {keyPoints && keyPoints.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">論点</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            {nextQuestions && nextQuestions.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">次の問い</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {nextQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            あなたの回答
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              placeholder="感じたことや考えたことを自由に書いてください"
              className="mt-2 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
              disabled={isSending || Boolean(summary)}
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSending || !content.trim() || Boolean(summary)}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {summary
              ? "このセッションは完了しました"
              : isSending
                ? "送信中..."
                : "送信してAIに聞く"}
          </button>
        </div>
      </form>
    </div>
  );
}
