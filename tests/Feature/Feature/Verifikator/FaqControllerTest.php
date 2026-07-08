<?php

use App\Models\Faq;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('verifikator dapat membuka daftar FAQ', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->get('/verifikator/faq')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('verifikator/faq/index')->has('faqs'));
});

test('verifikator dapat menambah FAQ', function () {
    $verifikator = User::factory()->verifikator()->create();

    $this->actingAs($verifikator)
        ->post('/verifikator/faq', [
            'question' => 'Apakah magang berbayar?',
            'answer' => 'Tidak, gratis.',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect(route('verifikator.faq.index'));

    $this->assertDatabaseHas('faqs', [
        'question' => 'Apakah magang berbayar?',
        'created_by' => $verifikator->id,
    ]);
});

test('verifikator dapat memperbarui dan menghapus FAQ', function () {
    $verifikator = User::factory()->verifikator()->create();
    $faq = Faq::create([
        'question' => 'Lama verifikasi?',
        'answer' => '2-3 hari.',
        'sort_order' => 1,
        'is_active' => true,
        'created_by' => $verifikator->id,
    ]);

    $this->actingAs($verifikator)
        ->put("/verifikator/faq/{$faq->id}", [
            'question' => 'Berapa lama verifikasi?',
            'answer' => '2 hari kerja.',
            'sort_order' => 2,
            'is_active' => false,
        ])
        ->assertRedirect(route('verifikator.faq.index'));

    expect($faq->refresh()->is_active)->toBeFalse()
        ->and($faq->question)->toBe('Berapa lama verifikasi?');

    $this->actingAs($verifikator)
        ->delete("/verifikator/faq/{$faq->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('faqs', ['id' => $faq->id]);
});

test('mahasiswa dilarang mengelola FAQ', function () {
    $mahasiswa = User::factory()->create();

    $this->actingAs($mahasiswa)->get('/verifikator/faq')->assertForbidden();
});

test('landing page menerima FAQ aktif dari database', function () {
    $author = User::factory()->verifikator()->create();
    Faq::create(['question' => 'Aktif?', 'answer' => 'Ya', 'sort_order' => 1, 'is_active' => true, 'created_by' => $author->id]);
    Faq::create(['question' => 'Nonaktif?', 'answer' => 'Tidak', 'sort_order' => 2, 'is_active' => false, 'created_by' => $author->id]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome')->has('faqs', 1));
});
