import { Suspense } from "react";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import { registrations, type Registration } from "@/db/schema";
import { CATEGORIES, DISTRICTS, EVENT, regId } from "@/lib/event";
import { getLang } from "@/lib/get-lang";
import { pick, type Lang } from "@/lib/i18n";
import { ArrowDown, Award, Check, CircleCheck, Download, Shirt, UserPlus, type LucideIcon } from "lucide-react";
import { Certificate } from "./certificate";
import { RegisterForm } from "./form";

type T = ReturnType<typeof pick>;

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-lg text-ink-3">…</p>}>
      <RegisterContent />
    </Suspense>
  );
}

async function RegisterContent() {
  await connection(); // Auth.js touches crypto before headers(); mark request-time first.
  const [session, lang] = await Promise.all([auth(), getLang()]);
  const t = pick(lang);
  const email = session?.user?.email?.toLowerCase();
  const reg = email ? await db.query.registrations.findFirst({ where: eq(registrations.email, email) }) : undefined;

  return (
    <main lang={lang} className="mx-auto max-w-xl px-5 py-8">
      <Steps current={!email ? 1 : reg ? 3 : 2} t={t} />
      {!email ? (
        <GoogleSignIn t={t} />
      ) : reg ? (
        <Pass reg={reg} t={t} lang={lang} />
      ) : (
        <section className="border border-rule bg-white/60 p-5">
          <h1 className="font-serif text-3xl leading-tight text-ink">{t("Fill your details", "ଆପଣଙ୍କ ବିବରଣୀ ଦିଅନ୍ତୁ")}</h1>
          <div className="mt-6">
            <RegisterForm defaultName={session?.user?.name ?? ""} lang={lang} />
          </div>
        </section>
      )}
      {email && (
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/register" });
          }}
          className="mt-6 text-center text-sm text-ink-3"
        >
          <p>Gmail: {email}</p>
          <button className="mt-1 py-2 font-semibold text-maroon-700 underline underline-offset-4">
            {t("Use another Gmail", "ଅନ୍ୟ Gmail ବ୍ୟବହାର କରନ୍ତୁ")}
          </button>
        </form>
      )}
    </main>
  );
}

function Steps({ current, t }: { current: number; t: T }) {
  const labels = [t("Login", "ଲଗଇନ"), t("Details", "ବିବରଣୀ"), t("Pass", "ପାସ୍")];
  return (
    <ol className="mb-6 flex items-start justify-between gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < current || current === 3;
        const active = n === current;
        return (
          <li key={n} className="flex flex-1 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
            <span
              className={`flex size-10 items-center justify-center rounded-full text-lg font-bold ${
                done ? "bg-green-600 text-white" : active ? "bg-maroon-700 text-white" : "bg-paper-2 text-ink-3"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`mt-1 text-sm font-semibold ${active || done ? "text-ink" : "text-ink-3"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function GoogleSignIn({ t }: { t: T }) {
  return (
    <section className="border border-rule bg-white/60 p-5">
      <h1 className="font-serif text-3xl leading-tight text-ink">{t("First, login with your Gmail", "ପ୍ରଥମେ Gmail ରେ ଲଗଇନ କରନ୍ତୁ")}</h1>
      <ul className="mt-5 space-y-3 text-ink-2">
        <li className="flex gap-3">
          <ArrowDown className="mt-1 size-5 shrink-0 text-maroon-700" aria-hidden />
          {t("Tap the button below and choose your Gmail", "ତଳ ବଟନ ଦବାନ୍ତୁ ଓ ଆପଣଙ୍କ Gmail ବାଛନ୍ତୁ")}
        </li>
        <li className="flex gap-3">
          <Award className="mt-1 size-5 shrink-0 text-maroon-700" aria-hidden />
          {t("Use the same Gmail later to get your certificate", "ପ୍ରମାଣପତ୍ର ପାଇଁ ପରେ ସେହି Gmail ହିଁ ବ୍ୟବହାର କରିବେ")}
        </li>
      </ul>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/register" });
        }}
      >
        <button className="mt-6 flex h-16 w-full items-center justify-center gap-3 border border-ink bg-white text-lg font-semibold text-ink active:bg-paper-2">
          <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {t("Login with Google", "Google ରେ ଲଗଇନ କରନ୍ତୁ")}
        </button>
      </form>
    </section>
  );
}

async function Pass({ reg, t, lang }: { reg: Registration; t: T; lang: Lang }) {
  const id = regId(reg.id);
  if (reg.attendedAt) {
    return (
      <>
        <section className="border border-green-700/30 bg-green-50 p-5 text-center">
          <CircleCheck className="mx-auto size-12 text-green-700" strokeWidth={1.5} aria-hidden />
          <h1 className="mt-2 font-serif text-3xl text-green-800">{t("Thank you for walking with us!", "ଆମ ସହ ଚାଲିଥିବାରୁ ଧନ୍ୟବାଦ!")}</h1>
        </section>
        <section className="mt-5">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl text-ink">
            <Award className="size-6 text-maroon-700" aria-hidden />
            {t("Your certificate", "ଆପଣଙ୍କ ପ୍ରମାଣପତ୍ର")}
          </h2>
          <Certificate name={reg.name} regId={id} category={reg.category} lang={lang} />
        </section>
      </>
    );
  }

  const qr = await QRCode.toDataURL(id, { width: 480, margin: 1, color: { dark: "#70161b" } });
  const category = CATEGORIES.find((c) => c.value === reg.category);
  const district = DISTRICTS.find((d) => d.value === reg.district);

  return (
    <>
      <section className="border border-green-700/30 bg-green-50 p-5 text-center">
        <CircleCheck className="mx-auto size-12 text-green-700" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-2 font-serif text-3xl text-green-800">{t("Registration successful!", "ପଞ୍ଜୀକରଣ ସଫଳ ହେଲା!")}</h1>
      </section>

      <section className="mt-5 overflow-hidden border border-rule bg-white/60">
        <div className="bg-maroon-700 px-5 py-3 text-center text-white">
          <p className="font-serif text-lg">{t(EVENT.name, EVENT.nameOd)}</p>
          <p className="text-sm text-maroon-100">{t(EVENT.date, EVENT.dateOd)}</p>
        </div>
        <div className="p-5 text-center">
          <p className="font-serif text-3xl leading-tight text-ink">{reg.name}</p>
          <p className="text-ink-3">
            {category ? t(category.value, category.od) : reg.category} ·{" "}
            {district ? t(district.value, district.od) : reg.district}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, nothing to optimise */}
          <img src={qr} alt={`Entry pass QR for ${id}`} className="mx-auto mt-4 size-44" />
          <p className="font-mono text-lg font-bold tracking-wider text-maroon-800">{id}</p>
        </div>
      </section>

      <section className="mt-5 border border-gold-400/50 bg-gold-100 p-5">
        <p className="font-bold text-ink">{t("On event day, tell this number at the gate:", "ପଦଯାତ୍ରା ଦିନ ଗେଟରେ ଏହି ନମ୍ବର କୁହନ୍ତୁ:")}</p>
        <p className="mt-3 bg-white py-3 text-center font-mono text-3xl font-bold tracking-widest text-ink">
          {reg.mobile}
        </p>
      </section>

      <a
        href={qr}
        download={`${id}.png`}
        className="mt-5 flex items-center justify-center gap-3 bg-maroon-700 px-6 py-5 text-lg font-semibold text-white shadow-[0_4px_0_0_var(--color-maroon-900)] transition hover:bg-maroon-800 active:translate-y-1 active:shadow-none"
      >
        <Download className="size-6" aria-hidden />
        {t("Download pass", "ପାସ୍ ଡାଉନଲୋଡ କରନ୍ତୁ")}
      </a>
      <p className="mt-3 text-center text-sm text-ink-3">{t("or take a screenshot of this page", "କିମ୍ବା ଏହି ପୃଷ୍ଠାର ସ୍କ୍ରିନସଟ ନିଅନ୍ତୁ")}</p>

      <section className="mt-5 border border-rule bg-white/60 p-5">
        <h2 className="font-bold text-ink">{t("What next?", "ପରବର୍ତ୍ତୀ କଣ?")}</h2>
        <ol className="mt-3 space-y-3">
          <Track done icon={UserPlus} text={t("Registered", "ପଞ୍ଜୀକରଣ ହୋଇଗଲା")} />
          <Track done={false} icon={Shirt} text={t("Check in at the gate, get T-shirt & cap", "ଗେଟରେ ହାଜିରା ଦିଅନ୍ତୁ, ଟି-ସାର୍ଟ ଓ ଟୋପି ନିଅନ୍ତୁ")} />
          <Track done={false} icon={Award} text={t("Certificate unlocks here after gate check-in", "ଗେଟରେ ହାଜିରା ପରେ ପ୍ରମାଣପତ୍ର ଏଠାରେ ମିଳିବ")} />
        </ol>
      </section>
    </>
  );
}

function Track({ done, icon: Icon, text }: { done: boolean; icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-green-700 text-white" : "bg-paper-2 text-ink-3"}`}
        aria-hidden
      >
        {done ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
      </span>
      <span className={`font-semibold ${done ? "text-green-800" : "text-ink"}`}>{text}</span>
    </li>
  );
}
