"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上です"),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().min(2, "表示名は2文字以上です"),
});

export type AuthState = {
  error?: string;
  success?: string;
};

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "ログインに失敗しました。入力内容を確認してください。" };
  }

  redirect("/");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return { error: "サインアップに失敗しました。入力内容を確認してください。" };
  }

  if (data.user && data.session) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      display_name: parsed.data.displayName,
    });
  }

  if (data.session) {
    redirect("/");
  }

  return {
    success: "確認メールを送信しました。メール内のリンクからログインしてください。",
  };
}
