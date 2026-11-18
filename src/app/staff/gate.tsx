"use client";

import jsQR from "jsqr";
import { Camera, Check, ChevronRight, CircleAlert, Delete, Hash, RotateCcw, ScanLine, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { checkIn, lookup, scanPass, type CheckInResult, type Person } from "./actions";

type Shown = CheckInResult | { status: "error"; person?: undefined; code?: string };

const POPUP_MS = 2000;
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function Gate({ checkedIn }: { checkedIn: number }) {
  const [tab, setTab] = useState<"scan" | "number">("scan");
  const [result, setResult] = useState<Shown | null>(null);
  const [count, setCount] = useState(checkedIn);
  const [seq, setSeq] = useState(0); // remounts the popup so its 2 s timer bar restarts for every result

  const show = useCallback((r: Shown) => {
    setResult(r);
    setSeq((n) => n + 1);
    if (r.status === "done") setCount((c) => c + 1);
    navigator.vibrate?.(r.status === "done" ? 60 : [80, 60, 80]);
  }, []);
  const close = useCallback(() => setResult(null), []);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(close, POPUP_MS);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [result, close]);

  return (
    <>
      <div className="grid grid-cols-2 border border-ink p-1" role="tablist">
        {(
          [
            ["scan", "Scan QR", ScanLine],
            ["number", "Enter number", Hash],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex touch-manipulation items-center justify-center gap-2 py-3.5 text-[15px] font-semibold whitespace-nowrap transition-colors sm:text-base ${
              tab === key ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 sm:mt-5">{tab === "scan" ? <Scanner paused={!!result} onResult={show} /> : <NumberEntry onResult={show} />}</div>

      <Link
        href="/staff/mine"
        className="mt-6 flex touch-manipulation items-center justify-between gap-3 border border-ink px-4 py-4 hover:bg-ink hover:text-paper sm:px-5"
      >
        <span>
          <span className="block text-[11px] font-medium tracking-[0.18em] uppercase opacity-70">My check-ins</span>
          <span className="mt-1 block whitespace-nowrap sm:text-lg">
            <span className="font-serif text-3xl tabular-nums">{count.toLocaleString("en-IN")}</span> {count === 1 ? "person" : "people"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold whitespace-nowrap">
          See list <ChevronRight className="size-5" aria-hidden />
        </span>
      </Link>

      {result && <ResultPopup key={seq} result={result} onClose={close} />}
    </>
  );
}

function Scanner({ paused, onResult }: { paused: boolean; onResult: (r: Shown) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(paused);
  const [camera, setCamera] = useState<"starting" | "on" | "error">("starting");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let wakeLock: WakeLockSentinel | undefined;
    let raf = 0;
    let stopped = false;
    let lastTick = 0;
    let inFlight = false;
    let last = { code: "", at: 0 };
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      if (!video || now - lastTick < 120 || pausedRef.current || inFlight || video.readyState < 2) return;
      lastTick = now;
      // Decode a centre square, downscaled: plenty for a phone-screen QR and cheap on low-end phones.
      const size = Math.min(video.videoWidth, video.videoHeight);
      const side = Math.round(Math.min(size, 480));
      canvas.width = canvas.height = side;
      ctx.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, side, side);
      const code = jsQR(ctx.getImageData(0, 0, side, side).data, side, side, { inversionAttempts: "dontInvert" })?.data;
      if (!code || (code === last.code && now - last.at < 4000)) return;
      last = { code, at: now };
      inFlight = true;
      setBusy(true);
      scanPass(code)
        .then(onResult, () => onResult({ status: "error" }))
        .finally(() => {
          inFlight = false;
          setBusy(false);
        });
    };

    // Wrapped so a missing mediaDevices (plain-HTTP origins) lands in the same catch as a denied permission.
    Promise.resolve()
      .then(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false }))
      .then(async (s) => {
        stream = s;
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play();
        setCamera("on");
        raf = requestAnimationFrame(tick);
        wakeLock = await navigator.wakeLock?.request("screen").catch(() => undefined);
        if (stopped) wakeLock?.release().catch(() => {});
      })
      .catch(() => {
        if (!stopped) setCamera("error");
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      wakeLock?.release().catch(() => {});
    };
  }, [onResult, attempt]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[58svh] overflow-hidden bg-ink">
      <video ref={videoRef} playsInline muted className="size-full object-cover" />

      {camera === "on" && (
        <div className="pointer-events-none absolute inset-[14%]" aria-hidden>
          {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "bottom-0 right-0 border-b-4 border-r-4"].map(
            (c) => (
              <span key={c} className={`absolute size-8 border-gold-400 sm:size-10 ${c}`} />
            ),
          )}
          {!paused && <span className="absolute inset-x-2 h-0.5 animate-scan bg-gold-400 shadow-[0_0_12px_2px_var(--color-gold-400)]" />}
        </div>
      )}

      <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-10 text-center text-sm font-medium text-paper">
        {busy ? "Checking…" : camera === "on" ? "Point at the participant's QR pass" : ""}
      </p>

      {camera === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper/80">
          <Camera className="size-10 animate-pulse" aria-hidden />
          Starting camera…
        </div>
      )}
      {camera === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-paper sm:p-8">
          <Camera className="size-10 text-gold-400" aria-hidden />
          <p>Camera not available. Allow camera access in the browser, or use “Enter number”.</p>
          <button
            onClick={() => {
              setCamera("starting");
              setAttempt((a) => a + 1);
            }}
            className="inline-flex touch-manipulation items-center gap-2 bg-paper px-5 py-3 font-semibold text-ink"
          >
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "find"] as const;

function NumberEntry({ onResult }: { onResult: (r: Shown) => void }) {
  const [value, setValue] = useState("");
  const [people, setPeople] = useState<Person[] | null>(null);
  const [searched, setSearched] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Laptops type on their keyboard; phones use the on-screen keypad (inputMode="none" keeps the system keyboard away).
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  const search = (v: string) => {
    if (!v) return;
    startTransition(async () => {
      try {
        setPeople(await lookup(v));
        setSearched(v);
      } catch {
        onResult({ status: "error" });
      }
    });
  };

  const update = (next: string) => {
    const v = next.replace(/\D/g, "").slice(0, 10);
    setValue(v);
    setPeople(null);
    if (/^[6-9]\d{9}$/.test(v)) search(v); // a full mobile number searches by itself
  };

  const press = (key: (typeof KEYS)[number]) => {
    if (key === "del") update(value.slice(0, -1));
    else if (key === "find") search(value);
    else update(value + key);
  };

  const mark = (p: Person) =>
    startTransition(async () => {
      try {
        const r = await checkIn(p.id);
        onResult(r);
        if (r.status === "done") {
          setValue("");
          setPeople(null);
          inputRef.current?.focus();
        } else if (r.person) {
          setPeople((list) => list?.map((x) => (x.id === r.person!.id ? r.person! : x)) ?? null);
        }
      } catch {
        onResult({ status: "error" });
      }
    });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(value);
        }}
        className="flex items-stretch border-2 border-ink bg-white focus-within:border-maroon-700"
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => update(e.target.value)}
          inputMode="none"
          autoComplete="off"
          placeholder="Mobile or Reg ID"
          aria-label="Mobile number or Reg ID"
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 font-mono text-2xl tracking-[0.1em] sm:px-4 sm:py-4 sm:text-3xl sm:tracking-[0.12em] tabular-nums outline-none placeholder:font-sans placeholder:text-lg placeholder:tracking-normal placeholder:text-ink-3"
        />
        {value && (
          <button type="button" onClick={() => update("")} aria-label="Clear" className="touch-manipulation px-3 text-ink-3 hover:text-ink sm:px-4">
            <X className="size-6" />
          </button>
        )}
      </form>
      {!people && (
        <p className="mt-2 text-sm text-ink-3">
          A 10-digit mobile searches automatically. For a Reg ID, type the number and press Find
          <span className="pointer-coarse:hidden"> or Enter</span>.
        </p>
      )}

      <div className="mt-3 space-y-3 empty:hidden" aria-live="polite">
        {pending && !people && <p className="text-ink-3">Searching…</p>}
        {people?.length === 0 && (
          <p className="border border-rule bg-white p-4 text-ink-2">
            No registration found for <span className="font-mono font-semibold text-ink">{searched}</span>.
          </p>
        )}
        {people?.map((p) => (
          <article key={p.id} className="border-2 border-ink bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl leading-tight">{p.name}</h3>
                <p className="mt-1 text-sm text-ink-3">
                  {p.regId} · {p.mobile}
                </p>
                <p className="text-sm text-ink-3">
                  {p.district} · {p.category}
                </p>
              </div>
            </div>
            {p.attendedAt ? (
              <p className="mt-3 flex items-center gap-2 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">
                <Check className="size-4" aria-hidden />
                Checked in at {time(p.attendedAt)}
                {p.attendedBy && ` by ${p.attendedBy}`}
              </p>
            ) : (
              <button
                onClick={() => mark(p)}
                disabled={pending}
                className="mt-3 flex w-full touch-manipulation items-center justify-center gap-2 bg-maroon-700 py-4 text-lg font-semibold text-white active:bg-maroon-800 disabled:opacity-60"
              >
                <Check className="size-5" aria-hidden />
                Mark as arrived
              </button>
            )}
          </article>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 pointer-fine:hidden">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === "del" ? "Delete" : k === "find" ? "Find" : k}
            className={`flex h-[clamp(3.25rem,8svh,4rem)] touch-manipulation items-center justify-center text-3xl font-medium select-none active:scale-95 ${
              k === "find" ? "bg-ink text-lg font-semibold text-paper" : "border border-rule bg-white active:bg-paper-2"
            }`}
          >
            {k === "del" ? <Delete className="size-7" /> : k === "find" ? "Find" : k}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPopup({ result, onClose }: { result: Shown; onClose: () => void }) {
  const p = result.person;
  const look = {
    done: { bg: "bg-green-700 text-white", Icon: Check, title: "Checked in" },
    already: { bg: "bg-gold-300 text-ink", Icon: TriangleAlert, title: "Already checked in" },
    missing: { bg: "bg-maroon-700 text-white", Icon: CircleAlert, title: "Pass not found" },
    error: { bg: "bg-maroon-700 text-white", Icon: CircleAlert, title: "No connection. Try again" },
  }[result.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="alertdialog"
        aria-live="assertive"
        className={`relative w-full max-w-md animate-pop overflow-hidden ${look.bg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-2 right-2 flex size-12 items-center justify-center hover:bg-black/10">
          <X className="size-7" />
        </button>
        <div className="p-5 pr-14 sm:p-6 sm:pr-14">
          <span className="flex size-14 items-center justify-center rounded-full bg-black/15">
            <look.Icon className="size-8" strokeWidth={2.5} aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold tracking-[0.18em] uppercase opacity-80">{look.title}</p>
          {p ? (
            <>
              <h2 className="mt-1 font-serif text-3xl leading-tight break-words sm:text-4xl">{p.name}</h2>
              <p className="mt-2 opacity-85">
                {p.regId} · {p.district} · {p.category}
              </p>
              {result.status === "done" && <p className="mt-4 bg-black/15 px-3 py-2 font-semibold">Give T-shirt and cap</p>}
              {result.status === "already" && p.attendedAt && (
                <p className="mt-4 bg-black/10 px-3 py-2 font-semibold">
                  At {time(p.attendedAt)}
                  {p.attendedBy && ` by ${p.attendedBy}`}
                </p>
              )}
            </>
          ) : (
            result.code && <p className="mt-2 font-mono break-all opacity-85">{result.code}</p>
          )}
        </div>
        <span className="block h-1.5 origin-left animate-shrink bg-black/25" style={{ animationDuration: `${POPUP_MS}ms` }} />
      </div>
    </div>
  );
}
