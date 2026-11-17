# PRD: Sanmarg Odisha Walkathon — Registration, Gate Check-In & Certificate Portal

## Problem
Sanmarg Odisha is running a walkathon (padyatra) promoted on hoardings in Bhubaneswar and Cuttack. People scan a QR code, register, get checked in at the gate (where they collect a T-shirt and cap), and later download a participation certificate. The demo (`reference/demo-prototype.html`) shows the flow but keeps everything in the browser, so it can't be used with real people or real traffic.

## Stack
| Layer | Choice |
| :--- | :--- |
| App (frontend + backend) | Next.js (App Router, TypeScript), one container; server logic lives in Route Handlers / Server Actions |
| Database | PostgreSQL (own container on the same VPS) |
| ORM | Drizzle |
| Participant login | Google OAuth 2.0 via Auth.js (NextAuth) |
| Staff login | Username + password (bcrypt), accounts created by admin |
| UI | Tailwind CSS — clean, minimal, mobile-first |
| Certificate PDF | Rendered in the participant's browser (canvas + jsPDF); server only confirms eligibility |
| Hosting | Hostinger VPS KVM 1, Docker Compose (app + Postgres + Caddy for HTTPS), domain `sanmargodisha.in` |
| Edge | Cloudflare free plan in front (caching, spike/DDoS protection) |

Expected load: 1–2 lakh registrations; spike of certificate downloads after the event.

## Scope
- **In:**
  - Landing page on `sanmargodisha.in` (short "about Sanmarg Odisha" + Register CTA + "Download your certificate" banner).
  - Registration: sign in with Google, then name, mobile, district, category. Shows a confirmation with Reg ID and a QR pass.
  - Gate check-in page for volunteers: search by mobile, name or Reg ID, then mark attended in one tap.
  - Participant certificate page: sign in with Google, see status (locked / unlocked), download certificate PDF when unlocked.
  - Admin panel: registry table with search/filter, counts (registered, attended, pending), CSV export, create/disable volunteer accounts, "unlock certificates for everyone" switch.
- **Out:**
  - SMS/email OTP (Google sign-in replaces it — no DLT/TRAI sender approval needed).
  - Camera QR scanning at the gate (manual search is faster; QR pass is just a visual Reg ID).
  - Certificate template studio from the demo — one fixed certificate design.
  - News / e-newspaper CMS (separate later project).

## UI
Clean and minimal: lots of whitespace, one accent colour, no clutter, large touch targets (volunteers use phones at the gate). The demo's look and certificate design are a reference, not a spec.

## Acceptance Criteria
**Registration**
1. Given a visitor scans the hoarding QR, when the landing page loads on a phone, then the Register button is visible without scrolling.
2. Given a visitor is not signed in, when they tap Register, then they are sent through Google sign-in and returned to the form with their email pre-filled and read-only.
3. Given the form, when name, mobile (10 digits), district or category is missing/invalid, then submit is blocked with an inline error per field.
4. Given a valid form, when submitted, then a registration is saved and the confirmation shows Reg ID, details and a downloadable QR pass.
5. Given a Google account that already registered, when it opens Register again, then it sees its existing registration instead of a new form.

**Gate check-in**
6. Given a user who is not signed in as staff, when they open the gate or admin URL, then they see the staff login, not the data.
7. Given a volunteer, when they search a mobile number, then all registrations with that number are listed with name, district, category and status.
8. Given a pending registration, when the volunteer taps "Mark attended", then status becomes Attended with time and volunteer name recorded, and the certificate unlocks.
9. Given an already-attended registration, when it is searched, then it shows "Already checked in at <time> by <volunteer>" and cannot be marked again.
10. Given a search with no match, then "No registration found" is shown with the search term.

**Certificate**
11. Given a participant signs in with Google and has no registration, then they see "No registration for <email>" and a link to Register.
12. Given a registered participant who has not attended and certificates are not unlocked for everyone, then they see "Locked — pending gate check-in" and no download button.
13. Given an attended participant (or the global unlock is on), when they tap Download, then a PDF certificate with their name, category and event details is saved to their device.
14. Given a participant, they can only ever see and download their own certificate.

**Admin**
15. Given an admin, when they open the dashboard, then totals for registered, attended and pending are shown and match the database.
16. Given an admin, when they turn on "Unlock certificates for everyone", then every registered participant can download, and attendance records stay unchanged.
17. Given an admin, when they create a volunteer account, then that volunteer can log in to the gate page but not the admin panel.
18. Given an admin, when they disable a volunteer, then that volunteer's next request is rejected.
19. Given an admin, when they export, then a CSV of all registrations with attendance status downloads.

## Constraints
- One registration per Google account (email unique); mobile is not unique (families may share a phone).
- Must stay responsive on KVM 1 (1 vCPU, 4 GB RAM) at 1–2 lakh users: no server-side PDF rendering, indexed lookups on mobile, email and Reg ID.
- Two roles for staff: `admin` and `volunteer`. Expect 10–20 volunteers checking in at the same time.
- Daily Postgres backup (`pg_dump`) off the VPS.

## Assumptions
- Assumption: Google sign-in happens at registration (not only at certificate download), so the certificate email always matches the registered email.
- Assumption: Categories = Student, Teacher, Guest/General, VIP; districts = the Odisha list from the demo.
- Assumption: Staff use username/password, not Google, because volunteers' accounts are created and handed out by the admin.

## Open Questions
- Final certificate design and wording (who signs it, logos)?
- Exact category list?
