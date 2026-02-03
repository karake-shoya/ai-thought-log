import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

const summarySchema = z.object({
  summary: z.string().min(1),
  key_points: z.array(z.string().min(1)).default([]),
  next_questions: z.array(z.string().min(1)).default([]),
});

const MAX_ASSISTANT_MESSAGES = 3;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function buildCoachSystemPrompt() {
  return `あなたは大人向けの思考ログのコーチです。
- 相手の思考を引き出す質問を優先する
- 決めつけない・評価しない
- 1回の返答で1〜2個の深掘り質問に留める
- 2〜3往復で終了を想定する`;
}

function buildSummarySystemPrompt() {
  return `あなたは会話の要約担当です。
以下の会話を読み、JSONのみを返してください。
JSONの形式: {"summary": "...", "key_points": ["..."], "next_questions": ["..."]}
summaryは3〜5文程度。key_pointsは最大5個。next_questionsは最大3個。`;
}

async function callOpenAI(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEYが設定されていません。");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content as string | undefined;
}

function sanitizeContent(text: string) {
  return text.replace(/\s+$/g, "");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "入力が正しくありません。" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, summary, title")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", authData.user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "セッションが見つかりません。" }, { status: 404 });
  }

  if (session.summary) {
    return NextResponse.json(
      { error: "このセッションはすでに完了しています。" },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase.from("messages").insert({
    session_id: parsed.data.sessionId,
    role: "user",
    content: parsed.data.content,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "メッセージの保存に失敗しました。" },
      { status: 500 }
    );
  }

  const { data: allMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("session_id", parsed.data.sessionId)
    .order("created_at", { ascending: true });

  const assistantCount = allMessages?.filter(
    (message) => message.role === "assistant"
  ).length;

  const shouldSummarize =
    assistantCount !== undefined && assistantCount >= MAX_ASSISTANT_MESSAGES - 1;

  try {
    if (shouldSummarize) {
      const conversationText = (allMessages ?? [])
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");

      const summaryContent = await callOpenAI([
        { role: "system", content: buildSummarySystemPrompt() },
        {
          role: "user",
          content: `会話:\n${conversationText}`,
        },
      ]);

      if (!summaryContent) {
        throw new Error("要約の生成に失敗しました。");
      }

      let summaryPayload = null;
      try {
        summaryPayload = summarySchema.parse(JSON.parse(summaryContent));
      } catch (error) {
        summaryPayload = {
          summary: summaryContent,
          key_points: [],
          next_questions: [],
        };
      }

      const assistantMessage = `セッションのまとめです。\n\n${summaryPayload.summary}`;

      const { error: assistantError } = await supabase
        .from("messages")
        .insert({
          session_id: parsed.data.sessionId,
          role: "assistant",
          content: assistantMessage,
        });

      if (assistantError) {
        throw new Error("AIメッセージの保存に失敗しました。");
      }

      const { error: sessionError } = await supabase
        .from("sessions")
        .update({
          summary: summaryPayload.summary,
          key_points: summaryPayload.key_points,
          next_questions: summaryPayload.next_questions,
        })
        .eq("id", parsed.data.sessionId);

      if (sessionError) {
        throw new Error("要約の保存に失敗しました。");
      }

      return NextResponse.json({ status: "summarized" });
    }

    const assistantContent = await callOpenAI([
      { role: "system", content: buildCoachSystemPrompt() },
      ...(allMessages ?? []).map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
    ]);

    if (!assistantContent) {
      throw new Error("AIの応答が取得できませんでした。");
    }

    const { error: assistantError } = await supabase.from("messages").insert({
      session_id: parsed.data.sessionId,
      role: "assistant",
      content: sanitizeContent(assistantContent),
    });

    if (assistantError) {
      throw new Error("AIメッセージの保存に失敗しました。");
    }

    if (!session.title) {
      const titleCandidate = parsed.data.content.slice(0, 32);
      await supabase
        .from("sessions")
        .update({ title: titleCandidate })
        .eq("id", parsed.data.sessionId);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AIの応答に失敗しました。",
      },
      { status: 500 }
    );
  }
}
