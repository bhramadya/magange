<?php

namespace App\Http\Controllers\Opd;

use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\StoreOpdSignerRequest;
use App\Http\Requests\Opd\UpdateLetterheadRequest;
use App\Http\Requests\Opd\UpdateLetterTemplateRequest;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\OpdLetterTemplate;
use App\Services\LetterDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LetterController extends Controller
{
    public function index(Request $request, LetterDocumentService $letters): Response
    {
        $opd = $request->user()->opd;

        return Inertia::render('opd/surat', [
            // Wajib: halaman ini membungkus dirinya dengan MagangLayout, yang
            // membaca user.role/name — tanpa prop ini render React melempar
            // TypeError dan halaman tampil kosong (blank putih).
            'user' => new MagangUserResource($request->user()),
            'opd' => new OpdResource($opd),
            'templates' => [
                OpdLetterTemplate::TYPE_ACCEPTANCE => OpdLetterTemplate::query()
                    ->where('opd_id', $opd->id)
                    ->where('type', OpdLetterTemplate::TYPE_ACCEPTANCE)
                    ->value('body') ?? $letters->defaultBody(OpdLetterTemplate::TYPE_ACCEPTANCE),
                OpdLetterTemplate::TYPE_CERTIFICATE => OpdLetterTemplate::query()
                    ->where('opd_id', $opd->id)
                    ->where('type', OpdLetterTemplate::TYPE_CERTIFICATE)
                    ->value('body') ?? $letters->defaultBody(OpdLetterTemplate::TYPE_CERTIFICATE),
            ],
            'placeholders' => LetterDocumentService::PLACEHOLDERS,
            'requiredPlaceholders' => LetterDocumentService::REQUIRED_PLACEHOLDERS,
        ]);
    }

    public function updateLetterhead(UpdateLetterheadRequest $request): RedirectResponse
    {
        $request->user()->opd->update($request->validated());

        return back()->with('success', 'Data surat OPD berhasil diperbarui.');
    }

    public function storeSigner(StoreOpdSignerRequest $request): RedirectResponse
    {
        $opd = $request->user()->opd;
        $data = $request->validated();
        $isPrimary = ! $opd->signers()->exists() || ($data['is_primary'] ?? false);

        if ($isPrimary) {
            $opd->signers()->update(['is_primary' => false]);
        }

        $opd->signers()->create([...$data, 'is_primary' => $isPrimary]);

        return back()->with('success', 'Penandatangan berhasil ditambahkan.');
    }

    public function updateTemplate(UpdateLetterTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $missing = array_filter(
            LetterDocumentService::REQUIRED_PLACEHOLDERS[$data['type']],
            fn (string $placeholder): bool => ! str_contains($data['body'], $placeholder),
        );

        if ($missing !== []) {
            return back()->withErrors([
                'body' => 'Placeholder wajib tidak boleh dihapus: '.implode(', ', $missing),
            ]);
        }

        OpdLetterTemplate::query()->updateOrCreate(
            ['opd_id' => $request->user()->opd_id, 'type' => $data['type']],
            ['body' => $data['body']],
        );

        return back()->with('success', 'Template surat berhasil disimpan.');
    }
}
