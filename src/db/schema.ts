import { index, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const registrations = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    mobile: varchar("mobile", { length: 10 }).notNull(),
    gender: text("gender").notNull(),
    ageGroup: text("age_group").notNull(),
    district: text("district").notNull(),
    category: text("category").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    attendedAt: timestamp("attended_at", { withTimezone: true }),
  },
  (t) => [index("registrations_mobile_idx").on(t.mobile)],
);

export type Registration = typeof registrations.$inferSelect;
