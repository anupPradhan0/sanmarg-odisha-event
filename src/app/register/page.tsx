import { Suspense } from "react";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import { registrations, type Registration } from "@/db/schema";
import { CATEGORIES, EVENT, regId } from "@/lib/event";
import { RegisterForm } from "./form";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <Suspense fallback={<p className="py-16 text-center text-lg text-slate-500">ଅପେକ୍ଷା କରନ୍ତୁ… · Please wait…</p>}>
        <RegisterContent />
      </Suspense>
    </main>
  );
}

async function RegisterContent() {
  await connection(); // Auth.js touches crypto before headers(); mark request-time first.
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return (
      <>
        <Steps current={1} />
        <GoogleSignIn />
      </>
    );
  }

  const reg = await db.query.registrations.findFirst({ where: eq(registrations.email, email) });
  return (
    <>
      <Steps current={reg ? 3 : 2} />
      {reg ? (
        <Pass reg={reg} />
      ) : (
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <Heading od="ଆପଣଙ୍କ ବିବରଣୀ ଦିଅନ୍ତୁ" en="Fill your details" />
          <div className="mt-6">
            <RegisterForm defaultName={session?.user?.name ?? ""} />
          </div>
        </section>
      )}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/register" });
        }}
        className="mt-6 text-center text-sm text-slate-500"
      >
        <p>Gmail: {email}</p>
        <button className="mt-1 py-2 font-semibold text-maroon-700 underline underline-offset-4">
          ଅନ୍ୟ Gmail ବ୍ୟବହାର କରନ୍ତୁ · Use another Gmail
        </button>
      </form>
    </>
  );
}

function Heading({ od, en }: { od: string; en: string }) {
  return (
    <h1>
      <span className="block text-2xl font-bold text-slate-900">{od}</span>
      <span className="text-slate-500">{en}</span>
    </h1>
  );
}

const STEP_LABELS = [
  { od: "ଲଗଇନ", en: "Login" },
  { od: "ବିବରଣୀ", en: "Details" },
  { od: "ପାସ୍", en: "Pass" },
];

function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex items-start justify-between gap-2">
      {STEP_LABELS.map((s, i) => {
        const n = i + 1;
        const done = n < current || current === 3;
        const active = n === current;
        return (
          <li key={s.en} className="flex flex-1 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
            <span
              className={`flex size-10 items-center justify-center rounded-full text-lg font-bold ${
                done ? "bg-green-600 text-white" : active ? "bg-maroon-700 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`mt-1 text-sm font-semibold ${active || done ? "text-slate-900" : "text-slate-400"}`}>{s.od}</span>
            <span className="text-xs text-slate-500">{s.en}</span>
          </li>
        );
      })}
    </ol>
  );
}

function GoogleSignIn() {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <Heading od="ପ୍ରଥମେ Gmail ରେ ଲଗଇନ କରନ୍ତୁ" en="First, login with your Gmail" />
      <ul className="mt-5 space-y-3 text-slate-700">
        <li className="flex gap-3">
          <span className="text-2xl" aria-hidden>👇</span>
          <span>
            ତଳ ବଟନ ଦବାନ୍ତୁ ଓ ଆପଣଙ୍କ Gmail ବାଛନ୍ତୁ
            <span className="block text-sm text-slate-500">Tap the button below and choose your Gmail</span>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-2xl" aria-hidden>📜</span>
          <span>
            ପ୍ରମାଣପତ୍ର ପାଇଁ ପରେ ସେହି Gmail ହିଁ ବ୍ୟବହାର କରିବେ
            <span className="block text-sm text-slate-500">Use the same Gmail later to get your certificate</span>
          </span>
        </li>
      </ul>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/register" });
        }}
      >
        <button className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white text-slate-800 shadow-sm active:bg-slate-50">
          <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          <span className="text-left">
            <span className="block text-lg font-bold">Google ରେ ଲଗଇନ କରନ୍ତୁ</span>
            <span className="block text-sm font-normal text-slate-500">Login with Google</span>
          </span>
        </button>
      </form>
    </section>
  );
}

async function Pass({ reg }: { reg: Registration }) {
  const id = regId(reg.id);
  const qr = await QRCode.toDataURL(id, { width: 480, margin: 1, color: { dark: "#70161b" } });
  const category = CATEGORIES.find((c) => c.value === reg.category);

  return (
    <>
      <section className="rounded-3xl bg-green-50 p-5 text-center ring-1 ring-green-200">
        <p className="text-5xl" aria-hidden>✅</p>
        <h1 className="mt-2 text-2xl font-bold text-green-800">ପଞ୍ଜୀକରଣ ସଫଳ ହେଲା!</h1>
        <p className="text-green-800">Registration successful</p>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="bg-maroon-700 px-5 py-3 text-center text-white">
          <p className="font-serif font-bold">{EVENT.name}</p>
          <p className="text-sm text-maroon-100">{EVENT.dateOd} · {EVENT.date}</p>
        </div>
        <div className="p-5 text-center">
          <p className="text-2xl font-bold text-slate-900">{reg.name}</p>
          <p className="text-slate-500">
            {category?.icon} {category?.od ?? reg.category} · {reg.district}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, nothing to optimise */}
          <img src={qr} alt={`Entry pass QR for ${id}`} className="mx-auto mt-4 size-44" />
          <p className="font-mono text-lg font-bold tracking-wider text-maroon-800">{id}</p>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-gold-100 p-5">
        <p className="font-bold text-slate-900">ପଦଯାତ୍ରା ଦିନ ଗେଟରେ ଏହି ନମ୍ବର କୁହନ୍ତୁ:</p>
        <p className="text-sm text-slate-600">On event day, tell this number at the gate:</p>
        <p className="mt-3 rounded-2xl bg-white py-3 text-center font-mono text-3xl font-bold tracking-widest text-slate-900">
          {reg.mobile}
        </p>
      </section>

      <a
        href={qr}
        download={`${id}.png`}
        className="mt-5 block rounded-2xl bg-maroon-700 py-4 text-center text-white shadow-md active:bg-maroon-800"
      >
        <span className="block text-xl font-bold">ପାସ୍ ଡାଉନଲୋଡ କରନ୍ତୁ</span>
        <span className="text-sm text-maroon-100">Download pass · or take a screenshot</span>
      </a>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">
          ପରବର୍ତ୍ତୀ କଣ? <span className="font-normal text-slate-500">· What next?</span>
        </h2>
        <ol className="mt-3 space-y-3">
          <Track done icon="📝" od="ପଞ୍ଜୀକରଣ ହୋଇଗଲା" en="Registered" />
          <Track done={!!reg.attendedAt} icon="👕" od="ଗେଟରେ ହାଜିରା ଓ ଟି-ସାର୍ଟ, ଟୋପି" en="Check in at gate, get T-shirt & cap" />
          <Track done={false} icon="📜" od="ପ୍ରମାଣପତ୍ର ଡାଉନଲୋଡ" en="Download certificate (after check-in)" />
        </ol>
      </section>
    </>
  );
}

function Track({ done, icon, od, en }: { done: boolean; icon: string; od: string; en: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl ${done ? "bg-green-100" : "bg-slate-100 grayscale"}`}
        aria-hidden
      >
        {done ? "✅" : icon}
      </span>
      <span>
        <span className={`block font-semibold ${done ? "text-green-800" : "text-slate-900"}`}>{od}</span>
        <span className="text-sm text-slate-500">{en}</span>
      </span>
    </li>
  );
}
