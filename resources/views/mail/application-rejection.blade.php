<x-mail::message>
@include('mail.partials.header', ['badge' => 'Ditolak', 'badgeBg' => '#fee2e2', 'badgeText' => '#b91c1c'])

@php
    // Tanda tangan menyesuaikan aktor penolak: Admin Verifikator atau Admin OPD.
    $penolak = $application->opdDecisionBy?->role?->value === 'admin_opd'
        ? 'Admin OPD'
        : 'Admin Verifikator';
@endphp

Halo **{{ $application->user->name }}**,

Pengajuan magang Anda dengan nomor tiket **{{ $application->ticket_number }}** telah **ditolak**.

{{-- Rincian lengkap pengajuan peserta --}}
<x-mail::table>
| Rincian | Keterangan |
|:--------|:-----------|
| NIS / NIM | {{ $application->nis ?? '-' }} |
| Nama Lengkap | {{ $application->user->name }} |
| Asal Instansi | {{ $application->institution_name }} |
| Tujuan Bidang OPD | {{ $application->tujuan_magang }} |
| Jurusan | {{ $application->major ?? '-' }} |
| Keahlian | {{ $application->skills ?? '-' }} |
| Alamat Lengkap | {{ $application->address ?? '-' }} |
| Periode | {{ $application->start_date?->translatedFormat('d M Y') }} – {{ $application->end_date?->translatedFormat('d M Y') }} |
| Dosen / Guru Pembimbing | {{ $application->campus_supervisor }} |
| Penanggung Jawab | {{ $application->guardian_name ?? '-' }} |
| Nomor WhatsApp | {{ $application->user->whatsapp_number ?? '-' }} |
| Email | {{ $application->user->email }} |
</x-mail::table>

@if($application->rejection_reason)
<x-mail::panel>
**Alasan penolakan:** {{ $application->rejection_reason }}
</x-mail::panel>
@endif

Kami menghargai pengajuan magang yang Anda kirimkan. Namun, setelah melalui proses seleksi, kami menginformasikan bahwa pengajuan Anda belum dapat disetujui. Terima kasih atas partisipasi Anda dan semoga sukses di kesempatan lain.

Hormat kami,<br>
**{{ $penolak }}**<br>
Pemerintah Kota Madiun
</x-mail::message>
