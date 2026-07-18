<x-mail::message>
@include('mail.partials.header', ['badge' => 'Menunggu Verifikasi', 'badgeBg' => '#fef3c7', 'badgeText' => '#b45309'])

Halo {{ $application->user->name }},

Pengajuan magang Anda **Sedang menunggu verifikasi admin**.

<x-mail::panel>
Nomor Tiket: **{{ $application->ticket_number }}**
</x-mail::panel>

<x-mail::table>
| Detail            | Keterangan                                  |
|:------------------|:--------------------------------------------|
| Tujuan Magang     | {{ $application->tujuan_magang }}           |
| Asal Instansi     | {{ $application->institution_name }}        |
| Durasi            | {{ $application->duration_months }} bulan   |
| Periode           | {{ $application->start_date?->format('d/m/Y') }} – {{ $application->end_date?->format('d/m/Y') }} |
</x-mail::table>

Anda dapat memantau status pengajuan menggunakan nomor tiket di atas melalui halaman **Lacak Status**.

Terima kasih,<br>
Pemerintah Kota Madiun
</x-mail::message>
