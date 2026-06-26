# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**E-Magang Kota Madiun** ("magange") — an internship-application portal for the Madiun city government. Three roles (`app/Enums/UserRole.php`): **Mahasiswa** (applicant), **Admin Verifikator** (screens incoming applications), **Admin OPD** (the placement agency that approves/rejects and manages active interns). UI, code comments, and domain terms are in **Indonesian** — match that language when editing.

The application lifecycle is the enum `app/Enums/ApplicationStatus.php`: `pending_verifikator → forwarded_opd → approved → ongoing → completion_submitted → completed` (with `rejected` as a terminal branch). `InternshipApplication` is the central model; supporting models cover OPDs, OTP tokens, status-log audit trail, documents, final reports, satisfaction surveys, FAQs, and form rate-limiting.

## Stack

Laravel 13 (PHP 8.3+) + Inertia v3 + React 19 + TypeScript, built on the `laravel/react-starter-kit`. Vite for bundling, Tailwind v4 for styling, shadcn/ui ("new-york" style) for components, Pest v4 for tests, PostgreSQL for the database. Authentication is handled by Laravel Fortify, plus a custom WhatsApp/email OTP login flow.

Detailed framework conventions (PHP style, Inertia v3 patterns, Pint, Pest, Wayfinder, Boost MCP tooling) live in `AGENTS.md` — read it before non-trivial changes. Domain-specific skills (Inertia/React, Wayfinder, Fortify, Pest, Tailwind, Laravel best-practices) live in `.cursor/skills/**`; AGENTS.md requires activating the relevant skill when working in that domain. This file covers what's specific to *this* repo.

## Commands

```bash
composer dev            # Run everything: php serve + queue listener + vite (use this for local dev)
npm run dev             # Vite only
npm run build           # Production build (run if frontend changes don't appear in the UI)

composer test           # Full check: config clear + pint --test + phpstan + artisan test
php artisan test --compact                      # Run all tests
php artisan test --compact --filter=testName    # Run a single test by name
php artisan test --compact tests/Feature/Settings/ProfileUpdateTest.php  # Single file

vendor/bin/pint --dirty --format agent   # Format changed PHP (run before finalizing PHP edits)
npm run lint            # eslint --fix
npm run types:check     # tsc --noEmit
phpstan analyse         # Static analysis (larastan, level in phpstan.neon)

php artisan wayfinder:generate --with-form --no-interaction  # Manually regenerate TS route helpers (normally automatic via the vite plugin)
```

`composer ci:check` mirrors the GitHub Actions CI (`.github/workflows/`): lint + format + types + tests.

## Current phase: frontend preview, backend not yet wired

Read the comment block at the top of `routes/web.php` before touching routing. The dashboard/feature routes are **temporary `Route::inertia()` previews** — no auth, no middleware, no controller props. Each page renders from its own hard-coded mock data so the whole navigation is clickable during UI review. The plan is for backend work to (1) swap `Route::inertia(...)` for controllers returning `Inertia::render(...)` with real props and (2) wrap dashboard routes in `auth` + role middleware — **keeping the same paths** so frontend `href`s don't change. Don't mistake the current prop-less routes for the intended architecture, and don't strip the mock data until the matching backend prop is in place.

The domain backend (models, enums, migrations, seeders in `database/seeders/` — `AdminSeeder`, `OpdSeeder`, `FaqSeeder`) largely exists already; the controllers/wiring connecting it to the Inertia pages are what's pending.

## Architecture

**Inertia, not an API.** Controllers return `Inertia::render('page-name', [...props])` (or `Route::inertia()` for prop-less pages). React page components live in `resources/js/pages/` and receive those props directly. There is no REST/JSON API layer — server and client are coupled through Inertia.

**Layouts: starter-kit pages are global, role dashboards self-wrap.** `resources/js/app.tsx`'s `layout()` callback maps by page name: `auth/*` → `AuthLayout`, `settings/*` → `[AppLayout, SettingsLayout]`, everything else → `AppLayout`. **But** the role dashboards and branded public pages (`mahasiswa/*`, `verifikator/*`, `opd/*`, `auth/otp-login`, `pengajuan/baru`, `lacak`, `bantuan`, `pengaturan`, `welcome`) return `null` there and instead import and wrap **`MagangLayout`** (`resources/js/layouts/magang-layout.tsx`) themselves. So whether a page imports its own layout depends on which group it's in — check `app.tsx` first. `MagangLayout` is the branded (Pemkot Madiun blue `#106feb`) dashboard shell; it takes `navItems` and exports per-role nav arrays (`mahasiswaNav`, `verifikatorNav`, `opdNav`).

**Shared props** (available to every page via `usePage().props`) are defined in `app/Http/Middleware/HandleInertiaRequests.php`: `name`, `auth.user`, `sidebarOpen`.

**Routing & Wayfinder.** Routes are in `routes/web.php` and `routes/settings.php`. The `@laravel/vite-plugin-wayfinder` plugin generates typed TS helpers from those routes into `resources/js/actions/` (controller actions) and `resources/js/routes/` (named routes). **These directories are generated — never edit by hand.** Import route helpers from `@/actions/...` or `@/routes/...`; they regenerate on `vite` build/dev.

**Authentication via Fortify.** There are no hand-written login/register/password controllers — Fortify provides them, configured in `app/Providers/FortifyServiceProvider.php`. Custom user-creation and password-reset logic lives in `app/Actions/Fortify/`. Reusable validation rules are traits in `app/Concerns/` (`PasswordValidationRules`, `ProfileValidationRules`). The only first-party controllers so far are under `app/Http/Controllers/Settings/` — domain controllers for the magang flow are still to be written (see the preview-phase note above). The OTP login (`auth/otp-login` page, `OtpToken` model, `FormRateLimit`) is the project's own addition on top of Fortify; the `User.password` column stores the active OTP hash rather than a chosen password.

**Frontend imports** use the `@/` alias → `resources/js/` (see `tsconfig.json`). Add new shadcn components with the shadcn CLI (config in `components.json`); they land in `resources/js/components/ui/`.

## Important gotcha: two `resources` trees

There are **two parallel frontend trees**:
- `resources/js/` + `resources/css/app.css` — the **active** code. This is what `vite.config.ts` builds and what `@/*` resolves to.
- `resources/Resources/js/` + `resources/Resources/css/` (capital `R`) — added in the "FrontEnd" commit and **not wired into Vite or tsconfig**. It contains in-progress UI work (sidebar variants, calendars, team-switcher, etc.) that is not yet live.

When editing the running app, work in lowercase `resources/js/`. Do not assume a component under `resources/Resources/` is in use — confirm which tree a file belongs to before editing.
