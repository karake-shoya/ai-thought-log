"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthState } from "../actions";

const initialState: AuthState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          ログイン
        </h1>
        <p className="text-sm text-zinc-500">
          思考ログの続きを始めましょう。
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <label className="block text-sm font-medium text-zinc-700">
          メールアドレス
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700">
          パスワード
          <input
            name="password"
            type="password"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
          />
        </label>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        初めての方は{" "}
        <Link href="/signup" className="font-medium text-zinc-900">
          無料登録へ
        </Link>
      </p>
    </div>
  );
}
