<?php

namespace App\Http\Controllers\Verifikator;

use App\Http\Controllers\Controller;
use App\Services\SkNumberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Atur start number counter Nomor SK (R5): admin dapat menentukan nomor urut
 * awal (mis. mulai dari 40) untuk surat penerimaan maupun penyelesaian.
 */
class SkCounterController extends Controller
{
    public function __construct(private SkNumberService $skNumbers) {}

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'in:acceptance,completion'],
            'start_number' => ['required', 'integer', 'min:1', 'max:999999'],
        ], [
            'key.in' => 'Jenis counter tidak dikenal.',
            'start_number.required' => 'Nomor awal wajib diisi.',
            'start_number.integer' => 'Nomor awal harus berupa angka.',
            'start_number.min' => 'Nomor awal minimal 1.',
        ]);

        $this->skNumbers->setStart($validated['key'], (int) $validated['start_number']);

        return back()->with('success', "Nomor awal SK diatur ke {$validated['start_number']}.");
    }
}
