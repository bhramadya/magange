CONTEXT:
Project: E-Magang Kota Madiun — Laravel 13 + Inertia v3 + React 19 + TypeScript + PostgreSQL, Spatie Permission (3 roles: Mahasiswa, Admin OPD, Admin Verifikator).
Before making ANY change, follow AGENTS.md: use Laravel Boost MCP tools first (database-schema, search-docs, database-query). HANDOFF-BACKEND.md is source of truth for existing routes/prop shapes — check before adding new ones. Indonesian-language route paths already defined there must not be renamed casually; if a new route is needed, follow the existing naming convention.

PRODUCT DECISION (resolves an old TODO): the canonical ticket format is `MGG-YYYY-NNNNNN` (e.g. `MGG-2026-100200`), NOT `EMG-`. Find every place in the codebase that generates, validates, or displays ticket numbers (service classes, frontend regex/mask, tests) and make them consistent with `MGG-`. Report any place you find still using `EMG-` before changing it, in case it's used as a stored historical value rather than a generator pattern.

TASK 1 — Fix public "Lacak Tiket" (ticket tracking) page
- Goal: any visitor (logged in or not) can look up application status by entering a ticket number in format `MGG-YYYY-NNNNNN`.
- Investigate first: find the existing lacak-tiket route/controller/page, check why it's currently broken (wrong format regex, wrong query, wrong relation, or frontend not submitting — report which before fixing).
- Fix so it correctly looks up `internship_applications` (or relevant table — confirm via database-schema) by ticket number and displays current status/progress publicly, without requiring login and without exposing sensitive personal data beyond what's appropriate for a public status check (confirm with me what fields are safe to show publicly — e.g. status and timeline yes, personal documents no).

TASK 2 — Add "Lacak Status Publik" menu to every user dashboard
- Add a new menu item labeled exactly "Lacak Status Publik" in the sidebar/nav of ALL three dashboards (Mahasiswa, Admin OPD, Admin Verifikator).
- Position: between the "Bantuan" menu item and the last menu item in each dashboard's menu list (check each dashboard's current menu order first — they may differ, so position it consistently by that same rule for each).
- Clicking it opens the same public lacak-tiket page/feature from Task 1 (reuse the component, don't duplicate).

TASK 3 — Add supporting file uploads to the registration page
- On the homepage's "Daftar" (registration) section/page, add optional file upload fields: "Surat Pengantar", "CV", "Portofolio" — each labeled "jika ada" (optional, not required).
- Confirm via database-schema whether storage columns/paths for these already exist (check for something like a documents/attachments table) before adding new ones — reuse existing document storage pattern if there is one, don't create a parallel system.
- Standard validation: file type/size limits appropriate for PDF/doc/image uploads — check HANDOFF-BACKEND.md or existing upload code for the project's existing conventions and match them.

TASK 4 — Registration photo becomes profile picture
- The photo uploaded during registration should automatically become the user's profile picture in their account — no separate upload step needed later.
- Find where profile pictures are currently stored/displayed (check users table / avatar column) and wire the registration upload to populate it directly at account creation, using existing image storage conventions (disk, path pattern) already in the project.

TASK 5 — Fix Admin Verifikator "Laporan" (report) menu
- Investigate first: find the current Laporan menu/page in Admin Verifikator dashboard and report what's broken or missing.
- Fix so Admin Verifikator can: (a) view the final report ("laporan akhir") file uploaded by the Mahasiswa, and (b) upload the certificate ("surat sertifikat") from that same page.
- "Sinkron" — make sure this connects to the same certificate-generation flow already built (CertificateService from earlier sessions) rather than creating a separate/parallel upload path. Confirm the certificate ends up linked to the correct application record and is retrievable from wherever certificates are currently displayed (e.g. Mahasiswa's own dashboard).

TASK 6 — Fix Admin OPD "Peserta Aktif" (active participants) menu
- Goal: shows all Mahasiswa whose application status is "approved" (disetujui), scoped to that specific OPD.
- Investigate first: find the current "Peserta Aktif" controller/route/query. Confirm what status/condition it currently filters by — is it querying the correct status enum value for "approved" (confirm exact enum value via database-schema), or an outdated/wrong one?
- Use database-query to manually run the intended query (approved applications scoped to a specific OPD) against real data, and compare with what "Peserta Aktif" currently shows — find the exact divergence.
- Confirm scoping is correct: an Admin OPD should only see participants approved for THEIR OWN OPD, not all OPDs.
- Report whether this is a read-path bug (wrong/stale query) or a genuinely missing feature (never fully wired) before fixing.
- Fix using the same single-source-of-truth service pattern used for the kuota sync fix in a previous session, rather than a new ad-hoc query. Include relevant fields (name, ticket number, status, date approved — confirm against HANDOFF-BACKEND.md prop shape if one exists).

ORDER OF EXECUTION: do these one task at a time, in the order listed above, and report status (done/blocked/needs my decision) after each before moving to the next. Task 1's ticket format decision affects Task 2. Task 3 and 4 touch the same registration form so implement together but verify separately. Task 6 follows the same architectural pattern as the earlier kuota fix — reuse that precedent.

After each task: run relevant Pest tests (write minimal ones if none exist), `pint --dirty`, and confirm no regressions in the three dashboards' existing kuota/status/peserta features from previous sessions.