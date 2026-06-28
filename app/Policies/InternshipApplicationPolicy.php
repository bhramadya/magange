<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\InternshipApplication;
use App\Models\User;

class InternshipApplicationPolicy
{
    /**
     * Mahasiswa can view their own applications.
     * Admin Verifikator can view all applications.
     * Admin OPD can view applications forwarded to their OPD.
     */
    public function view(User $user, InternshipApplication $application): bool
    {
        return match ($user->role) {
            UserRole::Mahasiswa => $application->user_id === $user->id,
            UserRole::AdminVerifikator => true,
            UserRole::AdminOpd => $application->opd_id === $user->opd_id,
        };
    }

    /**
     * Only the owning mahasiswa can update their application.
     * (Admin updates go through service methods, not direct model updates.)
     */
    public function update(User $user, InternshipApplication $application): bool
    {
        if ($user->role === UserRole::Mahasiswa) {
            return $application->user_id === $user->id;
        }

        if ($user->role === UserRole::AdminOpd) {
            return $application->opd_id === $user->opd_id;
        }

        return false;
    }
}
