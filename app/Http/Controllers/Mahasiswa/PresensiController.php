<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mahasiswa\StorePresensiRequest;
use App\Http\Resources\MagangUserResource;
use App\Models\PresensiAttachment;
use App\Models\PresensiLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Absen Harian peserta magang (revisi #22, dirombak batch 5): status
 * hadir/izin/sakit, tanggal otomatis hari ini, maksimal 1x per hari, dan
 * Dokumentasi Foto wajib 1–3 (disk privat). Riwayat dikirim sebagai prop
 * `entries` agar tombol Export (Word/Excel, sisi klien) mencakup seluruh
 * entri; jam absen dibaca dari created_at.
 */
class PresensiController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = PresensiLog::query()
            ->where('user_id', $request->user()->id)
            ->with('attachments')
            ->orderByDesc('activity_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PresensiLog $log): array => self::entryPayload($log));

        return Inertia::render('mahasiswa/presensi', [
            'user' => new MagangUserResource($request->user()),
            'entries' => $entries,
            'hasToday' => PresensiLog::query()
                ->where('user_id', $request->user()->id)
                ->whereDate('activity_date', Date::today())
                ->exists(),
        ]);
    }

    public function store(StorePresensiRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $today = Date::today();

        // 1x per hari (unique user_id+activity_date di DB sebagai backstop).
        $alreadyExists = PresensiLog::query()
            ->where('user_id', $request->user()->id)
            ->whereDate('activity_date', $today)
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors(['status' => 'Anda sudah presensi hari ini.']);
        }

        DB::transaction(function () use ($request, $validated, $today): void {
            $log = PresensiLog::create([
                'user_id' => $request->user()->id,
                'activity_date' => $today,
                'status' => $validated['status'],
                'details' => $validated['details'],
            ]);

            // Dokumentasi Foto → disk privat, dilayani route ter-otorisasi.
            foreach ($request->file('attachments', []) as $file) {
                $path = $file->store("presensi/{$log->id}", 'local');

                PresensiAttachment::create([
                    'presensi_log_id' => $log->id,
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                ]);
            }
        });

        return back()->with('success', 'Presensi berhasil disimpan.');
    }

    /**
     * Sajikan lampiran presensi (disk privat). Boleh dibuka oleh: pemilik
     * log, Admin Verifikator (semua), atau Admin OPD yang memiliki pengajuan
     * user tsb di OPD-nya (batch 5 — admin melihat foto presensi).
     */
    public function attachment(Request $request, PresensiLog $log, PresensiAttachment $attachment): StreamedResponse
    {
        abort_unless($this->canViewLog($request, $log), 403);
        abort_if($attachment->presensi_log_id !== $log->id, 404);
        abort_if(! Storage::disk('local')->exists($attachment->path), 404);

        return Storage::disk('local')->response($attachment->path, $attachment->original_name);
    }

    /**
     * Hapus satu entri presensi milik sendiri (beserta lampirannya).
     */
    public function destroy(Request $request, PresensiLog $log): RedirectResponse
    {
        abort_if($log->user_id !== $request->user()->id, 403);

        foreach ($log->attachments as $attachment) {
            Storage::disk('local')->delete($attachment->path);
        }

        $log->delete();

        return back()->with('success', 'Presensi berhasil dihapus.');
    }

    /**
     * Bentuk payload satu entri presensi — dipakai juga oleh panel admin
     * (Opd\DashboardController@peserta, Verifikator\UserController@index).
     *
     * @return array<string, mixed>
     */
    public static function entryPayload(PresensiLog $log): array
    {
        return [
            'id' => $log->id,
            'activity_date' => $log->activity_date->toDateString(),
            'status' => $log->status,
            'checked_in_at' => $log->created_at?->toIso8601String(),
            'details' => $log->details,
            'attachments' => $log->attachments->map(fn (PresensiAttachment $file): array => [
                'id' => $file->id,
                'name' => $file->original_name,
                'url' => route('presensi.lampiran', [$log, $file]),
            ])->values()->all(),
        ];
    }

    private function canViewLog(Request $request, PresensiLog $log): bool
    {
        $user = $request->user();

        if ($log->user_id === $user->id) {
            return true;
        }

        if ($user->role->value === 'admin_verifikator') {
            return true;
        }

        // Admin OPD: hanya bila pemilik log punya pengajuan di OPD-nya.
        return $user->role->value === 'admin_opd'
            && $user->opd_id !== null
            && $log->user->applications()->where('opd_id', $user->opd_id)->exists();
    }
}
