"use client";

import { useActionState } from "react";
import { startSession, type StartSessionState } from "./actions";

const initialState: StartSessionState = {};

export default function StartSessionForm({
  promptId,
  promptText,
}: {
  promptId: string;
  promptText: string;
}) {
  const [state, formAction, isPending] = useActionState(
    startSession,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="promptId" value={promptId} />
      <input type="hidden" name="promptText" value={promptText} />
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "セッション作成中..." : "新規セッションを開始"}
      </button>
    </form>
  );
}
