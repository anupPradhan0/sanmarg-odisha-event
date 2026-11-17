import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight, Award, Download, HeartPulse, Plus, Shirt, Sun, UserPlus } from "lucide-react";
import { EVENT } from "@/lib/event";
import { getLang } from "@/lib/get-lang";
import { pick } from "@/lib/i18n";
import { Countdown, StickyRegister } from "./home-widgets";
import { RouteMap } from "./route-map/route-map";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function Kicker({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">
      <span className="font-serif text-base tracking-normal">{n}</span>
      <span className="h-px w-8 bg-maroon-700/40" />
      {children}
    </p>
  );
}

async function HomeContent() {
  const lang = await getLang();
  const t = pick(lang);
  const odia = lang === "or";

  const headline = odia ? ["ସୁସ୍ଥ ଓଡ଼ିଶା", "ପାଇଁ ଆସନ୍ତୁ", "ଚାଲିବା।"] : ["Walk for a", "healthier", "Odisha."];
  const accentLine = odia ? 0 : 1;

  const ticker = [
    t("Registrations open", "ପଞ୍ଜୀକରଣ ଚାଲିଛି"),
    t("Free entry", "ମାଗଣା ପ୍ରବେଶ"),
    t("T-shirt & cap for every walker", "ପ୍ରତ୍ୟେକଙ୍କୁ ଟି-ସାର୍ଟ ଓ ଟୋପି"),
    t("Certificate on your phone", "ଫୋନରେ ପ୍ରମାଣପତ୍ର"),
    t(EVENT.date, EVENT.dateOd),
  ];

  const facts = [
    { big: "₹0", text: t("Entry, T-shirt, cap and certificate — all free", "ପ୍ରବେଶ, ଟି-ସାର୍ଟ, ଟୋପି ଓ ପ୍ରମାଣପତ୍ର — ସବୁ ମାଗଣା") },
    { big: odia ? "୭:୦୦" : "7:00", text: t("AM flag-off on 1 December", "ସକାଳେ ପଦଯାତ୍ରା ଆରମ୍ଭ, ୧ ଡିସେମ୍ବର") },
    { big: odia ? "୧ ମି." : "1 min", text: t("To register on your phone", "ଫୋନରେ ପଞ୍ଜୀକରଣ ପାଇଁ") },
  ];

  const perks = [
    { icon: Shirt, title: t("T-shirt", "ଟି-ସାର୍ଟ"), text: t("With the Sanmarg Odisha logo, free at the gate.", "ସନ୍ମାର୍ଗ ଓଡ଼ିଶା ଲୋଗୋ ସହିତ, ଗେଟରେ ମାଗଣା।") },
    { icon: Sun, title: t("Cap", "ଟୋପି"), text: t("Keeps the morning sun off while you walk.", "ଚାଲିବା ବେଳେ ସକାଳ ଖରାରୁ ରକ୍ଷା।") },
    { icon: Award, title: t("Certificate", "ପ୍ରମାଣପତ୍ର"), text: t("Your name, printed. Download it on your phone.", "ଆପଣଙ୍କ ନାମ ସହିତ। ଫୋନରେ ଡାଉନଲୋଡ କରନ୍ତୁ।") },
    { icon: HeartPulse, title: t("A healthy morning", "ସୁସ୍ଥ ସକାଳ"), text: t("Walk alongside thousands from across Odisha.", "ଓଡ଼ିଶାର ହଜାର ହଜାର ଲୋକଙ୍କ ସହ ଚାଲନ୍ତୁ।") },
  ];

  const steps = [
    { icon: UserPlus, title: t("Register", "ପଞ୍ଜୀକରଣ"), text: t("Sign in with Gmail and fill four details. Takes a minute.", "Gmail ରେ ଲଗଇନ କରି ଚାରୋଟି ବିବରଣୀ ଦିଅନ୍ତୁ। ଏକ ମିନିଟ ଲାଗେ।") },
    { icon: Shirt, title: t("Check in", "ହାଜିରା"), text: t("On event day, tell your mobile number at the gate and collect your T-shirt and cap.", "ପଦଯାତ୍ରା ଦିନ ଗେଟରେ ମୋବାଇଲ ନମ୍ବର କୁହନ୍ତୁ, ଟି-ସାର୍ଟ ଓ ଟୋପି ନିଅନ୍ତୁ।") },
    { icon: Download, title: t("Certificate", "ପ୍ରମାଣପତ୍ର"), text: t("Sign in again with the same Gmail and download it.", "ସେହି Gmail ରେ ପୁଣି ଲଗଇନ କରି ଡାଉନଲୋଡ କରନ୍ତୁ।") },
  ];

  // Assumption: timings until Sanmarg Odisha confirms the schedule.
  const schedule = [
    { time: odia ? "୬:୩୦" : "6:30", text: t("Reach the venue, check in at the gate", "ସ୍ଥାନରେ ପହଞ୍ଚନ୍ତୁ, ଗେଟରେ ହାଜିରା ଦିଅନ୍ତୁ") },
    { time: odia ? "୭:୦୦" : "7:00", text: t("Flag-off. The walk begins", "ପଦଯାତ୍ରା ଆରମ୍ଭ") },
    { time: odia ? "୧୦:୦୦" : "10:00", text: t("Walk ends", "ପଦଯାତ୍ରା ସମାପ୍ତ") },
  ];

  const faqs = [
    [t("Is it really free?", "ଏହା ସତରେ ମାଗଣା କି?"), t("Yes. Registration, T-shirt, cap and certificate are all free.", "ହଁ। ପଞ୍ଜୀକରଣ, ଟି-ସାର୍ଟ, ଟୋପି ଓ ପ୍ରମାଣପତ୍ର ସବୁ ମାଗଣା।")],
    [t("Who can join?", "କିଏ ଯୋଗ ଦେଇପାରିବେ?"), t("Everyone — students, teachers, families and senior citizens.", "ସମସ୍ତେ — ଛାତ୍ରଛାତ୍ରୀ, ଶିକ୍ଷକ, ପରିବାର ଓ ବରିଷ୍ଠ ନାଗରିକ।")],
    [
      t("What should I bring?", "କଣ ନେଇ ଆସିବି?"),
      t("Just remember your mobile number. Wear comfortable shoes and carry water.", "କେବଳ ଆପଣଙ୍କ ମୋବାଇଲ ନମ୍ବର ମନେ ରଖନ୍ତୁ। ଆରାମଦାୟକ ଜୋତା ପିନ୍ଧନ୍ତୁ ଓ ପାଣି ନେଇ ଆସନ୍ତୁ।"),
    ],
    [
      t("How do I get my certificate?", "ପ୍ରମାଣପତ୍ର କିପରି ପାଇବି?"),
      t(
        "After you check in at the gate, sign in on this website with the same Gmail and download it.",
        "ଗେଟରେ ହାଜିରା ପରେ, ଏହି ୱେବସାଇଟରେ ସେହି Gmail ରେ ଲଗଇନ କରି ଡାଉନଲୋଡ କରନ୍ତୁ।",
      ),
    ],
    [
      t("I don't have Gmail. What do I do?", "ମୋର Gmail ନାହିଁ, କଣ କରିବି?"),
      t(
        "Most Android phones already have one — it is the account you use for Play Store. If not, make one free at gmail.com.",
        "ଅଧିକାଂଶ Android ଫୋନରେ Gmail ପୂର୍ବରୁ ଅଛି — Play Store ପାଇଁ ବ୍ୟବହାର କରୁଥିବା ଆକାଉଣ୍ଟ। ନଥିଲେ gmail.com ରେ ମାଗଣାରେ ତିଆରି କରନ୍ତୁ।",
      ),
    ],
    [
      t("Can my family register from my phone?", "ମୋ ପରିବାର ମୋ ଫୋନରୁ ପଞ୍ଜୀକରଣ କରିପାରିବେ କି?"),
      t(
        "Yes. Each person needs their own Gmail. After one registration, tap “Use another Gmail”.",
        "ହଁ। ପ୍ରତ୍ୟେକଙ୍କ ପାଇଁ ଅଲଗା Gmail ଦରକାର। ଜଣଙ୍କ ପଞ୍ଜୀକରଣ ପରେ “ଅନ୍ୟ Gmail ବ୍ୟବହାର କରନ୍ତୁ” ଦବାନ୍ତୁ।",
      ),
    ],
  ];

  const registerLabel = t("Register — it's free", "ପଞ୍ଜୀକରଣ କରନ୍ତୁ — ମାଗଣା");
  const h2 = `mt-4 font-serif tracking-tight sm:text-5xl ${odia ? "text-4xl leading-tight" : "text-[2.6rem] leading-[1.02]"}`;

  return (
    <main lang={lang}>
      {/* Ticker */}
      <div className="overflow-hidden bg-ink text-paper" aria-hidden>
        <div className="flex w-max animate-marquee py-2.5 text-[11px] font-medium tracking-[0.2em] uppercase">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex">
              {ticker.map((item) => (
                <span key={item} className="flex items-center gap-6 pr-6">
                  {item}
                  <span className="size-1 bg-gold-400" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-8 lg:grid lg:grid-cols-12 lg:gap-12 lg:pt-16">
        <div className="lg:col-span-5 lg:pt-6">
          <p className="flex animate-rise items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-ink-2 uppercase">
            <span className="size-2 animate-blink rounded-full bg-maroon-700" />
            {t(EVENT.name, EVENT.nameOd)}
          </p>

          <h1
            className={`mt-5 font-serif tracking-tight ${
              odia ? "text-[2.9rem] leading-[1.25] sm:text-6xl" : "text-[3.6rem] leading-[0.95] sm:text-7xl"
            }`}
          >
            {headline.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <span
                  className={`block animate-line ${i === accentLine ? `text-maroon-700 ${odia ? "" : "italic"}` : ""}`}
                  style={{ animationDelay: `${150 + i * 110}ms` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-md animate-rise text-lg leading-relaxed text-ink-2 [animation-delay:500ms]">
            {t(
              `Join us on ${EVENT.date} in ${EVENT.place}. Register free, walk with us, and take home a T-shirt, a cap and your certificate.`,
              `${EVENT.dateOd}ରେ ${EVENT.placeOd}ରେ ଆମ ସହ ଯୋଗ ଦିଅନ୍ତୁ। ମାଗଣାରେ ପଞ୍ଜୀକରଣ କରନ୍ତୁ, ଚାଲନ୍ତୁ, ଏବଂ ଟି-ସାର୍ଟ, ଟୋପି ଓ ପ୍ରମାଣପତ୍ର ନିଅନ୍ତୁ।`,
            )}
          </p>

          <div className="mt-7 animate-rise [animation-delay:600ms]">
            <Countdown
              startsAt={EVENT.startsAt}
              odia={odia}
              title={t("Walk starts in", "ପଦଯାତ୍ରା ଆରମ୍ଭ ହେବାକୁ ବାକି")}
              labels={[t("days", "ଦିନ"), t("hours", "ଘଣ୍ଟା"), t("min", "ମିନିଟ"), t("sec", "ସେକେଣ୍ଡ")]}
              doneText={t("Today is the day. See you there.", "ଆଜି ପଦଯାତ୍ରା ଦିନ। ସେଠାରେ ଦେଖା ହେବା।")}
            />
          </div>

          <div className="mt-7 animate-rise [animation-delay:700ms]">
            <Link
              id="hero-register"
              href="/register"
              className="group flex items-center justify-between bg-maroon-700 px-6 py-5 text-lg font-semibold text-white transition-colors hover:bg-maroon-800 active:bg-maroon-900"
            >
              {registerLabel}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-3">{t("Takes 1 minute · needs Gmail", "୧ ମିନିଟ ଲାଗେ · Gmail ଦରକାର")}</span>
              <Link href="/register" className="inline-flex items-center gap-1 font-medium underline decoration-rule underline-offset-4 hover:decoration-ink">
                {t("See my pass", "ମୋ ପାସ୍")}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="-mx-5 mt-12 animate-rise [animation-delay:300ms] lg:col-span-7 lg:mx-0 lg:mt-0">
          <RouteMap
            bbsr={t("Bhubaneswar", "ଭୁବନେଶ୍ୱର")}
            ctc={t("Cuttack", "କଟକ")}
            river={t("Mahanadi", "ମହାନଦୀ")}
            caption={t("Fig. 1 — Bhubaneswar to Cuttack", "ଚିତ୍ର ୧ — ଭୁବନେଶ୍ୱରରୁ କଟକ")}
            kmLabel={t("of 26.2 by road", "ସଡ଼କରେ ୨୬.୨ ରୁ")}
            hint={t("Drag to turn the map", "ମାନଚିତ୍ର ଘୁରାଇବାକୁ ଟାଣନ୍ତୁ")}
          />
        </div>
      </section>

      {/* Facts */}
      <section className="mx-auto mt-16 max-w-6xl px-5">
        <dl className="grid divide-y divide-rule border-y border-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {facts.map((f) => (
            <div key={f.big} className="reveal flex items-baseline gap-5 py-6 sm:block sm:px-6 sm:first:pl-0">
              <dt className="w-28 shrink-0 font-serif text-5xl leading-none text-maroon-700 sm:w-auto sm:text-6xl">{f.big}</dt>
              <dd className="text-ink-2 sm:mt-3">{f.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* What you get */}
      <section className="mx-auto mt-20 max-w-6xl px-5 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="reveal lg:col-span-4">
          <Kicker n="01">{t("What you get", "ଆପଣ କଣ ପାଇବେ")}</Kicker>
          <h2 className={h2}>{t("Walk in. Walk away with all of this.", "ଆସନ୍ତୁ, ଚାଲନ୍ତୁ — ଏସବୁ ନେଇ ଯାଆନ୍ତୁ।")}</h2>
        </div>
        <ul className="mt-8 border-t border-ink lg:col-span-8 lg:mt-0">
          {perks.map((p, i) => (
            <li key={p.title} className="reveal group flex items-start gap-5 border-b border-rule py-6">
              <span className="w-8 shrink-0 pt-1 font-serif text-lg text-ink-3">0{i + 1}</span>
              <div className="flex-1">
                <h3 className="font-serif text-3xl leading-tight">{p.title}</h3>
                <p className="mt-1 text-ink-2">{p.text}</p>
              </div>
              <p.icon
                className="mt-1 size-7 shrink-0 text-maroon-700 transition-transform duration-500 group-hover:-rotate-12"
                strokeWidth={1.25}
                aria-hidden
              />
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="mt-20 bg-paper-2/70 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <Kicker n="02">{t("How it works", "କିପରି?")}</Kicker>
            <h2 className={h2}>{t("Three steps. That's all.", "କେବଳ ତିନୋଟି ଧାପ।")}</h2>
          </div>
          <ol className="mt-10 grid gap-px bg-rule sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="reveal bg-paper p-6">
                <div className="flex items-start justify-between">
                  <span className="font-serif text-7xl leading-none text-maroon-700">{odia ? "୧୨୩"[i] : i + 1}</span>
                  <s.icon className="size-6 text-ink-3" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mt-8 font-serif text-3xl">{s.title}</h3>
                <p className="mt-2 text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Event day */}
      <section className="mx-auto mt-20 max-w-6xl px-5 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="reveal lg:col-span-4">
          <Kicker n="03">{t("Event day", "ପଦଯାତ୍ରା ଦିନ")}</Kicker>
          <h2 className={h2}>{t(`The morning of ${EVENT.date}`, `${EVENT.dateOd}ର ସକାଳ`)}</h2>
        </div>
        <ol className="mt-8 border-t border-ink lg:col-span-8 lg:mt-0">
          {schedule.map((s) => (
            <li key={s.time} className="reveal flex items-baseline gap-6 border-b border-rule py-5">
              <span className="w-28 shrink-0 font-serif text-4xl tabular-nums">
                {s.time}
                <span className="ml-1 text-sm text-ink-3">{t("AM", "ସକାଳ")}</span>
              </span>
              <span className="text-lg text-ink-2">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-6xl px-5 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="reveal lg:col-span-4">
          <Kicker n="04">{t("Questions", "ପ୍ରଶ୍ନ")}</Kicker>
          <h2 className={h2}>{t("Good to know", "ଜାଣିବା ଦରକାର")}</h2>
        </div>
        <div className="mt-8 border-t border-ink lg:col-span-8 lg:mt-0">
          {faqs.map(([q, a]) => (
            <details key={q} className="group border-b border-rule">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <Plus className="size-5 shrink-0 text-maroon-700 transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="max-w-xl pb-5 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mt-24 bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:flex lg:items-end lg:justify-between lg:py-24">
          <h2 className={`reveal font-serif tracking-tight sm:text-7xl ${odia ? "text-5xl leading-tight" : "text-[3.2rem] leading-none"}`}>
            {t("See you on", "ଦେଖା ହେବା")}
            <br />
            <span className={`text-gold-400 ${odia ? "" : "italic"}`}>{t("1 December.", "୧ ଡିସେମ୍ବରରେ।")}</span>
          </h2>
          <Link
            href="/register"
            className="group mt-10 flex items-center justify-between gap-8 bg-paper px-6 py-5 text-lg font-semibold text-ink transition-colors hover:bg-gold-300 lg:mt-0"
          >
            {registerLabel}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>

      <div className="h-24 bg-ink md:hidden" aria-hidden />
      <StickyRegister label={registerLabel} watchId="hero-register" />
    </main>
  );
}
