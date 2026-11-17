import { cookies } from "next/headers";
import { getLang } from "@/lib/get-lang";
import type { Lang } from "@/lib/i18n";

async function setLang(formData: FormData) {
  "use server";
  const lang = formData.get("lang") === "or" ? "or" : "en";
  (await cookies()).set("lang", lang, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", path: "/" });
}

const OPTIONS: [Lang, string][] = [
  ["en", "EN"],
  ["or", "ଓଡ଼ିଆ"],
];

/** EN | ଓଡ଼ିଆ segmented switch. Reads the cookie itself unless `lang` is given (Suspense fallback). */
export async function LangSwitch({ lang }: { lang?: Lang }) {
  const current = lang ?? (await getLang());
  return (
    <form action={setLang} className="flex rounded-full border border-rule p-0.5 text-sm">
      {OPTIONS.map(([value, label]) => (
        <button
          key={value}
          name="lang"
          value={value}
          aria-pressed={current === value}
          className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
            current === value ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </form>
  );
}
