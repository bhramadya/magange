<x-mail::message>
@include('mail.partials.header', ['badge' => 'Menunggu Verifikasi', 'badgeBg' => '#fef3c7', 'badgeText' => '#b45309'])

Halo **{{ $application->user->name }}**,

Terima kasih telah mengajukan permohonan magang. Pengajuan Anda telah **diterima sistem** dan sedang menunggu verifikasi oleh Admin.

{{-- Kartu nomor tiket --}}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0 8px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate; border:1px solid #cddcef; border-radius:14px; background-color:#e8f2fe;">
<tr><td align="center" style="padding:18px 32px;">
<span style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#0b4fb0; padding-bottom:6px;">Nomor Tiket Anda</span>
<span style="display:block; font-size:22px; font-weight:800; letter-spacing:2px; color:#106feb;">{{ $application->ticket_number }}</span>
<span style="display:block; font-size:12px; color:#64748b; padding-top:6px;">Simpan nomor ini untuk memantau status pengajuan</span>
</td></tr>
</table>
</td></tr>
</table>

<x-mail::table>
| Detail | Keterangan |
|:-------|:-----------|
| Tujuan Magang | {{ $application->tujuan_magang }} |
| Asal Instansi | {{ $application->institution_name }} |
| Durasi | {{ $application->duration_months }} bulan |
| Periode | {{ $application->start_date?->format('d/m/Y') }} – {{ $application->end_date?->format('d/m/Y') }} |
</x-mail::table>

Anda dapat memantau perkembangan pengajuan kapan saja melalui halaman **Lacak Status** di portal menggunakan nomor tiket di atas.

Terima kasih,<br>
**E-Magang Kota Madiun**
</x-mail::message>
