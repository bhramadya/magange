<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Date;

/**
 * @extends Factory<InternshipApplication>
 */
class InternshipApplicationFactory extends Factory
{
    protected $model = InternshipApplication::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ticket_number' => 'MGG-2026-'.fake()->unique()->numerify('####'),
            'user_id' => User::factory(),
            'tujuan_magang' => fake()->sentence(),
            'duration_months' => 3,
            'start_date' => '2026-07-01',
            'end_date' => '2026-09-30',
            'institution_name' => fake()->company(),
            'campus_supervisor' => fake()->name(),
            'status' => ApplicationStatus::PendingVerifikator,
        ];
    }

    /**
     * Pengajuan yang sudah diteruskan ke OPD tertentu.
     */
    public function forwardedTo(int $opdId): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => ApplicationStatus::ForwardedOpd,
            'opd_id' => $opdId,
            'division' => 'Bidang Pengembangan Aplikasi',
            'field_supervisor' => 'Bayu Pratama, S.Kom.',
            'person_in_charge' => 'Kepala Bidang TIK',
            'forwarded_at' => Date::now(),
        ]);
    }
}
