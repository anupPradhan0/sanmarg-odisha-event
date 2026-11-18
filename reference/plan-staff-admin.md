# Plan: Staff gate check-in and admin dashboard

## 1. Approach
Staff and admins log in with a username and password on `/staff/login`. This is separate from participants' Google login, so the two never share a session. The session is an HMAC-signed cookie (`node:crypto`, keyed by `AUTH_SECRET`). Every page and server action re-checks the staff row, so disabling a staff account takes effect immediately. The admin account comes from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in env and is upserted into the `staff` table on login; staff accounts are created by the admin. Check-in is one atomic `UPDATE … WHERE attended_at IS NULL RETURNING`, so two volunteers scanning the same pass at once can't double count. QR decoding uses `jsqr` on camera frames. It is the only new dependency: pure JS, no WASM or CDN.

## 2. Changes
| File | Change | Why |
| :--- | :--- | :--- |
| `src/db/schema.ts` | add `staff` table; add `attended_by` FK to `registrations` | accounts + who checked whom in |
| `drizzle/0002_*.sql` (new, generated) | migration | apply schema |
| `src/lib/staff-auth.ts` (new) | `hashPassword`, `verifyPassword` (scrypt), `createSession`, `getStaff`, `requireStaff(role?)`, `ensureEnvAdmin` | one guard used by every staff page and action |
| `src/app/staff/login/page.tsx`, `src/app/staff/login/form.tsx` (new) | login screen + server action | entry point for staff and admin |
| `src/app/staff/actions.ts` (new) | `lookup(query)`, `checkIn(id)`, `logout()` | gate logic, guarded |
| `src/app/staff/page.tsx`, `src/app/staff/gate.tsx` (new) | gate UI: Scan QR tab (auto check-in + popup) and Number tab (on-screen keypad, results, one-tap check-in) | volunteer workflow |
| `src/app/admin/page.tsx` (new) | KPIs, turnout bar, breakdowns by district / gender / age / category, registry table with search, filter and pagination | admin overview |
| `src/app/admin/staff-panel.tsx`, `src/app/admin/actions.ts` (new) | create staff, enable/disable staff | admin manages volunteers |
| `src/app/admin/export/route.ts` (new) | streamed CSV of all registrations | offline reporting |
| `.env.example`, `.env` | `ADMIN_USERNAME`, `ADMIN_PASSWORD` demo values | admin bootstrap |

## 3. Data & Interfaces
- **Data / Schema:**
  ```sql
  CREATE TABLE staff (id serial PRIMARY KEY, username text NOT NULL UNIQUE, name text NOT NULL,
    password_hash text NOT NULL, role text NOT NULL DEFAULT 'staff', active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now());
  ALTER TABLE registrations ADD COLUMN attended_by integer REFERENCES staff(id);
  ```
- **Interfaces:**
  - `requireStaff(role?: "admin"): Promise<Staff>`: redirects to `/staff/login` (no or invalid session) or `/staff` (not admin).
  - `lookup(query: string): Promise<Result[]>`: `SMO-2026-0007` / `7` → by id; 10 digits → by mobile.
  - `checkIn(id: number): Promise<{ status: "done" | "already" | "missing"; person?: Person }>`
  - Cookie `staff_session` = `base64url(json{id, exp}).hmac`, httpOnly, sameSite=lax, secure in production, 12 h.

## 4. Risks & Edge Cases
- Two volunteers check in the same person at once → the conditional `UPDATE` lets only one win; the other sees "Already checked in at 7:12 by Ravi".
- The same QR stays in front of the camera → the scanner ignores the same code for 4 s and pauses while the popup is open.
- Disabled staff with a live cookie → `requireStaff` re-reads `active` on every request.
- Admin password changed in env → `ensureEnvAdmin` re-hashes it on every admin login, so env stays the source of truth.
- Camera needs HTTPS → works on `localhost` and on production behind Caddy. Over plain-HTTP LAN in dev it can't, so the Number tab is the fallback.
- One mobile shared by a family → lookup returns every match and the volunteer taps the right person.
- CSV over 2 lakh rows → streamed in batches of 5,000 by id, never held in memory.

## 5. Verification Plan
- `pnpm build`, `npx tsc --noEmit`, `pnpm lint`.
- Admin login with env creds → `/admin` loads KPIs; a wrong password shows an error.
- Admin creates staff `gate1` → `gate1` logs in, lands on `/staff`, and `/admin` redirects it back.
- Lookup by mobile → result → one tap → "Checked in"; a second tap or scan → "Already checked in".
- Disable `gate1` → its next action redirects to login.
- QR decode: a generated pass image decoded by `jsqr` returns the Reg ID.

## 6. Build Tasks
- [x] **T1** Add `staff` table + `attended_by`; generate and apply migration — `src/db/schema.ts` — **done when:** `\d staff` shows the table.
- [x] **T2** Staff auth helpers — `src/lib/staff-auth.ts` — **done when:** login sets the cookie and `requireStaff` redirects without it.
- [x] **T3** Login page + action — `src/app/staff/login/*` — **done when:** env admin logs in to `/admin`, staff to `/staff`.
- [x] **T4** Gate actions — `src/app/staff/actions.ts` — **done when:** check-in returns done, then already.
- [x] **T5** Gate UI (scanner, popup, keypad) — `src/app/staff/page.tsx`, `gate.tsx` — **done when:** a scan auto checks in and the popup closes after 2 s or on ✕.
- [x] **T6** Admin dashboard + staff management + CSV — `src/app/admin/*` — **done when:** numbers match the DB and a created staff can log in.
