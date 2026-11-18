import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { count, eq } from "drizzle-orm";
import { LayoutDashboard, LogOut } from "lucide-react";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { requireStaff } from "@/lib/staff-auth";
import { logout } from "./actions";
import { Gate } from "./gate";

export const metadata = { title: "Gate check-in · Sanmarg Odisha" };

export default function StaffPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-5 sm:px-5 sm:py-6">
      <Suspense fallback={<p className="py-16 text-center text-ink-3">Loading…</p>}>
        <GateContent />
      </Suspense>
    </main>
  );
}

async function GateContent() {
  await connection(); // session expiry reads the clock; mark this request-time first
  const me = await requireStaff();
  const [[totals], [mine]] = await Promise.all([
    db.select({ total: count(), arrived: count(registrations.attendedAt) }).from(registrations),
    db.select({ n: count() }).from(registrations).where(eq(registrations.attendedBy, me.id)),
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">Gate check-in</p>
          <h1 className="mt-1.5 font-serif text-3xl leading-none tracking-tight break-words sm:mt-2 sm:text-4xl">{me.name}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {me.role === "admin" && (
            <Link href="/admin" className="flex size-11 items-center justify-center border border-rule hover:border-ink" aria-label="Admin">
              <LayoutDashboard className="size-5" />
            </Link>
          )}
          <form action={logout}>
            <button className="flex size-11 items-center justify-center border border-rule hover:border-ink" aria-label="Log out">
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 mb-4 text-sm text-ink-3 sm:mb-5">
        <span className="font-semibold text-ink">{totals.arrived.toLocaleString("en-IN")}</span> of{" "}
        {totals.total.toLocaleString("en-IN")} registered have arrived.
      </p>
      <Gate checkedIn={mine.n} />
    </>
  );
}
