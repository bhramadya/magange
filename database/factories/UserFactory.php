<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'whatsapp_number' => '08'.fake()->numerify('##########'),
            'password' => static::$password ??= Hash::make('123456'),
            'role' => UserRole::Mahasiswa,
            'opd_id' => null,
            'is_active' => true,
        ];
    }

    /**
     * Akun Admin Verifikator.
     */
    public function verifikator(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::AdminVerifikator,
        ]);
    }

    /**
     * Akun Admin OPD (wajib di-pasangkan dengan opd_id).
     */
    public function opdAdmin(int $opdId): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::AdminOpd,
            'opd_id' => $opdId,
        ]);
    }
}
