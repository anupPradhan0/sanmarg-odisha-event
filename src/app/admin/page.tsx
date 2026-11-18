import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { and, count, desc, eq, ilike, isNotNull, isNull, or, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { Check, Download, LogOut, ScanLine, Search } from "lucide-react";
import { db } from "@/db";
import { registrations, staff } from "@/db/schema";
import { parseRegId, regId } from "@/lib/event";
import { requireStaff } from "@/lib/staff-auth";
import { logout } from "../staff/actions";
import { adminCheckIn, setStaffActive } from "./actions";
import { CreateStaffForm } from "./staff-form";

export const metadata = { title: "Admin · Sanmarg Odisha" };

const PAGE_SIZE = 50;
const STATUSES = { all: "All", arrived: "Arrived", pending: "Not yet" } as const;
type Status = keyof typeof STATUSES;

const fmt = (n: number) => n.toLocaleString("en-IN");
const ist = (d: Date) =>
  d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Suspense fallback={<p className="py-16 text-center text-ink-3">Loading dashboard…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const breakdown = (col: AnyPgColumn) =>
  db
    .select({ key: col, total: count(), arrived: count(registrations.attendedAt) })
    .from(registrations)
    .groupBy(col)
    .orderBy(desc(count()));

function registryFilter(q: string, status: Status): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (status === "arrived") conds.push(isNotNull(registrations.attendedAt));
  if (status === "pending") conds.push(isNull(registrations.attendedAt));
  if (q) {
    const digits = q.replace(/\D/g, "");
    const id = parseRegId(q);
    if (/^[6-9]\d{9}$/.test(digits)) conds.push(eq(registrations.mobile, digits));
    else if (id) conds.push(eq(registrations.id, id));
    else {
      const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
      conds.push(or(ilike(registrations.name, like), ilike(registrations.email, like)));
    }
  }
  return and(...conds);
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await connection(); // session expiry reads the clock; mark this request-time first
  const me = await requireStaff("admin");
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const status: Status = sp.status === "arrived" || sp.status === "pending" ? sp.status : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const [[totals], byDistrict, byCategory, byGender, byAge, team, rows] = await Promise.all([
    db.select({ total: count(), arrived: count(registrations.attendedAt) }).from(registrations),
    breakdown(registrations.district),
    breakdown(registrations.category),
    breakdown(registrations.gender),
    breakdown(registrations.ageGroup),
    db
      .select({ id: staff.id, name: staff.name, username: staff.username, role: staff.role, active: staff.active, checkIns: count(registrations.id) })
      .from(staff)
      .leftJoin(registrations, eq(registrations.attendedBy, staff.id))
      .groupBy(staff.id)
      .orderBy(staff.role, staff.createdAt),
    db
      .select({
        id: registrations.id,
        name: registrations.name,
        email: registrations.email,
        mobile: registrations.mobile,
        district: registrations.district,
        category: registrations.category,
        gender: registrations.gender,
        ageGroup: registrations.ageGroup,
        attendedAt: registrations.attendedAt,
        attendedBy: staff.name,
      })
      .from(registrations)
      .leftJoin(staff, eq(staff.id, registrations.attendedBy))
      .where(registryFilter(q, status))
      .orderBy(desc(registrations.id))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const pending = totals.total - totals.arrived;
  const turnout = totals.total ? Math.round((totals.arrived / totals.total) * 100) : 0;
  const hasNext = rows.length > PAGE_SIZE;
  const href = (next: { status?: Status; page?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = next.status ?? status;
    if (s !== "all") p.set("status", s);
    if ((next.page ?? 1) > 1) p.set("page", String(next.page));
    const str = p.toString();
    return `/admin${str ? `?${str}` : ""}`;
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-6">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">Signed in as {me.username}</p>
          <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff" className="inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-sm font-semibold hover:bg-ink hover:text-paper">
            <ScanLine className="size-4" aria-hidden /> Gate check-in
          </Link>
          <a href="/admin/export" className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink-2">
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
          <form action={logout}>
            <button className="inline-flex items-center gap-2 border border-rule px-4 py-2.5 text-sm font-semibold text-ink-2 hover:border-ink">
              <LogOut className="size-4" aria-hidden /> Log out
            </button>
          </form>
        </div>
      </div>

      {/* KPIs */}
      <section className="mt-8 grid grid-cols-2 gap-px border-y border-rule bg-rule lg:grid-cols-4">
        {[
          { label: "Registered", value: fmt(totals.total) },
          { label: "Arrived", value: fmt(totals.arrived), accent: true },
          { label: "Not yet arrived", value: fmt(pending) },
          { label: "Turnout", value: `${turnout}%` },
        ].map((k) => (
          <div key={k.label} className="bg-paper p-5 lg:p-6">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ink-3 uppercase">{k.label}</p>
            <p className={`mt-2 font-serif text-5xl leading-none tabular-nums sm:text-6xl ${k.accent ? "text-maroon-700" : ""}`}>{k.value}</p>
          </div>
        ))}
      </section>
      <div className="mt-4 h-2.5 w-full bg-paper-2" role="progressbar" aria-valuenow={turnout} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-maroon-700 transition-[width] duration-700" style={{ width: `${turnout}%` }} />
      </div>

      {/* Breakdowns */}
      <section className="mt-14 grid gap-12 lg:grid-cols-2">
        <Breakdown title="Where they're from" rows={byDistrict} limit={8} />
        <div className="space-y-12">
          <Breakdown title="Category" rows={byCategory} />
          <div className="grid gap-12 sm:grid-cols-2">
            <Breakdown title="Gender" rows={byGender} />
            <Breakdown title="Age group" rows={byAge} />
          </div>
        </div>
      </section>

      {/* Staff */}
      <section className="mt-16 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionTitle>Gate staff</SectionTitle>
          <p className="mt-2 text-ink-2">Create a login for each volunteer. They sign in at /staff/login and can only use the gate screen.</p>
          <div className="mt-6">
            <CreateStaffForm />
          </div>
        </div>
        <div className="overflow-x-auto lg:col-span-8">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-y border-ink text-[11px] tracking-[0.14em] text-ink-3 uppercase">
              <tr>
                <th className="py-3 pr-4 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Username</th>
                <th className="py-3 pr-4 font-medium">Check-ins</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {team.map((s) => (
                <tr key={s.id} className={s.active ? "" : "text-ink-3"}>
                  <td className="py-3 pr-4 font-medium">
                    {s.name}
                    {s.role === "admin" && <span className="ml-2 bg-ink px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-paper uppercase">Admin</span>}
                  </td>
                  <td className="py-3 pr-4 font-mono">{s.username}</td>
                  <td className="py-3 pr-4 tabular-nums">{fmt(s.checkIns)}</td>
                  <td className="py-3 pr-4">{s.active ? "Active" : "Turned off"}</td>
                  <td className="py-3 text-right">
                    {s.role === "staff" && (
                      <form action={setStaffActive.bind(null, s.id, !s.active)}>
                        <button className="border border-rule px-3 py-1.5 text-xs font-semibold hover:border-ink">{s.active ? "Turn off" : "Turn on"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {team.length <= 1 && (
                <tr>
                  <td colSpan={5} className="py-6 text-ink-3">
                    No gate staff yet. Add the first volunteer on the left.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registry */}
      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle>Participants</SectionTitle>
          <nav className="flex border border-rule p-0.5 text-sm">
            {(Object.keys(STATUSES) as Status[]).map((s) => (
              <Link
                key={s}
                href={href({ status: s })}
                className={`px-3 py-1.5 font-medium ${status === s ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
              >
                {STATUSES[s]}
              </Link>
            ))}
          </nav>
        </div>
        <form action="/admin" className="mt-4 flex border border-ink bg-white">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, mobile or Reg ID"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
          />
          <button className="flex items-center gap-2 bg-ink px-5 text-sm font-semibold text-paper">
            <Search className="size-4" aria-hidden /> Search
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-y border-ink text-[11px] tracking-[0.14em] text-ink-3 uppercase">
              <tr>
                <th className="py-3 pr-4 font-medium">Reg ID</th>
                <th className="py-3 pr-4 font-medium">Participant</th>
                <th className="py-3 pr-4 font-medium">Mobile</th>
                <th className="py-3 pr-4 font-medium">District</th>
                <th className="py-3 pr-4 font-medium">Category</th>
                <th className="py-3 pr-4 font-medium">Gender / Age</th>
                <th className="py-3 font-medium">Arrival</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.slice(0, PAGE_SIZE).map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="py-3 pr-4 font-mono text-xs">{regId(r.id)}</td>
                  <td className="py-3 pr-4">
                    <span className="font-medium">{r.name}</span>
                    <span className="block text-xs text-ink-3">{r.email}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono">{r.mobile}</td>
                  <td className="py-3 pr-4">{r.district}</td>
                  <td className="py-3 pr-4">{r.category}</td>
                  <td className="py-3 pr-4">
                    {r.gender} · {r.ageGroup}
                  </td>
                  <td className="py-3">
                    {r.attendedAt ? (
                      <span className="inline-flex items-center gap-1.5 text-green-800">
                        <Check className="size-4" aria-hidden />
                        {ist(r.attendedAt)}
                        {r.attendedBy && <span className="text-ink-3">· {r.attendedBy}</span>}
                      </span>
                    ) : (
                      <form action={adminCheckIn.bind(null, r.id)}>
                        <button className="border border-maroon-700 px-3 py-1 text-xs font-semibold text-maroon-700 hover:bg-maroon-700 hover:text-white">
                          Mark arrived
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-3">
                    {q || status !== "all" ? "No participants match this search." : "No registrations yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-3">Page {page}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className="border border-rule px-3 py-1.5 font-medium hover:border-ink">
                ← Newer
              </Link>
            )}
            {hasNext && (
              <Link href={href({ page: page + 1 })} className="border border-rule px-3 py-1.5 font-medium hover:border-ink">
                Older →
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-4xl leading-none tracking-tight">{children}</h2>;
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
