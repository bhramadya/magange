<x-mail::message>
# E-Magang Kota Madiun

Halo {{ $user->name }},

Berikut adalah kode OTP untuk masuk ke portal **Magang Kota Madiun**. Kode berlaku selama 10 menit dan hanya dapat digunakan satu kali.

<x-mail::panel>
# {{ $plainOtp }}
</x-mail::panel>

Jika Anda tidak meminta kode ini, abaikan email ini dan jangan bagikan kode kepada siapa pun.

Terima kasih,<br>
Pemerintah Kota Madiun
</x-mail::message>
