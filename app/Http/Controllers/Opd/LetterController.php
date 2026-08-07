<?php

namespace App\Http\Controllers\Opd;

use App\Http\Controllers\Controller;
use App\Http\Requests\Opd\StoreOpdSignerRequest;
use App\Http\Requests\Opd\UpdateLetterheadRequest;
use App\Http\Requests\Opd\UpdateLetterTemplateRequest;
use App\Http\Requests\Opd\UpdateOpdSignerRequest;
use App\Http\Resources\MagangUserResource;
use App\Http\Resources\OpdResource;
use App\Models\Certificate;
use App\Models\InternshipApplication;
use App\Models\OpdLetterTemplate;
use App\Models\OpdSigner;
use App\Services\LetterDocumentService;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LetterController extends Controller
{
    public function index(Request $request, LetterDocumentService $letters): Response
    {
        $opd = $request->user()->opd;
        $cari = trim((string) $request->query('cari', ''));

        return Inertia::render('opd/surat', [
            // Wajib: halaman ini membungkus dirinya dengan MagangLayout, yang
            // membaca user.role/name — tanpa prop ini render React melempar
            // TypeError dan halaman tampil kosong (blank putih).
            'user' => new MagangUserResource($request->user()),
            'opd' => new OpdResource($opd),
            // Penandatangan dikelola penuh (CRUD) di halaman ini sejak setelan
            // surat dipindah dari kartu Kelola OPD.
            'signers' => $opd->signers()
                ->orderByDesc('is_primary')
                ->orderBy('name')
                ->get([
                    'id', 'name', 'degree_prefix', 'degree_suffix', 'title',
                    'rank', 'rank_class', 'on_behalf_of', 'nip', 'nik', 'is_primary',
                ]),
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
            'documents' => $this->signedDocuments($request, $cari),
            'filters' => ['cari' => $cari],
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
        // Orang pertama otomatis jadi penandatangan utama supaya OPD tidak
        // pernah punya daftar tanpa default.
        $isPrimary = ! $opd->signers()->exists() || ($data['is_primary'] ?? false);

        if ($isPrimary) {
            $opd->signers()->update(['is_primary' => false]);
        }

        $opd->signers()->create([...$data, 'is_primary' => $isPrimary]);

        return back()->with('success', 'Penandatangan berhasil ditambahkan.');
    }

    public function updateSigner(UpdateOpdSignerRequest $request, OpdSigner $signer): RedirectResponse
    {
        $this->authorizeSigner($request, $signer);

        $data = $request->validated();
        $isPrimary = (bool) ($data['is_primary'] ?? false) || $signer->is_primary;

        if ($isPrimary) {
            $request->user()->opd->signers()->update(['is_primary' => false]);
        }

        $signer->update([...$data, 'is_primary' => $isPrimary]);

        return back()->with('success', 'Penandatangan berhasil diperbarui.');
    }

    /**
     * Dokumen lama tetap aman: FK `acceptance_signer_id`/`certificates.signer_id`
     * memakai nullOnDelete sementara nama/jabatan/NIP disimpan sebagai snapshot
     * pada baris pengajuan & sertifikat.
     */
    public function destroySigner(Request $request, OpdSigner $signer): RedirectResponse
    {
        $this->authorizeSigner($request, $signer);

        $wasPrimary = $signer->is_primary;
        $signer->delete();

        if ($wasPrimary) {
            $next = $request->user()->opd->signers()->orderBy('id')->first();
            $next?->update(['is_primary' => true]);
        }

        return back()->with('success', 'Penandatangan berhasil dihapus.');
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

    public function downloadSignedAcceptance(Request $request, InternshipApplication $application): StreamedResponse
    {
        abort_unless($application->opd_id === $request->user()->opd_id, 403);
        abort_if($application->acceptance_signed_path === null, 404);
        abort_if(! Storage::disk('local')->exists($application->acceptance_signed_path), 404);

        return Storage::disk('local')->download(
            $application->acceptance_signed_path,
            'Surat Penerimaan ('.$application->user->name.').pdf',
        );
    }

    public function downloadSignedCertificate(Request $request, Certificate $certificate): StreamedResponse
    {
        $certificate->loadMissing('application.user');
        abort_unless($certificate->application?->opd_id === $request->user()->opd_id, 403);
        abort_if($certificate->file_path === '', 404);
        abort_if(! Storage::disk('local')->exists($certificate->file_path), 404);

        return Storage::disk('local')->download(
            $certificate->file_path,
            'Sertifikat ('.$certificate->application->user->name.').pdf',
        );
    }

    /**
     * Arsip dokumen yang SUDAH ditandatangani & diunggah, dari dua sumber
     * (surat penerimaan pada pengajuan + sertifikat), digabung di PHP karena
     * bentuk barisnya berbeda. Pencarian utama memakai Nomor SK.
     *
     * @return list<array<string, mixed>>
     */
    private function signedDocuments(Request $request, string $cari): array
    {
        $opdId = $request->user()->opd_id;
        $cocok = $this->pencarianPengajuan($cari);

        $acceptances = InternshipApplication::query()
            ->with('user')
            ->where('opd_id', $opdId)
            ->whereNotNull('acceptance_signed_path')
            ->when($cari !== '', $cocok)
            ->get()
            ->map(fn (InternshipApplication $application): array => [
                'key' => 'acceptance-'.$application->id,
                'type' => 'acceptance',
                'type_label' => 'Surat Penerimaan',
                'sk_number' => $application->sk_number,
                'participant' => $application->user->name,
                'ticket_number' => $application->ticket_number,
                'issued_at' => $application->updated_at?->toIso8601String(),
                'download_url' => route('opd.surat.arsip.penerimaan', $application),
            ]);

        $certificates = Certificate::query()
            ->with('application.user')
            ->whereHas('application', fn (Builder $query): Builder => $query->where('opd_id', $opdId))
            ->where('file_path', '!=', '')
            ->when($cari !== '', fn (Builder $query): Builder => $query->whereHas('application', $cocok))
            ->get()
            ->map(fn (Certificate $certificate): array => [
                'key' => 'certificate-'.$certificate->id,
                'type' => 'certificate',
                'type_label' => 'Sertifikat',
                'sk_number' => $certificate->application?->sk_number,
                'participant' => $certificate->application?->user->name,
                'ticket_number' => $certificate->application?->ticket_number,
                'issued_at' => $certificate->updated_at?->toIso8601String(),
                'download_url' => route('opd.surat.arsip.sertifikat', $certificate),
            ]);

        return array_values(
            $acceptances->concat($certificates)
                ->sortByDesc('issued_at')
                ->all(),
        );
    }

    /**
     * Filter pencarian arsip: Nomor SK lebih dulu (itu yang dicari admin),
     * nomor tiket & nama peserta sebagai jaring.
     *
     * Grup OR SELALU dibungkus `where()` bersarang — di dalam `whereHas`,
     * `orWhere` yang tidak dibungkus keluar dari klausa korelasi sehingga
     * sertifikat mana pun ikut cocok begitu ada satu pengajuan yang cocok.
     *
     * @return Closure(Builder<InternshipApplication>): Builder<InternshipApplication>
     */
    private function pencarianPengajuan(string $cari): Closure
    {
        $kunci = '%'.mb_strtolower($cari).'%';

        return fn (Builder $query): Builder => $query->where(
            fn (Builder $inner): Builder => $inner
                ->whereRaw('lower(sk_number) like ?', [$kunci])
                ->orWhereRaw('lower(ticket_number) like ?', [$kunci])
                ->orWhereHas('user', fn (Builder $user): Builder => $user
                    ->whereRaw('lower(name) like ?', [$kunci])),
        );
    }

    private function authorizeSigner(Request $request, OpdSigner $signer): void
    {
        abort_unless($signer->opd_id === $request->user()->opd_id, 403);
    }
}
