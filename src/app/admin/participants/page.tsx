import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { and, count, desc, eq, ilike, isNotNull, isNull, or, type SQL } from "drizzle-orm";
import { Check, Download, Search } from "lucide-react";
import { db } from "@/db";
import { registrations, staff } from "@/db/schema";
import { parseRegId, regId } from "@/lib/event";
import { requireStaff } from "@/lib/staff-auth";
import { Pager } from "../../pager";
import { adminCheckIn } from "../actions";
import { fmt, Loading, SectionHead } from "../ui";

export const metadata = { title: "Participants · Admin · Sanmarg Odisha" };

const PAGE_SIZE = 50;
const STATUSES = { all: "All", arrived: "Arrived", pending: "Not yet" } as const;
type Status = keyof typeof STATUSES;

const ist = (d: Date) =>
  d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function ParticipantsPage({ searchParams }: PageProps<"/admin/participants">) {
  return (
    <Suspense fallback={<Loading />}>
      <Participants searchParams={searchParams} />
    </Suspense>
  );
}

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

async function Participants({ searchParams }: { searchParams: PageProps<"/admin/participants">["searchParams"] }) {
  await connection(); // session expiry reads the clock; mark this request-time first
  await requireStaff("admin");
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const status: Status = sp.status === "arrived" || sp.status === "pending" ? sp.status : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const filter = registryFilter(q, status);

  const [[matching], rows] = await Promise.all([
    db.select({ n: count() }).from(registrations).where(filter),
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
      .where(filter)
      .orderBy(desc(registrations.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const pages = Math.max(1, Math.ceil(matching.n / PAGE_SIZE));
  const empty = matching.n ? "No participants on this page." : q || status !== "all" ? "No participants match this search." : "No registrations yet.";
  const href = (next: { status?: Status; page?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = next.status ?? status;
    if (s !== "all") p.set("status", s);
    if ((next.page ?? 1) > 1) p.set("page", String(next.page));
    const str = p.toString();
    return `/admin/participants${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <SectionHead
        note={`${fmt(matching.n)} ${q || status !== "all" ? "match" : "registered"}${q ? ` “${q}”` : ""}`}
      >
        <a href="/admin/export" className="inline-flex h-11 items-center gap-2 bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-2">
          <Download className="size-4" aria-hidden /> Export CSV
        </a>
      </SectionHead>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <form action="/admin/participants" className="flex flex-1 border border-ink bg-white">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, mobile or Reg ID"
            aria-label="Search participants"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
          />
          {q && (
            <Link href={status === "all" ? "/admin/participants" : `/admin/participants?status=${status}`} className="flex items-center px-3 text-sm text-ink-3 hover:text-ink">
              Clear
            </Link>
          )}
          <button className="flex items-center gap-2 bg-ink px-5 text-sm font-semibold text-paper">
            <Search className="size-4" aria-hidden /> <span className="hidden sm:inline">Search</span>
          </button>
        </form>
        <nav className="grid grid-cols-3 border border-rule p-0.5 text-sm" aria-label="Filter by arrival">
          {(Object.keys(STATUSES) as Status[]).map((s) => (
            <Link
              key={s}
              href={href({ status: s })}
              aria-current={status === s ? "page" : undefined}
              className={`flex items-center justify-center px-4 py-2.5 font-medium whitespace-nowrap ${status === s ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
            >
              {STATUSES[s]}
            </Link>
          ))}
        </nav>
      </div>

        <ul className="mt-5 divide-y divide-rule border-y border-ink md:hidden">
          {rows.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{r.name}</span>
                <span className="shrink-0 font-mono text-xs text-ink-3">{regId(r.id)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                <span className="font-mono">{r.mobile}</span> · {r.district}
              </p>
              <p className="text-sm text-ink-3">
                {r.category} · {r.gender} · {r.ageGroup}
              </p>
              <div className="mt-3">
                <Arrival r={r} />
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="py-10 text-center text-ink-3">{empty}</li>}
        </ul>

        <div className="mt-4 hidden overflow-x-auto md:block">
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
              {rows.map((r) => (
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
                    <Arrival r={r} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-3">
                    {empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} href={(n) => href({ page: n })} />
    </>
  );
}

function Arrival({ r }: { r: { id: number; attendedAt: Date | null; attendedBy: string | null } }) {
  return r.attendedAt ? (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-sm text-green-800">
      <Check className="size-4" aria-hidden />
      {ist(r.attendedAt)}
      {r.attendedBy && <span className="text-ink-3">· {r.attendedBy}</span>}
    </span>
  ) : (
    <form action={adminCheckIn.bind(null, r.id)}>
      <button className="border border-maroon-700 px-3 py-1.5 text-xs font-semibold text-maroon-700 hover:bg-maroon-700 hover:text-white">
        Mark arrived
      </button>
    </form>
  );
}
