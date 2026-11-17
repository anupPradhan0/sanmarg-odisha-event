export type Lang = "en" | "or";

/** `const t = pick(lang); t("Register", "ପଞ୍ଜୀକରଣ")` — keeps each translation next to its English text. */
export const pick = (lang: Lang) => (en: string, od: string) => (lang === "or" ? od : en);
