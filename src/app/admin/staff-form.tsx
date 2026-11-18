"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";
import { createStaff, type StaffFormState } from "./actions";

const input = "block h-12 w-full border border-rule bg-white px-3 outline-none focus:border-maroon-600";

export function CreateStaffForm() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(createStaff, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input name="name" placeholder="Full name" aria-label="Full name" required className={input} />
      <input name="username" placeholder="Username (e.g. gate1)" aria-label="Username" autoCapitalize="none" autoComplete="off" required className={input} />
      <input name="password" placeholder="Password (min 6)" aria-label="Password" autoComplete="new-password" required className={input} />
      {state.error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{state.ok}</p>}
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 bg-maroon-700 py-3 font-semibold text-white hover:bg-maroon-800 disabled:opacity-60"
      >
        <UserPlus className="size-4" aria-hidden />
        {pending ? "Adding…" : "Add staff"}
      </button>
    </form>
  );
}
