<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

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
        $start = $this->faker->dateTimeBetween('now', '+1 month');
        $end = (clone $start)->modify('+3 months');

        return [
            'ticket_number' => sprintf('MGG-2026-%06d', $this->faker->unique()->numberBetween(1, 999999)),
            'user_id' => User::factory(),
            'tujuan_magang' => $this->faker->sentence(),
            'duration_months' => 3,
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'institution_name' => $this->faker->company(),
            'campus_supervisor' => $this->faker->name(),
            'major' => $this->faker->optional()->word(),
            'skills' => $this->faker->optional()->sentence(),
            'status' => ApplicationStatus::PendingVerifikator,
        ];
    }

    /**
     * Pengajuan dengan status tertentu.
     */
    public function status(ApplicationStatus $status): static
    {
        return $this->state(fn (): array => ['status' => $status]);
    }
}
