<x-mail::message>
# E-Magang Kota Madiun

Halo {{ $application->user->name }},

Mohon maaf, pengajuan magang Anda dengan nomor tiket **{{ $application->ticket_number }}** belum dapat kami setujui.

@if($application->rejection_reason)
<x-mail::panel>
Alasan: {{ $application->rejection_reason }}
</x-mail::panel>
@endif

Anda dapat memperbaiki berkas dan mengajukan kembali melalui portal E-Magang Kota Madiun.

Terima kasih,<br>
Pemerintah Kota Madiun
</x-mail::message>
