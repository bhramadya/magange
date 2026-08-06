<x-mail::message>
@include('mail.partials.header', ['badge' => 'Sertifikat Terbit', 'badgeBg' => '#dcfce7', 'badgeText' => '#15803d'])

Halo **{{ $certificate->application->user->name }}**,

Selamat! **Sertifikat magang** Anda untuk tiket **{{ $certificate->application->ticket_number }}** telah diterbitkan.

<x-mail::panel>
@if ($pdfPath)
Sertifikat yang telah ditandatangani kami lampirkan pada email ini. Salinannya juga tersedia di portal.
@else
Silakan masuk ke akun Anda, buka halaman **Penyelesaian**, lalu klik tombol **Unduh Sertifikat** untuk mendapatkan sertifikat resmi Anda.
@endif
</x-mail::panel>

Terima kasih atas dedikasi Anda selama menjalani magang di lingkungan Pemerintah Kota Madiun. Semoga pengalaman ini bermanfaat untuk karir Anda ke depan.

Terima kasih,<br>
**E-Magang Kota Madiun**
</x-mail::message>
