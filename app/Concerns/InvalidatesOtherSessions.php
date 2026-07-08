<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Single-session lintas-perangkat: setelah login, hapus seluruh sesi milik
 * user pada perangkat/browser LAIN sehingga hanya sesi saat ini yang aktif.
 *
 * Baseline "1 browser per sesi" tetap dijaga oleh guard 403 di controller
 * login; trait ini memperluasnya ke seluruh perangkat (driver sesi database).
 */
trait InvalidatesOtherSessions
{
    protected function invalidateOtherSessions(Request $request, User $user): void
    {
        // Hanya relevan untuk driver sesi database (tabel `sessions`).
        if (config('session.driver') !== 'database' && ! Schema::hasTable('sessions')) {
            return;
        }

        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();
    }
}
