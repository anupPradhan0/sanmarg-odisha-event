"use client";

import { useEffect, useRef } from "react";

type Props = { bbsr: string; ctc: string; river: string; caption: string; kmLabel: string; hint: string };

export function RouteMap({ bbsr, ctc, river, caption, kmLabel, hint }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // three.js loads in its own chunk after the page is interactive; without WebGL the page still works.
    import("./scene")
      .then(({ mountRouteMap }) => {
        if (!cancelled) dispose = mountRouteMap(el, { bbsr, ctc, river }, animate, kmRef.current);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [bbsr, ctc, river]);

  return (
    <figure className="relative border-y border-rule bg-paper-2/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 text-[11px] tracking-[0.14em] text-ink-2 uppercase">
        <span>{caption}</span>
        <span className="text-right">
          <span ref={kmRef} className="font-serif text-3xl tracking-normal text-maroon-700 tabular-nums normal-case">
            0.0
          </span>
          <span className="ml-1">km</span>
          <span className="block text-ink-3">{kmLabel}</span>
        </span>
      </div>
      <div ref={ref} className="relative h-[420px] w-full touch-pan-y select-none sm:h-[520px]" aria-hidden />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between p-4 text-[10px] text-ink-3">
        <span>{hint}</span>
        <span>© OpenStreetMap contributors</span>
      </figcaption>
    </figure>
  );
}
