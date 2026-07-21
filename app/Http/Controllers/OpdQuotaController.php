<?php

namespace App\Http\Controllers;

use App\Http\Requests\Opd\UpdateOpdTagRequest;
use App\Http\Requests\Opd\UpdateQuotaRequest;
use App\Models\Opd;
use Illuminate\Http\RedirectResponse;

/**
 * Kelola kuota & tag magang OPD. Otorisasi kepemilikan ditangani di
 * FormRequest::authorize() (OPD hanya miliknya, Verifikator semua).
 */
class OpdQuotaController extends Controller
{
    public function update(UpdateQuotaRequest $request, Opd $opd): RedirectResponse
    {
        $opd->update([
            'quota_total' => $request->validated()['quota_total'],
        ]);

        return back()->with('success', 'Kuota OPD berhasil diperbarui.');
    }

    /**
     * Tag kompetensi OPD (kolom description, dipisah koma) — sumber tag pada
     * landing page. Admin OPD mengedit miliknya dari dasbor (TagEditor).
     */
    public function updateDescription(UpdateOpdTagRequest $request, Opd $opd): RedirectResponse
    {
        $opd->update([
            'description' => $request->validated()['description'] ?? null,
        ]);

        return back()->with('success', 'Tag OPD berhasil diperbarui.');
    }
}
