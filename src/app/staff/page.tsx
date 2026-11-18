import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { count } from "drizzle-orm";
import { LayoutDashboard, LogOut } from "lucide-react";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { requireStaff } from "@/lib/staff-auth";
import { logout } from "./actions";
import { Gate } from "./gate";

export const metadata = { title: "Gate check-in · Sanmarg Odisha" };

export default function StaffPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-6">
      <Suspense fallback={<p className="py-16 text-center text-ink-3">Loading…</p>}>
        <GateContent />
      </Suspense>
    </main>
  );
}

async function GateContent() {
  await connection(); // session expiry reads the clock; mark this request-time first
  const me = await requireStaff();
  const [totals] = await db.select({ total: count(), arrived: count(registrations.attendedAt) }).from(registrations);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">Gate check-in</p>
          <h1 className="mt-2 font-serif text-4xl leading-none tracking-tight">{me.name}</h1>
        </div>
        <div className="flex gap-2">
          {me.role === "admin" && (
            <Link href="/admin" className="flex size-11 items-center justify-center border border-rule hover:border-ink" aria-label="Dashboard">
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
      <p className="mt-3 mb-5 text-sm text-ink-3">
        <span className="font-semibold text-ink">{totals.arrived.toLocaleString("en-IN")}</span> of{" "}
        {totals.total.toLocaleString("en-IN")} registered have arrived.
      </p>
      <Gate />
    </>
  );
}
