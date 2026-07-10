<?php

namespace App\Http\Controllers;

use App\Http\Resources\OpdResource;
use App\Models\Faq;
use App\Models\Opd;
use App\Models\SatisfactionSurvey;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Landing page publik (welcome). Menyediakan FAQ aktif (dikelola Admin
 * Verifikator), daftar OPD aktif untuk pilihan tujuan pada form pendaftaran,
 * serta testimonial dari survei kepuasan peserta yang telah selesai magang.
 */
class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'faqs' => Faq::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'question', 'answer']),
            // Sumber tunggal kuota: OpdResource (quota_total/quota_used dari tabel
            // opds), identik dengan dasbor OPD & Verifikator. Jangan menghitung
            // ulang kuota di frontend.
            'opds' => OpdResource::collection(
                Opd::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get()
            ),
            'testimonials' => $this->testimonials(),
        ]);
    }

    /**
     * Testimonial landing: survei berkomentar dengan rating tinggi (>= 4),
     * terbaru dulu. Nama peserta & asal instansi diambil dari relasi pengajuan.
     *
     * @return array<int, array{id: int, rating: int, comment: string|null, name: string, institution: string|null}>
     */
    private function testimonials(): array
    {
        return SatisfactionSurvey::query()
            ->where('rating', '>=', 4)
            ->whereNotNull('comment')
            ->with('application.user:id,name')
            ->latest('id')
            ->limit(9)
            ->get()
            ->map(fn (SatisfactionSurvey $survey) => [
                'id' => $survey->id,
                'rating' => $survey->rating,
                'comment' => $survey->comment,
                'name' => $survey->application?->user->name ?? 'Peserta Magang',
                'institution' => $survey->application?->institution_name,
            ])
            ->values()
            ->all();
    }
}
