import { BookOpen, GraduationCap, Star, User } from "lucide-react";

// Assumption: event date/venue until confirmed by Sanmarg Odisha.
export const EVENT = {
  name: "Sanmarg Odisha Walkathon 2026",
  nameOd: "ସନ୍ମାର୍ଗ ଓଡ଼ିଶା ପଦଯାତ୍ରା ୨୦୨୬",
  date: "1 December 2026",
  dateOd: "୧ ଡିସେମ୍ବର ୨୦୨୬",
  startsAt: "2026-12-01T07:00:00+05:30",
  place: "Bhubaneswar & Cuttack",
  placeOd: "ଭୁବନେଶ୍ୱର ଓ କଟକ",
};

export const CATEGORIES = [
  { value: "Student", od: "ଛାତ୍ର / ଛାତ୍ରୀ", icon: GraduationCap },
  { value: "Teacher", od: "ଶିକ୍ଷକ / ଶିକ୍ଷୟିତ୍ରୀ", icon: BookOpen },
  { value: "General / Guest", od: "ସାଧାରଣ ନାଗରିକ", icon: User },
  { value: "VIP / Special Guest", od: "ବିଶିଷ୍ଟ ଅତିଥି", icon: Star },
];

export const GENDERS = [
  { value: "Male", od: "ପୁରୁଷ" },
  { value: "Female", od: "ମହିଳା" },
  { value: "Other", od: "ଅନ୍ୟ" },
];

export const AGE_GROUPS = [
  { value: "Under 18", od: "୧୮ ରୁ କମ୍" },
  { value: "18-25", od: "୧୮ – ୨୫" },
  { value: "26-35", od: "୨୬ – ୩୫" },
  { value: "36-45", od: "୩୬ – ୪୫" },
  { value: "Above 45", od: "୪୫ ରୁ ଅଧିକ" },
];

// Bhubaneswar and Cuttack first (most walkers), the rest alphabetical.
export const DISTRICTS = [
  { value: "Khordha (Bhubaneswar)", od: "ଖୋର୍ଦ୍ଧା (ଭୁବନେଶ୍ୱର)" },
  { value: "Cuttack", od: "କଟକ" },
  { value: "Angul", od: "ଅନୁଗୋଳ" },
  { value: "Balasore", od: "ବାଲେଶ୍ୱର" },
  { value: "Bargarh", od: "ବରଗଡ଼" },
  { value: "Bhadrak", od: "ଭଦ୍ରକ" },
  { value: "Bolangir", od: "ବଲାଙ୍ଗୀର" },
  { value: "Boudh", od: "ବୌଦ୍ଧ" },
  { value: "Deogarh", od: "ଦେବଗଡ଼" },
  { value: "Dhenkanal", od: "ଢେଙ୍କାନାଳ" },
  { value: "Gajapati", od: "ଗଜପତି" },
  { value: "Ganjam (Berhampur)", od: "ଗଞ୍ଜାମ (ବ୍ରହ୍ମପୁର)" },
  { value: "Jagatsinghpur", od: "ଜଗତସିଂହପୁର" },
  { value: "Jajpur", od: "ଯାଜପୁର" },
  { value: "Jharsuguda", od: "ଝାରସୁଗୁଡ଼ା" },
  { value: "Kalahandi", od: "କଳାହାଣ୍ଡି" },
  { value: "Kandhamal", od: "କନ୍ଧମାଳ" },
  { value: "Kendrapara", od: "କେନ୍ଦ୍ରାପଡ଼ା" },
  { value: "Keonjhar", od: "କେନ୍ଦୁଝର" },
  { value: "Koraput", od: "କୋରାପୁଟ" },
  { value: "Malkangiri", od: "ମାଲକାନଗିରି" },
  { value: "Mayurbhanj", od: "ମୟୂରଭଞ୍ଜ" },
  { value: "Nabarangpur", od: "ନବରଙ୍ଗପୁର" },
  { value: "Nayagarh", od: "ନୟାଗଡ଼" },
  { value: "Nuapada", od: "ନୂଆପଡ଼ା" },
  { value: "Puri", od: "ପୁରୀ" },
  { value: "Rayagada", od: "ରାୟଗଡ଼ା" },
  { value: "Sambalpur", od: "ସମ୍ବଲପୁର" },
  { value: "Subarnapur", od: "ସୁବର୍ଣ୍ଣପୁର" },
  { value: "Sundargarh (Rourkela)", od: "ସୁନ୍ଦରଗଡ଼ (ରାଉରକେଲା)" },
  { value: "Outside Odisha", od: "ଓଡ଼ିଶା ବାହାରେ" },
];

export const regId = (id: number) => `SMO-2026-${String(id).padStart(4, "0")}`;

/** "SMO-2026-0007", "0007" or "7" → 7. */
export function parseRegId(input: string) {
  const m = input.trim().toUpperCase().match(/^(?:SMO-?2026-?)?0*(\d{1,7})$/);
  return m ? Number(m[1]) : null;
}
