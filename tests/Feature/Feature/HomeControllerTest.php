<?php

use App\Models\Opd;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('landing page mengirim kuota OPD nyata dari tabel opds (sumber tunggal)', function () {
    // Nama harus cocok dengan daftar OPD di welcome.tsx agar kuota tampil di kartu.
    Opd::create([
        'name' => 'DINAS KOMUNIKASI DAN INFORMATIKA',
        'code' => 'DKI',
        'is_active' => true,
        'quota_total' => 8,
        'quota_used' => 3,
    ]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('opds', 1)
            // Bentuk & angka identik dengan dasbor OPD/Verifikator (OpdResource):
            // quota_total dipetakan -> quota, quota_used apa adanya. Tidak ada
            // angka palsu yang dihitung ulang di frontend.
            ->where('opds.0.quota', 8)
            ->where('opds.0.quota_used', 3)
        );
});

test('landing page tidak menampilkan OPD nonaktif', function () {
    Opd::create(['name' => 'INSPEKTORAT', 'code' => 'INS', 'is_active' => false, 'quota_total' => 5]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome')->has('opds', 0));
});
