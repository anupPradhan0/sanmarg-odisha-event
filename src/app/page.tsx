import Link from "next/link";
import { EVENT } from "@/lib/event";

const STEPS = [
  { icon: "📝", od: "ଫୋନରେ ପଞ୍ଜୀକରଣ କରନ୍ତୁ", en: "Register on your phone — free, 1 minute" },
  { icon: "👕", od: "ପଦଯାତ୍ରା ଦିନ ଗେଟରେ ମୋବାଇଲ ନମ୍ବର କୁହନ୍ତୁ, ଟି-ସାର୍ଟ ଓ ଟୋପି ନିଅନ୍ତୁ", en: "On event day, tell your mobile number at the gate. Get your T-shirt and cap." },
  { icon: "📜", od: "ପ୍ରମାଣପତ୍ର ଡାଉନଲୋଡ କରନ୍ତୁ", en: "Download your certificate" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-5">
      <section className="pt-10 pb-8 text-center">
        <h1 className="font-serif text-3xl leading-snug font-bold text-maroon-800">{EVENT.nameOd}</h1>
        <p className="mt-1 text-lg text-slate-600">{EVENT.name}</p>

        <div className="mt-6 flex flex-col gap-2 text-left">
          <p className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-2xl" aria-hidden>📅</span>
            <span>
              <span className="block font-semibold text-slate-900">{EVENT.dateOd}</span>
              <span className="text-sm text-slate-500">{EVENT.date}</span>
            </span>
          </p>
          <p className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-2xl" aria-hidden>📍</span>
            <span>
              <span className="block font-semibold text-slate-900">{EVENT.placeOd}</span>
              <span className="text-sm text-slate-500">{EVENT.place}</span>
            </span>
          </p>
        </div>

        <Link
          href="/register"
          className="mt-6 block rounded-2xl bg-maroon-700 px-6 py-5 text-white shadow-md active:bg-maroon-800"
        >
          <span className="block text-2xl font-bold">ପଞ୍ଜୀକରଣ କରନ୍ତୁ</span>
          <span className="text-base text-maroon-100">Register now — free</span>
        </Link>
        <Link href="/register" className="mt-4 inline-block py-2">
          <span className="font-semibold text-maroon-700 underline underline-offset-4">ପୂର୍ବରୁ ପଞ୍ଜୀକରଣ କରିଛନ୍ତି? ପାସ୍ ଦେଖନ୍ତୁ</span>
          <span className="block text-sm text-slate-500">Already registered? See your pass</span>
        </Link>
      </section>

      <section className="pb-10">
        <h2 className="text-center text-xl font-bold text-slate-900">
          କିପରି? <span className="font-normal text-slate-500">· How it works</span>
        </h2>
        <ol className="mt-5 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.en} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gold-100 text-3xl" aria-hidden>
                {s.icon}
              </span>
              <span>
                <span className="text-sm font-bold text-maroon-700">ଧାପ {i + 1} · Step {i + 1}</span>
                <span className="block font-semibold text-slate-900">{s.od}</span>
                <span className="block text-sm text-slate-500">{s.en}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
