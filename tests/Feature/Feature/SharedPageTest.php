<?php

use App\Enums\UserRole;
use App\Models\Faq;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// Regresi: halaman Bantuan & Pengaturan pernah pakai Route::inertia tanpa props,
// sehingga selalu menampilkan MOCK_USER (nama salah) untuk semua user.
it('menampilkan nama user yang login di halaman Bantuan untuk setiap peran', function (UserRole $role) {
    $user = User::factory()->create([
        'name' => 'Nama Unik '.$role->value,
        'role' => $role,
    ]);

    $this->actingAs($user)
        ->get('/bantuan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bantuan')
            ->where('user.name', 'Nama Unik '.$role->value)
            ->where('user.role', $role->value)
        );
})->with([
    'mahasiswa' => UserRole::Mahasiswa,
    'admin_verifikator' => UserRole::AdminVerifikator,
    'admin_opd' => UserRole::AdminOpd,
]);

it('menampilkan nama user yang login di halaman Pengaturan', function () {
    $user = User::factory()->create(['name' => 'Pengguna Pengaturan']);

    $this->actingAs($user)
        ->get('/pengaturan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pengaturan')
            ->where('user.name', 'Pengguna Pengaturan')
        );
});

it('menolak tamu (harus login) di halaman bersama', function () {
    $this->get('/bantuan')->assertRedirect();
    $this->get('/pengaturan')->assertRedirect();
});

// Regresi FAQ: verifikator/faq/{index,create,edit} pernah render tanpa prop user
// sehingga sidebar menampilkan MOCK_USER "Dewi Anggraini", bukan admin yang login.
it('menampilkan nama Admin Verifikator yang login di seluruh halaman Kelola FAQ', function () {
    $user = User::factory()->create([
        'name' => 'Verifikator FAQ Unik',
        'role' => UserRole::AdminVerifikator,
    ]);
    $faq = Faq::create([
        'question' => 'Pertanyaan uji?',
        'answer' => 'Jawaban uji.',
        'sort_order' => 0,
        'is_active' => true,
        'created_by' => $user->id,
    ]);

    foreach ([
        '/verifikator/faq' => 'verifikator/faq/index',
        '/verifikator/faq/create' => 'verifikator/faq/create',
        "/verifikator/faq/{$faq->id}/edit" => 'verifikator/faq/edit',
    ] as $url => $component) {
        $this->actingAs($user)
            ->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component($component)
                ->where('user.name', 'Verifikator FAQ Unik')
                ->where('user.role', UserRole::AdminVerifikator->value)
            );
    }
});
