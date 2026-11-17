"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const ODIA_DIGITS = "୦୧୨୩୪୫୬୭୮୯";
const pad = (n: number, odia: boolean) => {
  const s = String(n).padStart(2, "0");
  return odia ? s.replace(/\d/g, (d) => ODIA_DIGITS[+d]) : s;
};

export function Countdown({
  startsAt,
  odia,
  labels,
  title,
  doneText,
}: {
  startsAt: string;
  odia: boolean;
  labels: [string, string, string, string];
  title: string;
  doneText: string;
}) {
  // null until mounted, so server and client HTML match.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const left = now === null ? null : Math.max(0, new Date(startsAt).getTime() - now);
  if (left === 0) return <p className="border-y border-rule py-4 font-serif text-3xl">{doneText}</p>;

  const s = left === null ? null : Math.floor(left / 1000);
  const parts = s === null ? null : [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];

  return (
    <div className="border-y border-rule py-4">
      <p className="text-[11px] font-medium tracking-[0.2em] text-ink-3 uppercase">{title}</p>
      <div className="mt-2 grid grid-cols-4 divide-x divide-rule">
        {labels.map((label, i) => (
          <div key={label} className="px-3 first:pl-0">
            <span className="block font-serif text-5xl leading-none tabular-nums">{parts ? pad(parts[i], odia) : "––"}</span>
            <span className="mt-1 block text-xs text-ink-3">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mobile-only Register bar that slides up once the hero's button has scrolled away. */
export function StickyRegister({ label, watchId }: { label: string; watchId: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper/95 p-3 backdrop-blur-md transition-transform duration-500 ease-out md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <Link
        href="/register"
        tabIndex={show ? 0 : -1}
        className="flex items-center justify-between bg-maroon-700 px-5 py-4 text-lg font-semibold text-white active:bg-maroon-800"
      >
        {label}
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
