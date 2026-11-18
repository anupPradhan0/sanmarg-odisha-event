"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const input = "mt-2 block h-14 w-full border border-rule bg-white px-4 text-lg outline-none focus:border-maroon-600";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="username" className="text-sm font-medium text-ink-2">
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={state.username}
          key={state.username}
          autoComplete="username"
          autoCapitalize="none"
          required
          className={input}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink-2">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {state.error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="block w-full bg-ink py-4 text-lg font-semibold text-paper transition-colors hover:bg-ink-2 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
