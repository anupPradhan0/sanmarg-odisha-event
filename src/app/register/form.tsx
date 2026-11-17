"use client";

import { useActionState } from "react";
import { AGE_GROUPS, CATEGORIES, DISTRICTS, GENDERS } from "@/lib/event";
import { pick, type Lang } from "@/lib/i18n";
import { register, type FormState } from "./actions";

const input =
  "mt-2 block h-14 w-full border border-rule bg-white px-4 text-lg outline-none focus:border-maroon-600";

function FieldError({ text }: { text?: string }) {
  return text ? (
    <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      ⚠️ {text}
    </p>
  ) : null;
}

export function RegisterForm({ defaultName, lang }: { defaultName: string; lang: Lang }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  const v = state.values;
  const t = pick(lang);
  const label = "block text-lg font-semibold text-ink";
  const choice =
    "flex cursor-pointer items-center justify-center border border-rule bg-white px-2 py-4 text-center has-checked:border-maroon-700 has-checked:bg-maroon-50 has-checked:ring-2 has-checked:ring-maroon-100 has-focus-visible:outline-2 has-focus-visible:outline-maroon-700";

  return (
    <form action={action} className="space-y-7" noValidate>
      <div>
        <label htmlFor="name" className={label}>
          {t("1. Your name", "୧. ଆପଣଙ୍କ ନାମ")}
        </label>
        <input id="name" name="name" autoComplete="name" defaultValue={v?.name ?? defaultName} className={input} />
        <p className="mt-1.5 text-sm text-ink-3">{t("This name goes on your certificate", "ପ୍ରମାଣପତ୍ରରେ ଏହି ନାମ ଛପାଯିବ")}</p>
        <FieldError text={state.errors?.name} />
      </div>

      <div>
        <label htmlFor="mobile" className={label}>
          {t("2. Mobile number", "୨. ମୋବାଇଲ ନମ୍ବର")}
        </label>
        <div className="mt-2 flex">
          <span className="flex h-14 items-center border border-r-0 border-rule bg-paper-2 px-3 text-lg text-ink-2">
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
            className="block h-14 w-full border border-rule bg-white px-4 text-lg tracking-wider outline-none focus:border-maroon-600"
          />
        </div>
        <p className="mt-1.5 text-sm text-ink-3">{t("You will tell this number at the gate", "ଗେଟରେ ଏହି ନମ୍ବର କହିବେ")}</p>
        <FieldError text={state.errors?.mobile} />
      </div>

      <fieldset>
        <legend className={label}>{t("3. Gender", "୩. ଲିଙ୍ଗ")}</legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {GENDERS.map((g) => (
            <label key={g.value} className={choice}>
              <input type="radio" name="gender" value={g.value} defaultChecked={v?.gender === g.value} className="sr-only" />
              <span className="font-semibold text-ink">{t(g.value, g.od)}</span>
            </label>
          ))}
        </div>
        <FieldError text={state.errors?.gender} />
      </fieldset>

      <div>
        <label htmlFor="ageGroup" className={label}>
          {t("4. Age group", "୪. ବୟସ ବର୍ଗ")}
        </label>
        <select id="ageGroup" name="ageGroup" defaultValue={v?.ageGroup ?? ""} className={input}>
          <option value="" disabled>
            {t("Choose age group", "ବୟସ ବର୍ଗ ବାଛନ୍ତୁ")}
          </option>
          {AGE_GROUPS.map((a) => (
            <option key={a.value} value={a.value}>
              {t(a.value.replace("-", " – "), a.od)}
            </option>
          ))}
        </select>
        <FieldError text={state.errors?.ageGroup} />
      </div>

      <div>
        <label htmlFor="district" className={label}>
          {t("5. Your district", "୫. ଆପଣଙ୍କ ଜିଲ୍ଲା")}
        </label>
        <select id="district" name="district" defaultValue={v?.district ?? ""} className={input}>
          <option value="" disabled>
            {t("Choose district", "ଜିଲ୍ଲା ବାଛନ୍ତୁ")}
          </option>
          {DISTRICTS.map((d) => (
            <option key={d.value} value={d.value}>
              {t(d.value, d.od)}
            </option>
          ))}
        </select>
        <FieldError text={state.errors?.district} />
      </div>

      <fieldset>
        <legend className={label}>{t("6. You are a…", "୬. ଆପଣ କିଏ?")}</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className={`${choice} flex-col gap-1`}
            >
              <input type="radio" name="category" value={c.value} defaultChecked={v?.category === c.value} className="sr-only" />
              <c.icon className="size-7 text-maroon-700" strokeWidth={1.5} aria-hidden />
              <span className="font-semibold text-ink">{t(c.value, c.od)}</span>
            </label>
          ))}
        </div>
        <FieldError text={state.errors?.category} />
      </fieldset>

      <button
        disabled={pending}
        className="block w-full bg-maroon-700 py-4 text-xl font-bold text-white active:bg-maroon-800 disabled:opacity-60"
      >
        {pending ? t("Please wait…", "ଅପେକ୍ଷା କରନ୍ତୁ…") : t("Complete registration", "ପଞ୍ଜୀକରଣ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ")}
      </button>
    </form>
  );
}
