<x-mail::message>
@include('mail.partials.header', ['badge' => 'Sertifikat Terbit', 'badgeBg' => '#dcfce7', 'badgeText' => '#15803d'])

Halo {{ $certificate->application->user->name }},

Kabar baik! **Sertifikat magang** Anda untuk tiket **{{ $certificate->application->ticket_number }}** telah tersedia dan dapat diunduh melalui portal.

Silakan masuk ke akun Anda dan buka halaman **Penyelesaian** untuk mengunduh sertifikat.

Terima kasih atas dedikasi Anda selama menjalani magang di lingkungan Pemerintah Kota Madiun.

Terima kasih,<br>
Pemerintah Kota Madiun
</x-mail::message>
