<?php

use App\Models\User;

test('tamu tidak bisa membuka pengaturan', function () {
    $this->get('/pengaturan')->assertRedirect(route('login'));
});

test('user login melihat halaman pengaturan dengan bentuk MagangUser', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/pengaturan')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pengaturan')
            ->where('user.id', $user->id)
            ->where('user.role', 'mahasiswa')
            ->has('user.whatsapp_number'));
});

test('update profil mengubah nama & nomor whatsapp', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch('/pengaturan/profil', [
            'name' => 'Nama Baru',
            'whatsapp_number' => '08987654321',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($user->fresh()->name)->toBe('Nama Baru')
        ->and($user->fresh()->whatsapp_number)->toBe('08987654321');
});

test('update notifikasi persists ke notification_preferences', function () {
    $user = User::factory()->create(['notification_preferences' => ['email_enabled' => false]]);

    $this->actingAs($user)
        ->patch('/pengaturan/notifikasi', [
            'reminder_laporan' => true,
            'ringkasan' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $fresh = $user->fresh();
    expect($fresh->notification_preferences)
        ->toBeArray()
        ->toHaveKey('email_enabled', false)  // tidak dihapus (merge)
        ->toHaveKey('reminder_laporan', true)
        ->toHaveKey('ringkasan', false);
});

test('halaman bantuan butuh login dan menerima prop user', function () {
    $this->get('/bantuan')->assertRedirect(route('login'));

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/bantuan')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('bantuan')->where('user.id', $user->id));
});
