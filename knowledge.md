# Project Knowledge — E-Magang Kota Madiun (magange)

Internship application portal for Pemerintah Kota Madiun. Three roles: **Mahasiswa** (applicant), **Admin Verifikator** (screens applications), **Admin OPD** (placement agency). UI, comments, and domain terms are in **Indonesian**.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | Inertia v3 + React 19 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york style) |
| Database | PostgreSQL (default), MySQL/MariaDB/SQLite supported |
| Auth | Laravel Fortify (admin) + custom OTP (mahasiswa) |
| Testing | Pest v4 (PHP) + Vitest (JS planned) |
| Linting | Pint (PHP), ESLint 9 (JS/TS), Prettier 3 (formatting) |
| PDF | barryvdh/laravel-dompdf |
| Images | intervention/image |

---

## Quickstart Commands

### Everyday dev
```bash
composer dev
```
Runs concurrently: `php artisan serve` + `queue:listen --queue=emails,default` + `npm run dev` (Vite HMR). The queue worker is essential — without it, dispatched Jobs/Mail never process.

### Individual actions
```bash
npm run dev          # Vite dev server (frontend HMR)
npm run build        # Production build
npm run lint         # ESLint --fix (JS/TS)
npm run format       # Prettier --write (resources/)
npm run types:check  # tsc --noEmit (TS type check)

composer lint        # Pint (PHP style fix)
composer test        # Pint check + PHPStan + php artisan test
composer types:check # phpstan analyse
```

### Testing
```bash
php artisan test --compact                          # All tests
php artisan test --filter=SubmissionServiceTest     # Single file
```

### Database
```bash
php artisan migrate:fresh --seed   # Full reseed (order: OPD → Admin → FAQ → Registration)
```

### Queue
```bash
php artisan queue:listen --queue=emails,default --tries=1
```

### Cron (daily status transitions)
```bash
php artisan schedule:test --name="magang:transition-statuses"  # Dry run
```

---

## Architecture

### Key Directories

| Path | Purpose |
|---|---|
| `app/` | PHP backend: Models, Services, Controllers, Enums, Jobs, Mail |
| `app/Http/Controllers/{Auth,Mahasiswa,Opd,Verifikator}/` | Role-specific controllers |
| `app/Services/` | Business logic layer (SubmissionService, OtpService, etc.) |
| `app/Enums/` | UserRole, ApplicationStatus, DocumentType, etc. |
| `app/Jobs/` | Queued jobs (email, PDF generation) |
| `app/Mail/` | Mailable classes |
| `resources/js/` | React frontend |
| `resources/js/pages/` | Inertia page components |
| `resources/js/layouts/` | Layouts (AuthLayout, AppLayout, MagangLayout) |
| `resources/js/components/` | Shared React components |
| `resources/js/components/ui/` | shadcn/ui components |
| `resources/js/types/` | TypeScript type definitions |
| `resources/js/actions/` & `resources/js/routes/` | **Auto-generated** Wayfinder route helpers |
| `routes/web.php` | Main routes (with extensive inline docs) |
| `routes/console.php` | Cron/schedule commands |
| `tests/Feature/Feature/{Auth,Mahasiswa,Opd,Verifikator,Penyelesaian,Security}/` | Role/flow tests |
| `tests/Unit/` | Service unit tests |
| `database/migrations/` | DB migrations |
| `database/seeders/` | Seeders (must run in order: OPD → Admin → FAQ → Registration) |

### Data Flow

**Inertia, not an API.** Controllers return `Inertia::render('page-name', [...props])`. React page components receive those props directly. There is no REST/JSON API layer.

**Authentication split:**
- **Mahasiswa:** Email → OTP (no password)
- **Admin (Verifikator & OPD):** Username + Password at `/admin/login`

**Application lifecycle:** `pending_verifikator` → `forwarded_opd` → `approved` → `ongoing` → `completion_submitted` → `completed` (with `rejected` as terminal)

**State transitions** happen through services (SubmissionService) inside DB transactions, writing audit logs and dispatching jobs.

**File uploads** go to the **private** local disk, served through auth-guarded controllers (never direct URLs).

---

## Conventions

### Naming & Style
- **Indonesian** for all UI text, comments, and domain terms
- PHP: constructor property promotion, explicit return types, curly braces always
- Follow sibling file conventions when editing

### Application Status Flow (CRITICAL)
- Only valid transitions allowed (guarded by `SubmissionService::guardStatus()`)
- Each transition writes `ApplicationStatusLog` audit row
- Daily cron at 01:00 auto-transitions: approved→ongoing (start_date==today), ongoing→completed (end_date==today)

### Role Permissions
- **Mahasiswa:** View own application, upload final report, fill survey, download certificate
- **Admin Verifikator:** Screen all incoming apps, forward/reject, manage OPD quota, upload certificates, manage FAQs
- **Admin OPD:** Decide on forwarded apps (approve/reject), manage own participants & quota
- **Single session per user** enforced (InvalidatesOtherSessions trait + database session driver)

### Frontend
- `@/` alias → `resources/js/`
- Page components import their own `MagangLayout` (role dashboards, branded public pages)
- Starter-kit pages (auth/*, settings/*) use global layout mapping in `app.tsx`
- Wayfinder route helpers are auto-generated — never edit `resources/js/actions/` or `resources/js/routes/` by hand
- Brand colors: `#106feb` (primary), `#0b4fb0` (hover), `#cddcef` (light)

### Testing
- Write tests for every change (Pest for PHP, Vitest planned for JS)
- New feature tests go in `tests/Feature/Feature/{role}/` directory
- Use factories with custom states before manual setup

### Going to Production
- [Laravel Cloud](https://cloud.laravel.com/) is the recommended deployment platform

### Gotchas
- Queue worker must be running for emails/PDFs to send
- Running `composer dev` uses npm, not pnpm — keep lockfiles consistent
- `.env` DB connection must be reachable for artisan/test commands
- reCAPTCHA keys optional in local dev (rule checks `config('services.recaptcha.secret')`)
- Mock data props still exist as fallbacks — don't strip until real backend prop is wired
- Vite manifest error? Run `npm run build` or start `npm run dev`
