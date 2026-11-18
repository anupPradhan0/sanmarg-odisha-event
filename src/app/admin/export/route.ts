import { asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { registrations, staff } from "@/db/schema";
import { regId } from "@/lib/event";
import { requireStaff } from "@/lib/staff-auth";

const BATCH = 5000;
const HEADER = ["Reg ID", "Name", "Email", "Mobile", "Gender", "Age group", "District", "Category", "Registered at", "Arrived at", "Checked in by"];

// Quote every field; prefix formula-looking values so Excel doesn't execute them.
const cell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const line = (values: unknown[]) => values.map(cell).join(",") + "\r\n";

/** Streams every registration in id order, a batch at a time, so 2 lakh rows never sit in memory. */
export async function GET() {
  await requireStaff("admin");
  const encoder = new TextEncoder();
  let lastId = 0;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("﻿" + line(HEADER))); // BOM so Excel reads Odia names as UTF-8
    },
    async pull(controller) {
      const rows = await db
        .select({
          id: registrations.id,
          name: registrations.name,
          email: registrations.email,
          mobile: registrations.mobile,
          gender: registrations.gender,
          ageGroup: registrations.ageGroup,
          district: registrations.district,
          category: registrations.category,
          createdAt: registrations.createdAt,
          attendedAt: registrations.attendedAt,
          attendedBy: staff.name,
        })
        .from(registrations)
        .leftJoin(staff, eq(staff.id, registrations.attendedBy))
        .where(gt(registrations.id, lastId))
        .orderBy(asc(registrations.id))
        .limit(BATCH);
      if (!rows.length) return controller.close();
      lastId = rows[rows.length - 1].id;
      controller.enqueue(
        encoder.encode(
          rows
            .map((r) =>
              line([regId(r.id), r.name, r.email, r.mobile, r.gender, r.ageGroup, r.district, r.category, r.createdAt, r.attendedAt, r.attendedBy]),
            )
            .join(""),
        ),
      );
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sanmarg-walkathon-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
