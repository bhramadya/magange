<x-mail::message>
@include('mail.partials.header', ['badge' => 'Kode Masuk', 'badgeBg' => '#e8f2fe', 'badgeText' => '#106feb'])

Halo **{{ $user->name }}**,

Gunakan kode berikut untuk masuk ke portal **E-Magang Kota Madiun**. Kode berlaku selama **5 menit** dan hanya dapat digunakan satu kali.

{{-- Kartu kode OTP — tampil menonjol, selaras tema biru website. --}}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate; border:1px solid #cddcef; border-radius:16px; background-color:#e8f2fe;">
<tr><td align="center" style="padding:26px 40px;">
<span style="display:block; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#0b4fb0; padding-bottom:12px;">
Kode OTP Anda
</span>
<span style="display:block; font-size:42px; font-weight:800; line-height:1; letter-spacing:12px; color:#106feb; padding-left:12px;">
{{ $plainOtp }}
</span>
<span style="display:block; font-size:12px; font-weight:500; color:#64748b; padding-top:14px;">
Berlaku 5 menit &middot; Sekali pakai
</span>
</td></tr>
</table>
</td></tr>
</table>

Demi keamanan akun Anda, **jangan bagikan kode ini** kepada siapa pun — termasuk pihak yang mengatasnamakan Pemerintah Kota Madiun. Jika Anda tidak meminta kode ini, cukup abaikan email ini.

Terima kasih,<br>
**E-Magang Kota Madiun**
</x-mail::message>
