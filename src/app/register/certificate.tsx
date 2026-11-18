"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImageDown } from "lucide-react";
import { EVENT } from "@/lib/event";
import { pick, type Lang } from "@/lib/i18n";

type Data = { name: string; regId: string; category: string };

// A4 landscape at ~210 dpi: sharp in print, still light on low-end phones.
const W = 2480;
const H = 1754;
const C = { paper: "#f4efe6", ink: "#171411", ink2: "#4a443d", ink3: "#8a8277", rule: "#d8cfbf", maroon: "#8b1e24", gold: "#e8b346" };

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Shrinks the font until `text` fits `maxWidth`, so long names never run off the page. */
function fitText(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, start: number, maxWidth: number) {
  let px = start;
  ctx.font = font(px);
  while (px > 40 && ctx.measureText(text).width > maxWidth) ctx.font = font((px -= 4));
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && ctx.measureText(`${last} ${word}`).width <= maxWidth) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
}

// ponytail: demo design drawn in code. When the official artwork arrives, drawImage() it as the
// background here and keep only the name / Reg ID text at the positions the artwork leaves blank.
function draw(ctx: CanvasRenderingContext2D, d: Data, fonts: { serif: string; sans: string; odia: string }) {
  const serif = (px: number, italic = false) => `${italic ? "italic " : ""}${px}px ${fonts.serif}, ${fonts.odia}, serif`;
  const sans = (px: number, weight = 400) => `${weight} ${px}px ${fonts.sans}, ${fonts.odia}, sans-serif`;
  const cx = W / 2;

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);

  // Frame: heavy maroon outer border, thin inner rule.
  ctx.strokeStyle = C.maroon;
  ctx.lineWidth = 28;
  ctx.strokeRect(70, 70, W - 140, H - 140);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(130, 130, W - 260, H - 260);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Masthead
  ctx.fillStyle = C.maroon;
  ctx.fillRect(cx - 230, 268, 26, 26);
  ctx.fillStyle = C.ink;
  ctx.font = serif(64);
  ctx.textAlign = "left";
  ctx.fillText("Sanmarg Odisha", cx - 186, 300);
  ctx.textAlign = "center";

  ctx.fillStyle = C.maroon;
  ctx.font = sans(34, 600);
  ctx.letterSpacing = "10px";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", cx, 430);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = C.ink2;
  ctx.font = serif(64, true);
  ctx.fillText("This is to certify that", cx, 590);

  // Name
  ctx.fillStyle = C.ink;
  fitText(ctx, d.name, (px) => serif(px), 190, W - 640);
  ctx.fillText(d.name, cx, 800);
  ctx.strokeStyle = C.maroon;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 640, 860);
  ctx.lineTo(cx + 640, 860);
  ctx.stroke();

  ctx.fillStyle = C.ink2;
  ctx.font = sans(50);
  wrap(ctx, `walked with us in the ${EVENT.name}, held in ${EVENT.place} on ${EVENT.date}, and joined the call for a healthier Odisha.`, cx, 980, 1640, 76);

  // Seal
  const sy = 1400;
  ctx.fillStyle = C.maroon;
  ctx.beginPath();
  ctx.arc(cx, sy, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, sy, 108, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.paper;
  ctx.font = sans(21, 600);
  ctx.letterSpacing = "4px";
  ctx.fillText("WALKATHON", cx + 2, sy - 26);
  ctx.letterSpacing = "0px";
  ctx.font = serif(84);
  ctx.fillText("2026", cx, sy + 52);

  // Signatures
  for (const [x, title] of [
    [560, "Organising Secretary"],
    [W - 560, "President, Sanmarg Odisha"],
  ] as const) {
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 260, 1440);
    ctx.lineTo(x + 260, 1440);
    ctx.stroke();
    ctx.fillStyle = C.ink2;
    ctx.font = sans(36, 500);
    ctx.fillText(title, x, 1500);
  }

  // Footer
  ctx.fillStyle = C.ink3;
  ctx.font = sans(30);
  ctx.textAlign = "left";
  ctx.fillText(`Reg ID ${d.regId} · ${d.category}`, 190, H - 170);
  ctx.textAlign = "right";
  ctx.fillText("sanmargodisha.in", W - 190, H - 170);
}

export function Certificate({ name, regId, category, lang }: Data & { lang: Lang }) {
  const t = pick(lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const file = `Sanmarg-Walkathon-2026-Certificate-${regId}`;

  useEffect(() => {
    let cancelled = false;
    const fonts = { serif: cssVar("--font-display"), sans: cssVar("--font-geist"), odia: cssVar("--font-odia") };
    // Canvas text silently falls back to a system font unless the web fonts are loaded first.
    Promise.all([
      document.fonts.load(`190px ${fonts.serif}`, name),
      document.fonts.load(`italic 64px ${fonts.serif}`),
      document.fonts.load(`600 34px ${fonts.sans}`),
      document.fonts.load(`50px ${fonts.odia}`, name),
    ])
      .catch(() => {})
      .then(() => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        draw(canvas.getContext("2d")!, { name, regId, category }, fonts);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [name, regId, category]);

  const savePdf = async () => {
    setSaving(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(canvasRef.current!.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 297, 210);
      pdf.save(`${file}.pdf`);
    } finally {
      setSaving(false);
    }
  };

  const saveImage = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current!.toDataURL("image/png");
    a.download = `${file}.png`;
    a.click();
  };

  return (
    <div>
      <div className="relative border border-rule bg-white p-1.5 shadow-[0_10px_30px_-12px_rgba(23,20,17,0.35)]">
        <canvas ref={canvasRef} width={W} height={H} className="block h-auto w-full" aria-label={`Certificate for ${name}`} role="img" />
        {!ready && <p className="absolute inset-0 flex items-center justify-center bg-paper text-ink-3">{t("Preparing certificate…", "ପ୍ରମାଣପତ୍ର ପ୍ରସ୍ତୁତ ହେଉଛି…")}</p>}
      </div>
      <button
        onClick={savePdf}
        disabled={!ready || saving}
        className="mt-5 flex w-full items-center justify-center gap-3 bg-maroon-700 px-6 py-5 text-lg font-semibold text-white shadow-[0_4px_0_0_var(--color-maroon-900)] transition hover:bg-maroon-800 active:translate-y-1 active:shadow-none disabled:opacity-60"
      >
        <Download className="size-6" aria-hidden />
        {saving ? t("Saving…", "ସେଭ ହେଉଛି…") : t("Download certificate (PDF)", "ପ୍ରମାଣପତ୍ର ଡାଉନଲୋଡ (PDF)")}
      </button>
      <button
        onClick={saveImage}
        disabled={!ready}
        className="mt-3 flex w-full items-center justify-center gap-2 border border-ink bg-white px-6 py-4 font-semibold text-ink hover:bg-paper-2 disabled:opacity-60"
      >
        <ImageDown className="size-5" aria-hidden />
        {t("Save as photo (for WhatsApp)", "ଫଟୋ ଭାବେ ସେଭ କରନ୍ତୁ (WhatsApp ପାଇଁ)")}
      </button>
    </div>
  );
}
