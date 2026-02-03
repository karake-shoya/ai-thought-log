"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const startSessionSchema = z.object({
  promptId: z.string().min(1),
  promptText: z.string().min(1),
});

export type StartSessionState = {
  error?: string;
};

export async function startSession(
  _prevState: StartSessionState,
  formData: FormData
): Promise<StartSessionState> {
  const parsed = startSessionSchema.safeParse({
    promptId: formData.get("promptId"),
    promptText: formData.get("promptText"),
  });

  if (!parsed.success) {
    return { error: "プロンプト情報が不足しています。" };
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const title = parsed.data.promptText.slice(0, 32);
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userData.user.id,
      prompt_id: parsed.data.promptId,
      title,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "セッションを開始できませんでした。" };
  }

  redirect(`/session/${data.id}`);
}
