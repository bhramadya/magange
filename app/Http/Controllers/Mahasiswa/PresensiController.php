<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mahasiswa\StorePresensiRequest;
use App\Http\Resources\MagangUserResource;
use App\Models\PresensiAttachment;
use App\Models\PresensiLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Log Presensi Harian peserta magang (revisi #22): input tanggal, jam mulai/
 * selesai, rincian aktivitas, dan lampiran multiple (disk privat). Riwayat
 * dikirim sebagai prop `entries` agar tombol Export (Word/Excel, sisi klien)
 * mencakup seluruh entri.
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
            ->map(fn (PresensiLog $log): array => [
                'id' => $log->id,
                'activity_date' => $log->activity_date->toDateString(),
                'start_time' => substr($log->start_time, 0, 5),
                'end_time' => substr($log->end_time, 0, 5),
                'details' => $log->details,
                'attachments' => $log->attachments->map(fn (PresensiAttachment $file): array => [
                    'id' => $file->id,
                    'name' => $file->original_name,
                    'url' => route('presensi.lampiran', [$log, $file]),
                ])->values()->all(),
            ]);

        return Inertia::render('mahasiswa/presensi', [
            'user' => new MagangUserResource($request->user()),
            'entries' => $entries,
        ]);
    }

    public function store(StorePresensiRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated): void {
            $log = PresensiLog::create([
                'user_id' => $request->user()->id,
                'activity_date' => $validated['activity_date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'details' => $validated['details'],
            ]);

            // Lampiran multiple → disk privat, dilayani route ter-otorisasi.
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
     * Sajikan lampiran presensi (disk privat) — hanya pemilik log.
     */
    public function attachment(Request $request, PresensiLog $log, PresensiAttachment $attachment): StreamedResponse
    {
        abort_if($log->user_id !== $request->user()->id, 403);
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
}
