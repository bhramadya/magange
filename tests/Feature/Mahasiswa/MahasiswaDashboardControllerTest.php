<?php

use App\Models\InternshipApplication;
use App\Models\User;

test('mahasiswa melihat dashboard dengan pengajuan terbarunya', function () {
    $user = User::factory()->create();
    $application = InternshipApplication::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('mahasiswa/dashboard')
            ->where('user.role', 'mahasiswa')
            ->where('application.ticket_number', $application->ticket_number)
            ->where('application.survey_submitted', false)
            ->where('application.certificate_available', false));
});

test('mahasiswa tanpa pengajuan mendapat application null', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('mahasiswa/dashboard')
            ->where('application', null));
});

test('hanya pengajuan milik sendiri yang dimuat', function () {
    $user = User::factory()->create();
    InternshipApplication::factory()->create(['user_id' => $user->id, 'ticket_number' => 'MGG-2026-1111']);
    InternshipApplication::factory()->create(); // milik user lain

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page->where('application.ticket_number', 'MGG-2026-1111'));
});

test('non-mahasiswa ditolak akses dashboard mahasiswa', function () {
    $admin = User::factory()->verifikator()->create();

    $this->actingAs($admin)->get('/dashboard')->assertForbidden();
});

test('tamu diarahkan ke halaman login', function () {
    $this->get('/dashboard')->assertRedirect(route('login'));
});
