<x-mail::message>
# E-Magang Kota Madiun

Halo {{ $application->user->name }},

Selamat! Pengajuan magang Anda dengan nomor tiket **{{ $application->ticket_number }}** telah **disetujui**.

Surat penerimaan resmi terlampir pada email ini dalam format PDF. Mohon dibaca dan dibawa saat hari pertama magang.

<x-mail::panel>
Penempatan: **{{ $application->opd?->name ?? '-' }}**@if($application->division) — {{ $application->division }}@endif
</x-mail::panel>

Terima kasih,<br>
Pemerintah Kota Madiun
</x-mail::message>
