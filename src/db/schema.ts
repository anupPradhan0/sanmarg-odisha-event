import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "staff"] }).notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
    attendedBy: integer("attended_by").references(() => staff.id),
  },
  (t) => [index("registrations_mobile_idx").on(t.mobile)],
);

export type Registration = typeof registrations.$inferSelect;
export type Staff = typeof staff.$inferSelect;
