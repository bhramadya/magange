<x-mail::message>
@include('mail.partials.header', ['badge' => 'Pengajuan Disetujui', 'badgeBg' => '#dcfce7', 'badgeText' => '#15803d'])

Halo **{{ $application->user->name }}**,

Selamat! Pengajuan magang Anda telah **disetujui** oleh **{{ $application->opd?->name ?? 'OPD terkait' }}**. Berikut rincian penempatan Anda.

{{-- Kartu nomor tiket --}}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0 8px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate; border:1px solid #cddcef; border-radius:14px; background-color:#e8f2fe;">
<tr><td align="center" style="padding:18px 32px;">
<span style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#0b4fb0; padding-bottom:6px;">Nomor Tiket</span>
<span style="display:block; font-size:22px; font-weight:800; letter-spacing:2px; color:#106feb;">{{ $application->ticket_number }}</span>
</td></tr>
</table>
</td></tr>
</table>

<x-mail::table>
| Rincian | Keterangan |
|:--------|:-----------|
| Asal Instansi | {{ $application->institution_name }} |
| Durasi | {{ $application->duration_months }} bulan |
| Periode | {{ $application->start_date?->translatedFormat('d M Y') }} – {{ $application->end_date?->translatedFormat('d M Y') }} |
| OPD Penempatan | {{ $application->opd?->name ?? '-' }} |
| Divisi / Bidang | {{ $application->division ?? '-' }} |
| Pembimbing Lapangan | {{ $application->field_supervisor ?? '-' }} |
| Penanggung Jawab | {{ $application->person_in_charge ?? '-' }} |
@if($application->verifikator_note)
| Catatan | {{ $application->verifikator_note }} |
@endif
</x-mail::table>

<x-mail::panel>
Anda diharapkan hadir di kantor OPD terkait dengan menemui perwakilan dari bidang **{{ $application->division ?? '-' }}**. Koordinasi tugas dan orientasi lapangan selanjutnya akan dipandu oleh **{{ $application->field_supervisor ?? '-' }}**.
</x-mail::panel>

Surat penerimaan resmi terlampir pada email ini dalam format PDF.

Terima kasih,<br>
**E-Magang Kota Madiun**
</x-mail::message>
