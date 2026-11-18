"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { adminUsername, hashPassword, requireStaff } from "@/lib/staff-auth";
import { checkIn } from "../staff/actions";

export type StaffFormState = { error?: string; ok?: string };

export async function createStaff(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  await requireStaff("admin");
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || name.length > 60) return { error: "Enter the volunteer's name." };
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return { error: "Username: 3–32 letters, numbers, dot, dash or underscore." };
  if (username === adminUsername()) return { error: "That username is reserved for the admin." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const inserted = await db
    .insert(staff)
    .values({ name, username, passwordHash: await hashPassword(password), role: "staff" })
    .onConflictDoNothing({ target: staff.username })
    .returning({ id: staff.id });
  if (!inserted.length) return { error: `Username “${username}” is already taken.` };

  refresh();
  return { ok: `${name} can now sign in as “${username}”.` };
}

/** Turn a staff account on or off. The admin account itself can't be switched off from here. */
export async function setStaffActive(id: number, active: boolean) {
  await requireStaff("admin");
  await db.update(staff).set({ active }).where(and(eq(staff.id, id), eq(staff.role, "staff")));
  refresh();
}

/** Help-desk check-in from the registry table; same atomic check-in the gate uses. */
export async function adminCheckIn(id: number) {
  await requireStaff("admin");
  await checkIn(id);
  refresh();
}
