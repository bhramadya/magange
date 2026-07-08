<x-mail::message>
@include('mail.partials.header', ['badge' => 'Disetujui', 'badgeBg' => '#dcfce7', 'badgeText' => '#15803d'])

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
