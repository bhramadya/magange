<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Enums\UserRole;
use App\Models\User;
use App\Rules\Recaptcha;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureAuthentication();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     *
     * Login admin memakai komponen Inertia yang sudah ada (auth/admin-login,
     * Username + Password). Registrasi & reset password dinonaktifkan di
     * config/fortify.php sehingga view-nya tidak perlu didaftarkan.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn () => Inertia::render('auth/admin-login'));
    }

    /**
     * Login admin: Username + Password, hanya untuk role admin (verifikator /
     * OPD) yang aktif. Menggantikan AdminLoginController lama; logika role,
     * is_active, dan single-session lintas-perangkat dipindah ke sini.
     * Dilindungi reCAPTCHA v3 (action 'admin_login') bila secret terpasang.
     */
    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            // Gerbang anti-bot (R8): validasi token reCAPTCHA v3 sebelum
            // mencocokkan kredensial. Tanpa secret (lokal/test) dilewati.
            if (! empty(config('services.recaptcha.secret'))) {
                $request->validate([
                    'recaptcha_token' => ['required', new Recaptcha($request->ip(), 'admin_login')],
                ], [
                    'recaptcha_token.required' => 'Verifikasi captcha wajib diselesaikan.',
                ]);
            }

            $user = User::query()
                ->where('username', $request->input('username'))
                ->whereIn('role', [UserRole::AdminVerifikator, UserRole::AdminOpd])
                ->first();

            if ($user === null || ! Hash::check((string) $request->input('password'), (string) $user->password)) {
                return null;
            }

            if (! $user->is_active) {
                return null;
            }

            // Audit login (R12): catat waktu login sukses terakhir.
            $user->forceFill(['last_login_at' => Date::now()])->save();

            // Single session lintas-perangkat: tendang sesi user di perangkat/
            // browser lain (driver sesi database) begitu login berhasil.
            $this->invalidateOtherSessions($request, $user);

            return $user;
        });
    }

    /**
     * Hapus seluruh sesi milik user pada perangkat/browser LAIN, menyisakan
     * hanya sesi permintaan saat ini. Selaras dengan trait
     * InvalidatesOtherSessions yang dipakai alur OTP mahasiswa.
     */
    private function invalidateOtherSessions(Request $request, User $user): void
    {
        if (config('session.driver') !== 'database' || ! Schema::hasTable('sessions')) {
            return;
        }

        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
