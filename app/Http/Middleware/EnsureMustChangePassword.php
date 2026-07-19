<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Paksa admin (OPD/verifikator) dengan password auto-generate mengganti
 * passwordnya sebelum mengakses dasbor (R10). Alias: password.changed.
 *
 * Rute ganti password sendiri (admin/password-baru) dan logout dikecualikan
 * agar tidak terjadi redirect loop.
 */
class EnsureMustChangePassword
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user !== null
            && $user->must_change_password
            && ! $request->routeIs('password.force.*')
            && ! $request->routeIs('logout')
        ) {
            return redirect()->route('password.force.show');
        }

        return $next($request);
    }
}
