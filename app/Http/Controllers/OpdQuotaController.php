<?php

namespace App\Http\Controllers;

use App\Http\Requests\Opd\UpdateQuotaRequest;
use App\Models\Opd;
use Illuminate\Http\RedirectResponse;

/**
 * Kelola kuota magang OPD. Otorisasi kepemilikan ditangani di
 * UpdateQuotaRequest::authorize() (OPD hanya miliknya, Verifikator semua).
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
}
