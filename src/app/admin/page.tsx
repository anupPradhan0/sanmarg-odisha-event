import { Suspense } from "react";
import { connection } from "next/server";
import { count, desc } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { requireStaff } from "@/lib/staff-auth";
import { fmt, Loading } from "./ui";

export const metadata = { title: "Overview · Admin · Sanmarg Odisha" };

export default function OverviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Overview />
    </Suspense>
  );
}

const breakdown = (col: AnyPgColumn) =>
  db
    .select({ key: col, total: count(), arrived: count(registrations.attendedAt) })
    .from(registrations)
    .groupBy(col)
    .orderBy(desc(count()));

async function Overview() {
  await connection(); // session expiry reads the clock; mark this request-time first
  await requireStaff("admin");
  const [[totals], byDistrict, byCategory, byGender, byAge] = await Promise.all([
    db.select({ total: count(), arrived: count(registrations.attendedAt) }).from(registrations),
    breakdown(registrations.district),
    breakdown(registrations.category),
    breakdown(registrations.gender),
    breakdown(registrations.ageGroup),
  ]);
  const pending = totals.total - totals.arrived;
  const turnout = totals.total ? Math.round((totals.arrived / totals.total) * 100) : 0;

  return (
    <>
      <section className="grid grid-cols-2 gap-px border-y border-rule bg-rule lg:grid-cols-4">
        {[
          { label: "Registered", value: fmt(totals.total) },
          { label: "Arrived", value: fmt(totals.arrived), accent: true },
          { label: "Not yet arrived", value: fmt(pending) },
          { label: "Turnout", value: `${turnout}%` },
        ].map((k) => (
          <div key={k.label} className="bg-paper p-4 sm:p-5 lg:p-6">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ink-3 uppercase">{k.label}</p>
            <p className={`mt-2 font-serif text-4xl leading-none tabular-nums sm:text-6xl ${k.accent ? "text-maroon-700" : ""}`}>{k.value}</p>
          </div>
        ))}
      </section>
      <div className="mt-4 h-2.5 w-full bg-paper-2" role="progressbar" aria-valuenow={turnout} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-maroon-700 transition-[width] duration-700" style={{ width: `${turnout}%` }} />
      </div>

      <section className="mt-12 grid gap-12 lg:grid-cols-2">
        <Breakdown title="Where they're from" rows={byDistrict} limit={8} />
        <div className="space-y-12">
          <Breakdown title="Category" rows={byCategory} />
          <div className="grid gap-12 sm:grid-cols-2">
            <Breakdown title="Gender" rows={byGender} />
            <Breakdown title="Age group" rows={byAge} />
          </div>
        </div>
      </section>
    </>
  );
}

function Breakdown({ title, rows, limit }: { title: string; rows: { key: unknown; total: number; arrived: number }[]; limit?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  const shown = limit ? rows.slice(0, limit) : rows;
  const rest = limit ? rows.slice(limit) : [];

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <h3 className="font-serif text-2xl">{title}</h3>
        <span className="text-[10px] tracking-[0.14em] text-ink-3 uppercase">Arrived / registered</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">No data yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {shown.map((r) => (
            <BreakdownRow key={String(r.key)} r={r} max={max} />
          ))}
        </ul>
      )}
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none py-2 text-sm font-medium text-maroon-700 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show {rest.length} more</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <ul className="divide-y divide-rule">
            {rest.map((r) => (
              <BreakdownRow key={String(r.key)} r={r} max={max} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function BreakdownRow({ r, max }: { r: { key: unknown; total: number; arrived: number }; max: number }) {
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{String(r.key)}</span>
        <span className="tabular-nums text-ink-3">
          <span className="font-semibold text-ink">{fmt(r.arrived)}</span> / {fmt(r.total)}
        </span>
      </div>
      <div className="relative mt-1.5 h-1.5 bg-paper-2">
        <div className="absolute inset-y-0 left-0 bg-ink/15" style={{ width: `${(r.total / max) * 100}%` }} />
        <div className="absolute inset-y-0 left-0 bg-maroon-700" style={{ width: `${(r.arrived / max) * 100}%` }} />
      </div>
    </li>
  );
}
