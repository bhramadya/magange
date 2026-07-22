<x-mail::message>
@include('mail.partials.header', ['badge' => 'Sertifikat Terbit', 'badgeBg' => '#dcfce7', 'badgeText' => '#15803d'])

Halo **{{ $certificate->application->user->name }}**,

Selamat! **Sertifikat magang** Anda untuk tiket **{{ $certificate->application->ticket_number }}** telah diterbitkan dan siap diunduh melalui portal.

<x-mail::panel>
Silakan masuk ke akun Anda, buka halaman **Penyelesaian**, lalu klik tombol **Unduh Sertifikat** untuk mendapatkan sertifikat resmi Anda.
</x-mail::panel>

Terima kasih atas dedikasi Anda selama menjalani magang di lingkungan Pemerintah Kota Madiun. Semoga pengalaman ini bermanfaat untuk karir Anda ke depan.

Terima kasih,<br>
**E-Magang Kota Madiun**
</x-mail::message>
