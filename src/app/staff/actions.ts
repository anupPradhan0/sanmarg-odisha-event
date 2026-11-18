"use server";

import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { registrations, staff } from "@/db/schema";
import { parseRegId, regId } from "@/lib/event";
import { endSession, requireStaff } from "@/lib/staff-auth";

export type Person = {
  id: number;
  regId: string;
  name: string;
  mobile: string;
  district: string;
  category: string;
  attendedAt: string | null;
  attendedBy: string | null;
};
export type CheckInResult = { status: "done" | "already" | "missing"; person?: Person; code?: string };

async function findPeople(where: SQL) {
  const rows = await db
    .select({
      id: registrations.id,
      name: registrations.name,
      mobile: registrations.mobile,
      district: registrations.district,
      category: registrations.category,
      attendedAt: registrations.attendedAt,
      attendedBy: staff.name,
    })
    .from(registrations)
    .leftJoin(staff, eq(staff.id, registrations.attendedBy))
    .where(where)
    .orderBy(registrations.id)
    .limit(20);
  return rows.map((r) => ({ ...r, regId: regId(r.id), attendedAt: r.attendedAt?.toISOString() ?? null }));
}

/** A 10-digit Indian mobile searches by phone; anything else is treated as a Reg ID. */
export async function lookup(query: string): Promise<Person[]> {
  await requireStaff();
  const digits = query.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return findPeople(eq(registrations.mobile, digits));
  const id = parseRegId(query);
  return id ? findPeople(eq(registrations.id, id)) : [];
}

export async function checkIn(id: number): Promise<CheckInResult> {
  const me = await requireStaff();
  // Only the first of two simultaneous check-ins matches `attended_at IS NULL`; the other reports "already".
  const updated = await db
    .update(registrations)
    .set({ attendedAt: sql`now()`, attendedBy: me.id })
    .where(and(eq(registrations.id, id), isNull(registrations.attendedAt)))
    .returning({ id: registrations.id });
  const [person] = await findPeople(eq(registrations.id, id));
  if (!person) return { status: "missing" };
  return { status: updated.length ? "done" : "already", person };
}

/** QR passes encode the Reg ID; scanning one checks the person in straight away. */
export async function scanPass(code: string): Promise<CheckInResult> {
  await requireStaff();
  const id = /^SMO-2026-\d+$/i.test(code.trim()) ? parseRegId(code) : null;
  return id ? checkIn(id) : { status: "missing", code: code.slice(0, 40) };
}

export async function logout() {
  await endSession();
  redirect("/staff/login");
}
