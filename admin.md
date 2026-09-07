# CampusOS Admin Panel — Readiness Report (inspection only)

> Webapp location: `C:\campus os\webapp\` (React/Vite source), separate from the Android app at `C:\campus os\app\`.
> No code or database changes were made to produce this report.

---

## 1. Existing architecture

- **Stack:** React 18 + Vite 6 + TypeScript 5.6 + Tailwind 3.4. No router, no state library, no chart library. Scripts: `dev`, `build` (`tsc && vite build`), `preview`.
- **Navigation is state-driven, not routed.** `App.tsx` uses `AppFlowState = 'portal-select' | 'student-login' | 'student-app'` and `NavSection = 'dashboard' | 'ai' | 'student-data' | 'events' | 'helpdesk'`. `StudentShell` renders exactly 5 student sections. There is **no URL routing to hijack** — but also no route guard infrastructure; admin will need either `react-router-dom` (recommended) or an extended flow-state machine.
- **Services (`src/services/`):**
  - `supabaseClient.ts` — anon/publishable key only, `DEMO_PROFILE_ID` = linked demo UUID. No service-role key anywhere.
  - `campusApi.ts` — 12 read fetchers (`fetchStudent/Timetable/Attendance/Grades/Deadlines/Events/Canteen/Facilities/Library/Transport/Tickets/Notifications`), offline-safe (return `null` on RLS-deny/failure).
  - `campusStore.ts` — offline-first store (localStorage + `mockData` fallback) with `hydrateFromSupabase()` that overwrites slices with live data when available.
  - `authService.ts` — local demo login + fire-and-forget Supabase link (`resolveSupabaseEmail` maps demo email/ID → email, then `signInWithPassword`) + `loginWithSupabase` (writes local session from Auth user).
  - `aiAgent.ts` — rule-based **student** AI over the store. No admin AI exists.
- **Admin surface today:** only the `PortalSelect` "Admin — Coming Soon" card + modal describing the planned cockpit/faculty-dispatch subsystems. Zero admin components, pages, or API code.
- **Data flow consequence:** Student reads go through `campusApi` (RLS-enforced per session) with local fallback. An admin app must **not** reuse the fallback/mock path — it must fail closed when RLS denies.

## 2. Database tables relevant to Admin (verified live, all 26 RLS-enabled)

| Table | Rows | Admin use |
|---|---|---|
| `profiles` | 3 | Students/faculty/staff/admin directory (role-gated) |
| `departments` / `semesters` / `subjects` | 3 / 5 / 7 | Academic master data CRUD |
| `enrollments` | 5 | Enrollment management |
| `timetable_slots` | 18 | Full CRUD + conflict detection |
| `attendance_records` (5) + `attendance_history` (25) | 30 | Monitoring, risk (<75%), trends; teacher-scoped writes |
| `grades` | 5 | View/distributions; teacher-scoped entry |
| `deadlines` (4) + `deadline_completions` (0) | 4 | Deadline CRUD (covers "assignments" — **no separate assignments table exists**) |
| `events` (3) + `event_registrations` (0) | 3 | Event CRUD, publish, capacity, registrations |
| `canteens` + `canteen_menu_items` | 1 + 5 | Menu/prices/availability/crowd |
| `facilities` | 2 | Rooms/spaces management |
| `library_books` (2) + `library_loans` (1) + `library_status` | 4 | Catalog, loans/returns, seat status |
| `transport_routes` | 1 | Routes/stops/schedules |
| `helpdesk_tickets` (3) + `ticket_timeline` (8) | 11 | Triage, assign, status, audit trail |
| `notifications` (4) + `notices` (3) | 7 | Broadcast/targeted messaging |
| `ai_conversations` + `ai_messages` | 0 | Separate Admin AI threads later |

**Gaps found (things the spec needs that don't exist yet):**

- No `admin_activity_log` / audit table.
- `helpdesk_tickets` has **no assignee column** and `ticket_status` is only `Pending / In Progress / Resolved` — spec wants `Assigned` + `Closed` too (`ticket_step` already includes `Assigned`).
- `notices.audience` is free text (default `'all'`); no dept/semester/section targeting columns, no `scheduled_at`/publish-state (only `published_at`, `expires_at`, `is_pinned`). `events` has no publish/unpublish flag (only `is_past`).
- No teacher↔subject assignment table (`timetable_slots.faculty_name` is free text, no FK) — teacher scoping needs a real mapping.
- No roles/permissions table (permissions currently encoded in policy expressions only).

## 3. Existing roles and RLS policies

- **Enum `app_role`:** `student, faculty, staff, admin, maintenance` (verified in DB).
- **Auth users:** exactly **1** — the demo student (`da2fbf87…`, signed in before). **No admin/faculty/staff Auth users exist yet.** Profiles for `registrar@campus.edu` (admin) and `verma.faculty@campus.edu` (faculty) exist but are **unlinked** (placeholder UUIDs) — they cannot sign in until Auth users are created and linked exactly like the demo student was.
- **Policy model (exact expressions read from `pg_policies`):**
  - Catalog tables (departments, semesters, subjects, timetable, events, deadlines, canteens, facilities, library, transport, notices): `SELECT` open to `anon + authenticated`; writes are `ALL` gated on `current_user_role() IN (staff, admin[, faculty])`.
  - Owner tables (enrollments, attendance, grades, loans): `SELECT` = `student_id = auth.uid() OR role IN (staff, admin, faculty)`; writes = staff/admin/faculty only (students read-only — verified by test).
  - Tickets: owner SELECT/INSERT/own-UPDATE; staff/admin/maintenance/faculty SELECT + status UPDATE; students blocked from status changes by `guard_ticket_status()` trigger (verified); auto-`Created` timeline + status-change notifications via triggers (verified).
  - Profiles: own row + staff-wide SELECT; own UPDATE + staff UPDATE; **DELETE = admin only**; role/CGPA escalation blocked by `guard_profile_writes()` (verified).
  - Write policies bundle **staff+admin together** — there is no Main-Admin-vs-staff distinction today.
- **Trigger helpers:** 10 `SECURITY DEFINER` functions; all except `current_user_role()` have `EXECUTE` revoked from anon/authenticated (trigger-only). Must be preserved as-is.

## 4. Admin permission matrix (proposed mapping onto existing `app_role`)

| Capability | Main Admin (`admin`) | Vice Principal | Teacher (`faculty`) | Staff (`staff`) | Maintenance (`maintenance`) |
|---|---|---|---|---|---|
| Dashboard (all metrics) | ✓ | ✓ overview | own classes | operational | tickets only |
| Students CRUD / directory | ✓ full | read + reports | read assigned only* | none | none |
| Faculty/staff/admin users | ✓ | read | — | — | — |
| Departments/subjects/timetable | ✓ CRUD | read | read own | none | none |
| Attendance view all / risk | ✓ | ✓ | assigned only* | none | none |
| Attendance/grade writes | ✓ | — | assigned only* | — | — |
| Events/notices CRUD + publish | ✓ | ✓ | — | events/notices | — |
| Canteen/library/transport/facilities | ✓ | read | — | ✓ operate | — |
| Helpdesk all + assign + close | ✓ | oversee | own-related | ✓ triage | assigned only* |
| Roles/permissions, audit log | ✓ | — | — | — | — |
| Admin AI analytics | ✓ scoped | ✓ scoped | ✓ scoped | ✓ scoped | ✓ scoped |

`*` = needs new scoped policies (teacher-subject mapping, ticket assignee). **Decision needed:** Vice Principal has no enum value — options are (a) add `vice_principal` to `app_role`, or (b) reuse `staff` + convention. Recommendation is (a) for a clean matrix; it's a one-line enum addition with zero impact on existing policies.

## 5. Required database changes (minimal, additive — no student-policy weakening)

1. `ALTER TYPE ticket_status ADD VALUE 'Assigned', 'Closed'` (separate migration; `ADD VALUE` can't run inside a transaction).
2. `helpdesk_tickets`: add `assignee_id UUID → profiles(id)`, `closed_at TIMESTAMPTZ` (+ index). Timeline/audit triggers already cover status changes.
3. `notices`: add targeting (`audience_department_id`, `audience_semester`, `audience_section`) + `scheduled_at` + publish state if scheduling UI is required; otherwise standardize `audience` vocabulary.
4. `events`: add publish flag (e.g. `is_published DEFAULT true`) so admin can stage events without students seeing them.
5. New `teacher_subjects(teacher_id → profiles, subject_id → subjects)` mapping for scoped teacher policies.
6. New `admin_activity_log(id, actor_id → profiles, action, entity_type, entity_id, metadata JSONB, created_at)` with staff/admin-only RLS.
7. New scoped RLS policies only (teacher-own-subjects attendance/grades, assignee-visible tickets, VP read scope if new enum value). Existing policies untouched.
8. Regenerate `src/types/supabase.ts` after migrations; create the 2 missing Auth users (registrar, faculty) + any new admin Auth users and link profiles the same proven way.

## 6. Admin route structure (requires adding `react-router-dom`)

```text
/admin/login                 public, admin-only credentials
/admin/*                     guard: Auth session + profile.role IN (admin, vice_principal, faculty, staff, maintenance); students bounced to /
/admin                       Dashboard (role-filtered metrics)
/admin/students  /faculty  /departments  /subjects  /timetable  /attendance  /grades  /deadlines
/admin/events  /facilities  /library  /transport  /canteen
/admin/helpdesk  /notifications  /notices
/admin/users  /roles  /activity
/admin/ai
```

Student flow (`portal-select → student-login → student-app`, 5 sections) stays exactly as-is; the PortalSelect Admin card routes to `/admin/login` instead of the Coming-Soon modal.

## 7. Admin component structure (isolated, desktop-first)

```text
src/
  components/admin/
    AdminShell.tsx  AdminSidebar.tsx  AdminTopbar.tsx
    AdminGuard.tsx  RoleGate.tsx        DataTable.tsx  StatCard.tsx  Charts/
    dashboard/ students/ faculty/ attendance/ grades/ timetable/
    events/ helpdesk/ campus/ notices/ users/ audit/ ai/
  pages/  (only if router is adopted; else admin views under components/admin)
```

New code lives beside — never inside — `components/{dashboard,ai,student-data,events,helpdesk,layout,auth,attendance,common}`. Shared visual identity (navy/obsidian, blue/indigo) but denser, table-led layouts; lazy-load the whole admin branch via `React.lazy` so the student bundle is unaffected.

## 8. Admin API/service structure

- `services/adminAuth.ts` (new): `signInWithPassword` → fetch `profiles` role by `auth.uid()` → allow/deny by route role list; sign-out; **no localStorage credential storage, no demo fallback, fail closed**.
- `services/adminApi.ts` (new): role-aware writes (students, timetable, events, notices, ticket assign/status with timeline entries, campus services) + dashboard aggregates (counts, <75% lists, ticket status breakdowns, registration counts). Reads reuse `campusApi.ts` fetchers where RLS already permits staff/faculty; admin-only aggregates go in `adminApi`.
- `services/campusApi.ts`, `campusStore.ts`, `aiAgent.ts`, `mockData.ts`: **student path only — do not modify** (admin must never read mock data).
- Storage: reuse `avatars` (public) / `event-banners` (staff-write ✓) / `ticket-attachments` (private, owner-or-staff ✓); event-banner upload already permitted for staff/admin.

## 9. Security risks (must be designed out)

1. **Frontend-only gating is the top risk** — every admin route needs the backend double-check (profile-role fetch + RLS scoped policies); URL manipulation must land on deny-by-default.
2. **Over-broad staff policies today** (`staff_write_*` = staff+admin+faculty together) — teacher scoping and VP separation require new narrowly-scoped policies, never edits that widen existing ones.
3. **No assignee model** — don't fake assignment in UI text fields; add `assignee_id` + policy so maintenance sees only assigned tickets.
4. **Demo ID→email resolver is demo-only** — must not be generalized into an email oracle for arbitrary student IDs.
5. **Secret discipline** — service-role key stays out of the bundle (Edge Functions only if ever needed); admin passwords never in localStorage/logs (current code already clean).
6. **Aggregate leakage** — dashboard stats must be computed over RLS-visible rows for the caller's role, not via elevated queries.
7. **Audit completeness** — ticket timeline exists; everything else (grades, attendance, roles, notices) needs `admin_activity_log` writes in the same mutation path.
8. **PII exposure in tables/logs** — directory views show student PII; keep RLS as the enforcer, never filter PII client-side only.

## 10. Phase-by-phase implementation plan (each phase ends with `tsc` + `build` + RLS checks + student-portal regression)

- **Phase 1 — Auth + shell:** create registrar/faculty Auth users + link profiles; `adminAuth`, `/admin/login`, `AdminGuard`, `AdminShell`, role-filtered sidebar. Prove: student URL-tampering is denied.
- **Phase 2 — Dashboard:** real aggregates from staff-visible queries; 3–4 charts max (attendance overview, risk distribution, ticket status, registrations).
- **Phase 3 — Students/Faculty/Departments/Subjects:** directory search/filter/profile drawer reusing staff RLS reads.
- **Phase 4 — Attendance + Grades:** risk views + teacher-scoped writes (needs `teacher_subjects` + policies first).
- **Phase 5 — Timetable:** CRUD + conflict detection; student timetable updates live.
- **Phase 6 — Events/Campus/Notices:** CRUD + publish flags + banner upload + targeting.
- **Phase 7 — Helpdesk/Maintenance:** triage, assign (`assignee_id`), status incl. Closed, timeline preserved; assignment notification.
- **Phase 8 — Users/Roles/Audit:** admin provisioning (Auth + profile link flow), permission matrix enforcement, `admin_activity_log` viewer.
- **Phase 9 — Admin AI:** separate assistant over role-scoped data, confirmation gate for writes (notice drafts etc.).
- **Phase 10 — Security pass:** re-run the full RLS test battery (own-read, cross-deny, guard rails, ticket lifecycle) as each role + student regression.

**Recommended demo slice first:** Admin Login → Dashboard → Students → Attendance → Helpdesk (proves one-backend connectivity before breadth).

---

*Awaiting approval to begin Phase 1 (including the Vice-Principal enum decision in §4 and the DB change list in §5).*
