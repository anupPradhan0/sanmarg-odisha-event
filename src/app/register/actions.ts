"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { CATEGORIES, DISTRICTS } from "@/lib/event";

type Field = "name" | "mobile" | "district" | "category";
export type FormState = { errors?: Partial<Record<Field, string>>; values?: Record<Field, string> };

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/register");

  const get = (k: Field) => String(formData.get(k) ?? "").trim();
  const values = {
    name: get("name").replace(/\s+/g, " "),
    // Accept "+91 98765 43210", "098765-43210" etc. and keep the 10 digits.
    mobile: get("mobile").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""),
    district: get("district"),
    category: get("category"),
  };

  const errors: FormState["errors"] = {};
  if (values.name.length < 2 || values.name.length > 100) errors.name = "ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ · Write your full name";
  if (!/^[6-9]\d{9}$/.test(values.mobile)) errors.mobile = "ସଠିକ 10 ଅଙ୍କର ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ · Enter a correct 10-digit mobile number";
  if (!DISTRICTS.some((d) => d.value === values.district)) errors.district = "ଜିଲ୍ଲା ବାଛନ୍ତୁ · Choose your district";
  if (!CATEGORIES.some((c) => c.value === values.category)) errors.category = "ଗୋଟିଏ ବାଛନ୍ତୁ · Choose one";
  if (Object.keys(errors).length) return { errors, values };

  // A double submit or second tab hits the unique email and keeps the first registration.
  await db.insert(registrations).values({ email, ...values }).onConflictDoNothing({ target: registrations.email });
  redirect("/register");
}
