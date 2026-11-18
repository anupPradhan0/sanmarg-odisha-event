import { Suspense } from "react";
import { connection } from "next/server";
import { count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { registrations, staff } from "@/db/schema";
import { requireStaff } from "@/lib/staff-auth";
import { Pager } from "../../pager";
import { setStaffActive } from "../actions";
import { CreateStaffForm } from "../staff-form";
import { fmt, Loading, SectionHead } from "../ui";

export const metadata = { title: "Staff · Admin · Sanmarg Odisha" };

const PAGE_SIZE = 20;

export default function StaffAdminPage({ searchParams }: PageProps<"/admin/staff">) {
  return (
    <Suspense fallback={<Loading />}>
      <StaffList searchParams={searchParams} />
    </Suspense>
  );
}

async function StaffList({ searchParams }: { searchParams: PageProps<"/admin/staff">["searchParams"] }) {
  await connection(); // session expiry reads the clock; mark this request-time first
  await requireStaff("admin");
  const page = Math.max(1, Number((await searchParams).page) || 1);

  const [[totals], [checked], team] = await Promise.all([
    db.select({ n: count() }).from(staff),
    db.select({ n: count() }).from(registrations).where(isNotNull(registrations.attendedBy)),
    db
      .select({ id: staff.id, name: staff.name, username: staff.username, role: staff.role, active: staff.active, checkIns: count(registrations.id) })
      .from(staff)
      .leftJoin(registrations, eq(registrations.attendedBy, staff.id))
      .groupBy(staff.id)
      .orderBy(staff.role, staff.createdAt, staff.id)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const pages = Math.max(1, Math.ceil(totals.n / PAGE_SIZE));

  return (
    <>
      <SectionHead note={`${fmt(totals.n)} ${totals.n === 1 ? "account" : "accounts"} · ${fmt(checked.n)} check-ins at the gate`} />

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-12">
        <aside className="min-w-0 border border-ink bg-white p-5 lg:order-last lg:col-span-4">
          <h3 className="font-serif text-2xl leading-none">Add a volunteer</h3>
          <p className="mt-2 mb-5 text-sm text-ink-3">They sign in at /staff/login and only see the gate screen.</p>
          <CreateStaffForm />
        </aside>

        <div className="min-w-0 lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-ink text-[11px] tracking-[0.14em] text-ink-3 uppercase">
                <tr>
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="hidden py-3 pr-4 font-medium sm:table-cell">Username</th>
                  <th className="py-3 pr-3 font-medium sm:pr-4">Check-ins</th>
                  <th className="py-3 pr-3 font-medium sm:pr-4">Status</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {team.map((s) => (
                  <tr key={s.id} className={s.active ? "" : "text-ink-3"}>
                    <td className="py-3 pr-4 font-medium">
                      {s.name}
                      {s.role === "admin" && <span className="ml-2 bg-ink px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-paper uppercase">Admin</span>}
                      <span className="block font-mono text-xs font-normal text-ink-3 sm:hidden">{s.username}</span>
                    </td>
                    <td className="hidden py-3 pr-4 font-mono sm:table-cell">{s.username}</td>
                    <td className="py-3 pr-3 tabular-nums sm:pr-4">{fmt(s.checkIns)}</td>
                    <td className="py-3 pr-3 sm:pr-4">{s.active ? "Active" : "Off"}</td>
                    <td className="py-3 text-right">
                      {s.role === "staff" && (
                        <form action={setStaffActive.bind(null, s.id, !s.active)}>
                          <button className="border border-rule px-3 py-1.5 text-xs font-semibold whitespace-nowrap hover:border-ink">{s.active ? "Turn off" : "Turn on"}</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {totals.n <= 1 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-ink-3">
                      No gate staff yet. Add the first volunteer with the form.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} pages={pages} href={(n) => (n > 1 ? `/admin/staff?page=${n}` : "/admin/staff")} />
        </div>
      </div>
    </>
  );
}
