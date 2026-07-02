<x-mail::message>
{{-- Header branded: judul biru besar + badge status --}}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding-bottom: 8px;">
<span style="display:inline-block; font-size:30px; line-height:1.2; font-weight:800; color:#106feb; letter-spacing:-0.5px;">
Magang Kota Madiun
</span>
</td></tr>
<tr><td align="center" style="padding-bottom: 20px;">
<span style="display:inline-block; padding:6px 18px; border-radius:9999px; background:#dcfce7; color:#15803d; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
Disetujui
</span>
</td></tr>
</table>

Halo **{{ $application->user->name }}**,

Selamat! Pengajuan magang Anda dengan nomor tiket **{{ $application->ticket_number }}** telah **disetujui** oleh {{ $application->opd?->name ?? 'OPD terkait' }}.

{{-- Rincian magang peserta --}}
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
**Langkah selanjutnya:** Silakan datang ke kantor **{{ $application->opd?->name ?? 'OPD terkait' }}**, menemui bidang **{{ $application->division ?? '-' }}**, dengan pembimbing lapangan **{{ $application->field_supervisor ?? '-' }}**. Bawa surat penerimaan resmi (terlampir PDF) saat hari pertama magang.
</x-mail::panel>

Surat penerimaan resmi terlampir pada email ini dalam format PDF.

Terima kasih,<br>
**Pemerintah Kota Madiun**
</x-mail::message>
