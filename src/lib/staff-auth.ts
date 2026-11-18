import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { staff, type Staff } from "@/db/schema";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const COOKIE = "staff_session";
const TTL_SECONDS = 12 * 60 * 60;

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);
const sign = (data: string) => createHmac("sha256", process.env.AUTH_SECRET!).update(data).digest("base64url");

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scrypt(password, salt, 32)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return safeEqual(Buffer.from(hash, "hex"), await scrypt(password, Buffer.from(salt, "hex"), 32));
}

export async function startSession(staffId: number) {
  const data = Buffer.from(JSON.stringify({ id: staffId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })).toString("base64url");
  (await cookies()).set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in staff member, re-read from the DB so a disabled account is locked out on its next request. */
export async function getStaff(): Promise<Staff | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  const [data, sig] = raw?.split(".") ?? [];
  if (!data || !sig || !safeEqual(Buffer.from(sig), Buffer.from(sign(data)))) return null;
  let session: { id?: unknown; exp?: unknown };
  try {
    session = JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
  if (typeof session.id !== "number" || typeof session.exp !== "number" || session.exp < Date.now() / 1000) return null;
  const row = await db.query.staff.findFirst({ where: eq(staff.id, session.id) });
  return row?.active ? row : null;
}

export async function requireStaff(role?: "admin"): Promise<Staff> {
  const me = await getStaff();
  if (!me) redirect("/staff/login");
  if (role === "admin" && me.role !== "admin") redirect("/staff");
  return me;
}

export const adminUsername = () => process.env.ADMIN_USERNAME?.trim().toLowerCase();

/**
 * The admin's credentials live in env. On a correct admin login the matching DB row is created or
 * re-synced, so check-ins can reference it and an env password change takes effect at once.
 */
export async function loginEnvAdmin(username: string, password: string): Promise<number | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !adminUsername() || username !== adminUsername()) return null;
  if (!safeEqual(Buffer.from(password), Buffer.from(expected))) return null;
  const passwordHash = await hashPassword(expected);
  const [row] = await db
    .insert(staff)
    .values({ username, name: "Admin", passwordHash, role: "admin" })
    .onConflictDoUpdate({ target: staff.username, set: { passwordHash, role: "admin", active: true } })
    .returning({ id: staff.id });
  return row.id;
}
