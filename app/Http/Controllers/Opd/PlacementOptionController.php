<?php

namespace App\Http\Controllers\Opd;

use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\StorePlacementOptionRequest;
use App\Http\Requests\Opd\UpdatePlacementOptionRequest;
use App\Models\OpdPlacementOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Master penempatan milik Admin OPD: bidang, pembimbing lapangan, dan
 * penanggung jawab. Endpoint tidak pernah menerima id OPD — selalu OPD milik
 * admin yang sedang masuk (pola yang sama dengan LetterController/TteController).
 */
class PlacementOptionController extends Controller
{
    public function store(StorePlacementOptionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        OpdPlacementOption::query()->create([
            'opd_id' => $request->user()->opd_id,
            'type' => $data['type'],
            'name' => $data['name'],
        ]);

        return back()->with('success', 'Data penempatan berhasil ditambahkan.');
    }

    public function update(UpdatePlacementOptionRequest $request, OpdPlacementOption $option): RedirectResponse
    {
        $this->authorizeOption($request, $option);

        $option->update(['name' => $request->validated()['name']]);

        return back()->with('success', 'Data penempatan berhasil diperbarui.');
    }

    public function destroy(Request $request, OpdPlacementOption $option): RedirectResponse
    {
        $this->authorizeOption($request, $option);

        $option->delete();

        return back()->with('success', 'Data penempatan berhasil dihapus.');
    }

    /**
     * Admin OPD hanya boleh menyentuh master penempatan OPD-nya sendiri.
     */
    private function authorizeOption(Request $request, OpdPlacementOption $option): void
    {
        abort_unless($option->opd_id === $request->user()->opd_id, 403);
    }
}
