"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { AGE_GROUPS, CATEGORIES, DISTRICTS, GENDERS } from "@/lib/event";
import { getLang } from "@/lib/get-lang";
import { pick } from "@/lib/i18n";

type Field = "name" | "mobile" | "gender" | "ageGroup" | "district" | "category";
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
    gender: get("gender"),
    ageGroup: get("ageGroup"),
    district: get("district"),
    category: get("category"),
  };

  const t = pick(await getLang());
  const errors: FormState["errors"] = {};
  if (values.name.length < 2 || values.name.length > 100) errors.name = t("Write your full name", "ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ");
  if (!/^[6-9]\d{9}$/.test(values.mobile))
    errors.mobile = t("Enter a correct 10-digit mobile number", "ସଠିକ 10 ଅଙ୍କର ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ");
  if (!GENDERS.some((g) => g.value === values.gender)) errors.gender = t("Choose one", "ଗୋଟିଏ ବାଛନ୍ତୁ");
  if (!AGE_GROUPS.some((a) => a.value === values.ageGroup)) errors.ageGroup = t("Choose your age group", "ବୟସ ବର୍ଗ ବାଛନ୍ତୁ");
  if (!DISTRICTS.some((d) => d.value === values.district)) errors.district = t("Choose your district", "ଜିଲ୍ଲା ବାଛନ୍ତୁ");
  if (!CATEGORIES.some((c) => c.value === values.category)) errors.category = t("Choose one", "ଗୋଟିଏ ବାଛନ୍ତୁ");
  if (Object.keys(errors).length) return { errors, values };

  // A double submit or second tab hits the unique email and keeps the first registration.
  await db.insert(registrations).values({ email, ...values }).onConflictDoNothing({ target: registrations.email });
  redirect("/register");
}
