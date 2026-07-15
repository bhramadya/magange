# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is
**E-Magang Kota Madiun** ("magange") — an internship-application portal for the Madiun city government. Three roles (app/Enums/UserRole.php): **Mahasiswa** (applicant), **Admin Verifikator** (screens incoming applications), **Admin OPD** (the placement agency that approves/rejects and manages active interns). UI, code comments, and domain terms are in **Indonesian** — match that language when editing.

The application lifecycle is the enum app/Enums/ApplicationStatus.php: pending_verifikator → forwarded_opd → approved → ongoing → completion_submitted → completed (with rejected as a terminal branch). InternshipApplication is the central model; supporting models cover OPDs, OTP tokens, status-log audit trail, documents, final reports, satisfaction surveys, FAQs, and form rate-limiting.

## Stack
Laravel 13 (PHP 8.3+) + Inertia v3 + React 19 + TypeScript, built on the laravel/react-starter-kit. Vite for bundling, Tailwind v4 for styling, shadcn/ui ("new-york" style) for components, Pest v4 for tests, PostgreSQL for the database. Authentication is handled by Laravel Fortify, plus a custom WhatsApp/email OTP login flow.

Detailed framework conventions (PHP style, Inertia v3 patterns, Pint, Pest, Wayfinder, Boost MCP tooling) live in AGENTS.md — read it before non-trivial changes. Domain-specific skills (Inertia/React, Wayfinder, Fortify, Pest, Tailwind, Laravel best-practices) live in .cursor/skills/**; AGENTS.md requires activating the relevant skill when working in that domain. This file covers what's specific to *this* repo.

## Commands
- **composer dev** — the everyday runner: boots `php artisan serve`, `queue:listen --queue=emails,default`, and `npm run dev` (Vite) together via concurrently. The queue worker is part of this; without it, dispatched Jobs/Mail never process.
- **composer ci:check** — mirrors GitHub Actions CI (.github/workflows/): JS lint (eslint) + format (prettier) + TS types (tsc) + `composer test`. `composer test` itself chains Pint `lint:check` + PHPStan `types:check` + `php artisan test`.
- **php artisan test --filter=SubmissionServiceTest** — run one Pest test file/case (or `php artisan test tests/Unit/SubmissionServiceTest.php`).
- **composer lint** (Pint) / **npm run types:check** (tsc) / **npm run lint** (eslint --fix) — run individual gates while iterating.
- **php artisan schedule:test --name="magang:transition-statuses"** — dry-run the daily 01:00 status-transition cron (routes/console.php → app/Console/Commands/TransitionApplicationStatuses.php). PostgreSQL is the DB; a `.env` DB connection must be reachable for artisan/test.

**Package manager.** Both `package-lock.json` and `pnpm-lock.yaml` are committed (there's a `pnpm-workspace.yaml` + `.npmrc` with `ignore-scripts=true`). `composer dev`/`composer ci:check` invoke the **npm** scripts, so npm is what the documented flows use — but the pnpm workspace config exists too. Pick one when installing and don't let the other lockfile drift.

## Business Logic & Strict Constraints (CRUCIAL REVISION)
When editing workflows, controllers, or UI, you MUST strictly adhere to the following business rules:

1. **Authentication Split & Security:**
   - **User (Mahasiswa):** Login without a password. Input Email -> receive OTP -> login.
   - **Admin (Verifikator & OPD):** Login using a conventional form (Username & Password) on a specific route `/admin/login`. DO NOT use OTP for admins.
   - **Single Session Limitation:** 1 Browser MUST NOT be able to log into 2 different accounts simultaneously. If detected, return `403 Forbidden`.

2. **Role-Based Form & UI Constraints:**
   - **Public Form (Welcome Page):** Add `Jurusan` (optional) and `Keahlian` (textarea) fields right above the `alamat_lengkap` field.
   - **Admin Verifikator:** When reviewing applications, they MUST see the `Jurusan` and `Keahlian` data. They are ONLY allowed to fill in "Catatan Khusus Admin Verifikator". They CANNOT and DO NOT assign Divisi, Pembimbing Lapangan, or Penanggung Jawab.
   - **Admin OPD Dashboard:** The status filters MUST be ordered as: `Perlu Keputusan` (with yellow background), `Disetujui`, `Sedang Magang`, `Selesai Magang`, `Ditolak`, `Semua`.
   - **Admin OPD Action:** When clicking "Putuskan" and selecting ACC (approve), Admin OPD is REQUIRED to fill in `Divisi/Bidang`, `Pembimbing Lapangan`, and `Penanggung Jawab`. Add an alert text below this form stating: *"Notif ini akan dikirim ke peserta magang. Peserta akan datang berkunjung ke kantor setelah diterima pengajuan ini"*.

3. **Status Automation (Cron Job):**
   - Create a daily scheduler running at `01:00 AM` to automatically update application statuses.
   - If status is `approved` and `start_date` == today, update to `ongoing` (Sedang Magang).
   - If status is `ongoing` and `end_date` == today, update to `completed` (Selesai Magang).

4. **Completion Actors (4 Triggers for 'Completed'):**
   - The status change to `completed` can be triggered by 4 different actors: 1) System (via Cron Job), 2) User (uploading final report and checking the completion box), 3) Admin Verifikator (manual button), and 4) Admin OPD (manual button).
   - Upon completion, Admin Verifikator uploads the final certificate. User MUST fill out a satisfaction survey before the certificate download button is unlocked.

5. **Email Notifications:**
   - Emails must have a large blue header text: "magang kota Madiun".
   - Approval emails must include applicant details, placement details (Divisi, Pembimbing, Penanggung Jawab), a PDF attachment, and a specific instruction: *"Anda diharapkan hadir di kantor OPD terkait dengan menemui perwakilan dari bidang [Nama Bidang]... dipandu oleh [Nama Pembimbing]"*.

## Current phase: backend wired — role dashboards + domain actions on real controllers
As of the backend awal commit, routes/web.php is **mostly wired to real controllers**. Read its comment blocks before touching routing:
1. **Role dashboard/index routes (wired).** The three role dashboards and their sub-pages now run through real controllers behind auth + role: middleware — dashboard/pengajuan/penyelesaian (Mahasiswa\DashboardController, role:mahasiswa), verifikator/verifikator/{masuk,riwayat,kuota} (Verifikator\DashboardController, role:admin_verifikator), and opd/opd/{keputusan,peserta} (Opd\DashboardController, role:admin_opd). These return Inertia::render(...) with real props.
2. **No more Route::inertia() previews in web.php.** bantuan and pengaturan are now auth-guarded real routes on SharedPageController, injecting the logged-in `user` (via MagangUserResource) so the dashboard header/sidebar show the right name. login-otp is a real controller GET (OtpLoginController@showForm). The landing page welcome/home is real (HomeController@index, injecting active faqs + opds), and lacak is a real GET on Mahasiswa\ApplicationController@track (public status lookup via ?email=). The only surviving Route::inertia() is settings/appearance (routes/settings.php). Many pages still keep MOCK_* prop defaults as fallbacks (per HANDOFF-BACKEND.md) — don't strip a page's mock data until its backend prop is in place.
3. **Domain action routes (wired).** The state-transition endpoints: POST verifikator/pengajuan/{application}/{forward,reject,complete}, POST opd/pengajuan/{application}/{approve,reject,complete}, POST mahasiswa/pengajuan/{application}/laporan (Mahasiswa\ReportController), PATCH kuota/{opd} (OpdQuotaController — Admin OPD edits its own quota, Verifikator edits any; ownership 403 in UpdateQuotaRequest::authorize()), plus public POST pengajuan (submit from the welcome form), the OTP (otp/send, otp/verify), and admin (admin/login) auth endpoints. The applicant photo lives on the private disk and is served through GET pengajuan/{application}/foto (ApplicationPhotoController) for the admin review pop-up, authorized by a view policy (Verifikator: all; OPD: only its own). **Fase 4 (penyelesaian) is also wired**: verifikator/laporan/* (Verifikator\ReportController — review final report + upload the locked certificate), sertifikat/{certificate}/{survei,download} (Mahasiswa\CertificateController — the mandatory survey unlocks the download), and full verifikator/faq/* CRUD (Verifikator\FaqController, which feeds the landing page). Thin controllers under app/Http/Controllers/{Auth,Mahasiswa,Opd,Verifikator}/ delegate to services, guarded by auth + role: and validated through FormRequests in app/Http/Requests/ (Application/, Auth/, Mahasiswa/, Opd/, Verifikator/, Settings/).

## Architecture
**Inertia, not an API.** Controllers return Inertia::render('page-name', [...props]) (or Route::inertia() for prop-less pages). React page components live in resources/js/pages/ and receive those props directly. There is no REST/JSON API layer — server and client are coupled through Inertia.

**Layouts: starter-kit pages are global, role dashboards self-wrap.** resources/js/app.tsx's layout() callback maps by page name: auth/* → AuthLayout, settings/* → [AppLayout, SettingsLayout], everything else → AppLayout. **But** the role dashboards and branded public pages (mahasiswa/*, verifikator/*, opd/*, auth/otp-login, pengajuan/baru, lacak, bantuan, pengaturan, welcome) return null there and instead import and wrap **MagangLayout** (resources/js/layouts/magang-layout.tsx) themselves. So whether a page imports its own layout depends on which group it's in — check app.tsx first. MagangLayout is the branded (Pemkot Madiun blue #106feb) dashboard shell; it takes navItems and exports per-role nav arrays (mahasiswaNav, verifikatorNav, opdNav).

**Shared props** (available to every page via usePage().props) are defined in app/Http/Middleware/HandleInertiaRequests.php: name, auth.user, sidebarOpen.
**Routing & Wayfinder.** Routes are in routes/web.php and routes/settings.php. The @laravel/vite-plugin-wayfinder plugin generates typed TS helpers from those routes into resources/js/actions/ (controller actions) and resources/js/routes/ (named routes). **These directories are generated — never edit by hand.** Import route helpers from @/actions/... or @/routes/...; they regenerate on vite build/dev.

**Authentication via Fortify.** There are no hand-written login/register/password controllers — Fortify provides them, configured in app/Providers/FortifyServiceProvider.php. Custom user-creation and password-reset logic lives in app/Actions/Fortify/. Reusable validation rules are traits in app/Concerns/ (PasswordValidationRules, ProfileValidationRules). Beyond Settings/, first-party domain controllers now exist under app/Http/Controllers/{Auth,Mahasiswa,Opd,Verifikator}/ for the wired action routes; request validation lives in FormRequests under app/Http/Requests/ (mirroring the same role folders). Role-based route access uses the role: middleware alias → app/Http/Middleware/EnsureUserRole.php (registered in bootstrap/app.php), matching e.g. role:admin_opd or role:admin_opd,admin_verifikator against UserRole->value (403 on mismatch). **Admin login is served by Fortify itself, not a hand-written controller** — config/fortify.php sets `paths.login = 'admin/login'`, and FortifyServiceProvider wires `Fortify::loginView(auth/admin-login)` + `Fortify::authenticateUsing(...)` to match on `username` + password and restrict to admin roles (there is no AdminLoginController). This is separate from the mahasiswa OTP flow (Auth\OtpLoginController). The OTP login (auth/otp-login page, OtpToken model, FormRateLimit) is the project's own addition on top of Fortify; the User.password column stores the active OTP hash rather than a chosen password.

**Anti-abuse layer.** Both login paths apply the InvalidatesOtherSessions trait (app/Concerns/) — the mahasiswa Auth\OtpLoginController and the admin Fortify flow (wired in FortifyServiceProvider): on successful login it clears every other session for that user (database session driver), enforcing single-session-across-devices on top of the per-controller 403 guard. The public submission form is protected by Google reCAPTCHA via the App\Rules\Recaptcha rule — StoreApplicationRequest requires recaptcha_token only when config('services.recaptcha.secret') is set, so tests/local dev without keys still pass. Submission spam is additionally throttled by RateLimitService/FormRateLimit.

**Frontend imports** use the @/ alias → resources/js/ (see tsconfig.json). Add new shadcn components with the shadcn CLI (config in components.json); they land in resources/js/components/ui/.

**Domain service layer.** Business logic lives in app/Services/, not controllers — when the HTTP layer is written, controllers should be thin and delegate here. The lifecycle state machine is SubmissionService (submit, forwardToOpd, approve, reject): each transition runs inside a DB::transaction, calls guardStatus() to reject out-of-order moves (throws DomainException), writes an ApplicationStatusLog audit row, mutates side state (e.g. approve increments the OPD's quota_used), and dispatches a job. Match this shape for new transitions. Other services: CertificateService (upload to the **private** local disk, certificates start is_download_locked = true), OtpService, RateLimitService (anti-spam via FormRateLimit). Two services are bound by contract in app/Providers/AppServiceProvider.php (OtpServiceContract → OtpService, PengajuanServiceContract → SubmissionService) — type-hint the contract, not the class.

**Async side effects: Jobs + Mail + PDF.** Services dispatch queued app/Jobs/* (all on the emails queue, tries = 3 with backoff) for everything user-facing: confirmation, rejection, acceptance letter, certificate notice, OTP. Each job sends an app/Mail/* mailable rendered from resources/views/mail/*.blade.php. PDFs use **barryvdh/laravel-dompdf** — GenerateJobAcceptanceLetter renders resources/views/pdf/acceptance_letter.blade.php, stores it on the private local disk, and records the path on the application. The queue worker runs as part of composer dev; without it, dispatched jobs won't process.

**Private-disk file surfaces.** All user-uploaded files live on the **private** `local` disk (never public) and are served through auth-guarded controllers, never a direct URL — follow this pattern for any new upload. Path columns on internship_applications: `photo_path` (pas foto, served via GET pengajuan/{application}/foto → ApplicationPhotoController, view-policy authorized) plus the optional supporting documents `surat_pengantar_path` / `cv_path` / `portfolio_path` (uploaded "jika ada" from the welcome #daftar form). Users carry `avatar_path` — for mahasiswa it's auto-populated from the registration pas foto at account creation (no separate upload step) and served via GET profile/avatar → ProfileAvatarController (parameter-less, always the authed user, so it can't leak another user's photo). Certificates go through CertificateService onto the same private disk.

**Ticket numbers.** The canonical application ticket format is `MGG-YYYY-NNNNNN` (e.g. `MGG-2026-000042`), generated by SubmissionService::generateTicketNumber (`sprintf('MGG-%d-%06d', ...)`). The public lacak page and every mahasiswa/verifikator/opd page display/validate this format — keep frontend masks/regex in sync. An older `EMG-` prefix was retired; treat any surviving `EMG-` as suspect.

## Tests
Pest v4. Unit tests for services live in tests/Unit/ (SubmissionServiceTest, CertificateServiceTest, OtpServiceTest, RateLimitServiceTest). Feature tests have a **doubly-nested** layout: newer role/flow coverage sits under tests/Feature/Feature/{Auth,Mahasiswa,Opd,Verifikator,Penyelesaian,Security}/ — put new controller/flow tests there to match. tests/Feature/Feature/Penyelesaian/EndToEndFlowTest.php walks the full lifecycle and is the best reference for wiring a new transition; Security/{SingleSessionTest,RecaptchaRateLimitTest} cover the anti-abuse guards.

## Sibling docs
Two design/handoff docs live at the repo root (both in Indonesian): **BLUEPRINT-REDESIGN.md** — the brand-locked (#106feb / #0b4fb0 / #cddcef) UI redesign spec; consult it for layout/typography/interaction decisions. **HANDOFF-BACKEND.md** — the frontend→backend handoff, describing pages built as self-rendering Inertia components with mock-data prop defaults; the contract is to swap mocks for real data **without changing prop paths or names**. Preserve that contract when wiring props.
