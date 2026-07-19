<?php

use App\Http\Middleware\EnsureMustChangePassword;
use App\Http\Middleware\EnsureUserRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SanitizeInput;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Percayai proxy (ngrok/reverse proxy) agar Laravel mendeteksi HTTPS
        // dari header X-Forwarded-* — tanpa ini aset & redirect jadi http://.
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // R7: sanitasi global input string (anti-XSS) — jalan untuk semua
        // request (web) sebelum validasi FormRequest.
        $middleware->append(SanitizeInput::class);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            // R10: admin dengan password auto-generate dipaksa ganti password
            // sebelum membuka halaman apa pun (no-op untuk guest/user biasa).
            EnsureMustChangePassword::class,
        ]);

        // Alias middleware peran: role:admin_verifikator, role:admin_opd, dst.
        $middleware->alias([
            'role' => EnsureUserRole::class,
            'password.changed' => EnsureMustChangePassword::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
