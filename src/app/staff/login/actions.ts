"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { adminUsername, loginEnvAdmin, startSession, verifyPassword } from "@/lib/staff-auth";

export type LoginState = { error?: string; username?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let id = await loginEnvAdmin(username, password);
  if (!id && username !== adminUsername()) {
    const row = await db.query.staff.findFirst({ where: eq(staff.username, username) });
    if (row?.active && row.role === "staff" && (await verifyPassword(password, row.passwordHash))) id = row.id;
  }
  if (!id) return { error: "Wrong username or password, or the account is turned off.", username };

  await startSession(id);
  redirect(username === adminUsername() ? "/admin" : "/staff");
}
