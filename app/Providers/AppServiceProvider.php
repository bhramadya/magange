<?php

namespace App\Providers;

use App\Contracts\OtpServiceContract;
use App\Contracts\PengajuanServiceContract;
use App\Models\InternshipApplication;
use App\Policies\InternshipApplicationPolicy;
use App\Services\OtpService;
use App\Services\SubmissionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(OtpServiceContract::class, OtpService::class);
        $this->app->bind(PengajuanServiceContract::class, SubmissionService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
    }

    /**
     * Register model policies.
     */
    protected function registerPolicies(): void
    {
        Gate::policy(
            InternshipApplication::class,
            InternshipApplicationPolicy::class,
        );
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        // Props Inertia memakai API Resource langsung sebagai array (mis.
        // `applications: InternshipApplication[]`), jadi buang bungkus `data`
        // agar bentuknya persis tipe di resources/js/types/magang.ts.
        JsonResource::withoutWrapping();

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
