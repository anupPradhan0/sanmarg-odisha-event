import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { regId } from "@/lib/event";
import { requireStaff } from "@/lib/staff-auth";
import { Pager } from "@/app/pager";

export const metadata = { title: "My check-ins · Sanmarg Odisha" };

const PAGE_SIZE = 20;
const ist = (d: Date) =>
  d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function MyCheckInsPage({ searchParams }: PageProps<"/staff/mine">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-5 sm:px-5 sm:py-6">
      <Suspense fallback={<p className="py-16 text-center text-ink-3">Loading…</p>}>
        <MyCheckIns searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MyCheckIns({ searchParams }: { searchParams: PageProps<"/staff/mine">["searchParams"] }) {
  await connection();
  const me = await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const mine = eq(registrations.attendedBy, me.id);
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(registrations).where(mine),
    db
      .select({ id: registrations.id, name: registrations.name, mobile: registrations.mobile, district: registrations.district, attendedAt: registrations.attendedAt })
      .from(registrations)
      .where(mine)
      .orderBy(desc(registrations.attendedAt), desc(registrations.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Link href="/staff" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to gate
      </Link>
      <p className="mt-6 text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">My check-ins · {me.name}</p>
      <h1 className="mt-2 font-serif text-4xl leading-none tracking-tight">
        <span className="tabular-nums">{total.toLocaleString("en-IN")}</span> {total === 1 ? "person" : "people"}
      </h1>
      <p className="mt-2 text-sm text-ink-3">Everyone you checked in, by QR scan or by number. Newest first.</p>

      <ol className="mt-6 divide-y divide-rule border-y border-ink">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="mt-0.5 text-sm text-ink-3">
                <span className="font-mono">{regId(r.id)}</span> · {r.mobile} · {r.district}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-ink-2">{r.attendedAt && ist(r.attendedAt)}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-10 text-center text-ink-3">{total ? "No more check-ins on this page." : "You have not checked anyone in yet."}</li>}
      </ol>
      <Pager page={page} pages={pages} href={(p) => (p > 1 ? `/staff/mine?page=${p}` : "/staff/mine")} />
    </>
  );
}
