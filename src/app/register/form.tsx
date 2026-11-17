"use client";

import { useActionState } from "react";
import { CATEGORIES, DISTRICTS } from "@/lib/event";
import { register, type FormState } from "./actions";

const input =
  "mt-2 block h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-lg outline-none focus:border-maroon-600";

function Label({ htmlFor, od, en }: { htmlFor?: string; od: string; en: string }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-lg font-semibold text-slate-900">{od}</span>
      <span className="ml-2 text-sm text-slate-500">{en}</span>
    </label>
  );
}

function FieldError({ text }: { text?: string }) {
  return text ? (
    <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      ⚠️ {text}
    </p>
  ) : null;
}

export function RegisterForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  const v = state.values;

  return (
    <form action={action} className="space-y-7" noValidate>
      <div>
        <Label htmlFor="name" od="୧. ଆପଣଙ୍କ ନାମ" en="Your name" />
        <input id="name" name="name" autoComplete="name" defaultValue={v?.name ?? defaultName} className={input} />
        <p className="mt-1.5 text-sm text-slate-500">ପ୍ରମାଣପତ୍ରରେ ଏହି ନାମ ଛପାଯିବ · This name goes on your certificate</p>
        <FieldError text={state.errors?.name} />
      </div>

      <div>
        <Label htmlFor="mobile" od="୨. ମୋବାଇଲ ନମ୍ବର" en="Mobile number" />
        <div className="mt-2 flex">
          <span className="flex h-14 items-center rounded-l-xl border-2 border-r-0 border-slate-300 bg-slate-100 px-3 text-lg text-slate-600">
            +91
          </span>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="98765 43210"
            defaultValue={v?.mobile}
            className="block h-14 w-full rounded-r-xl border-2 border-slate-300 bg-white px-4 text-lg tracking-wider outline-none focus:border-maroon-600"
          />
        </div>
        <p className="mt-1.5 text-sm text-slate-500">ଗେଟରେ ଏହି ନମ୍ବର କହିବେ · You will tell this number at the gate</p>
        <FieldError text={state.errors?.mobile} />
      </div>

      <div>
        <Label htmlFor="district" od="୩. ଆପଣଙ୍କ ଜିଲ୍ଲା" en="Your district" />
        <select id="district" name="district" defaultValue={v?.district ?? ""} className={input}>
          <option value="" disabled>
            ଜିଲ୍ଲା ବାଛନ୍ତୁ · Choose district
          </option>
          {DISTRICTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.od} · {d.value}
            </option>
          ))}
        </select>
        <FieldError text={state.errors?.district} />
      </div>

      <fieldset>
        <legend>
          <Label od="୪. ଆପଣ କିଏ?" en="You are a…" />
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-slate-300 bg-white px-2 py-4 text-center has-checked:border-maroon-700 has-checked:bg-maroon-50 has-checked:ring-2 has-checked:ring-maroon-100 has-focus-visible:outline-2 has-focus-visible:outline-maroon-700"
            >
              <input type="radio" name="category" value={c.value} defaultChecked={v?.category === c.value} className="sr-only" />
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span className="font-semibold text-slate-900">{c.od}</span>
              <span className="text-xs text-slate-500">{c.value}</span>
            </label>
          ))}
        </div>
        <FieldError text={state.errors?.category} />
      </fieldset>

      <button
        disabled={pending}
        className="block w-full rounded-2xl bg-maroon-700 py-4 text-white shadow-md active:bg-maroon-800 disabled:opacity-60"
      >
        <span className="block text-xl font-bold">{pending ? "ଅପେକ୍ଷା କରନ୍ତୁ…" : "ପଞ୍ଜୀକରଣ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ"}</span>
        <span className="text-sm text-maroon-100">{pending ? "Please wait…" : "Complete registration"}</span>
      </button>
    </form>
  );
}
