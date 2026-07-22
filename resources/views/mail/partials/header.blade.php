{{--
    Header email branded — background strip gradien biru, logo Lambang Kota
    Madiun besar + wordmark "magang kota Madiun", badge status, garis pemisah.
--}}
@php
    $badge = $badge ?? null;
    $badgeBg = $badgeBg ?? '#e8f2fe';
    $badgeText = $badgeText ?? '#106feb';
    $logoUrl = rtrim(config('app.url'), '/') . '/images/Lambang_Kota_Madiun.png';
@endphp
{{-- Strip header gradien biru --}}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
       style="background-image:linear-gradient(135deg,#0a1628 0%,#106feb 60%,#0b4fb0 100%); border-radius:16px 16px 0 0;">
<tr><td align="center" style="padding: 32px 24px 28px;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="email-logo-cell" valign="middle" style="padding-right: 16px;">
<img class="email-logo-img" src="{{ $logoUrl }}" alt="Lambang Kota Madiun" width="56"
     style="display:block; width:56px; height:auto; border:0; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.35));">
</td>
<td class="email-wordmark-cell" valign="middle" style="border-left: 2px solid rgba(255,255,255,0.25); padding-left: 16px;">
<span style="display:block; font-size:28px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; line-height:1.1; text-shadow:0 2px 8px rgba(0,0,0,0.2);">magang kota Madiun</span>
<span style="display:block; font-size:13px; font-weight:500; color:rgba(255,255,255,0.65); margin-top:5px; letter-spacing:0.2px;">Portal Resmi Pemerintah Kota Madiun</span>
</td>
</tr>
</table>
</td></tr>
</table>
{{-- Badge status --}}
@if($badge)
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding: 20px 0 4px;">
<span style="display:inline-block; padding:8px 22px; border-radius:9999px; background:{{ $badgeBg }}; color:{{ $badgeText }}; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.9px;">{{ $badge }}</span>
</td></tr>
</table>
@endif
{{-- Garis pemisah gradien --}}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td style="padding: {{ $badge ? '16px' : '20px' }} 0 24px;">
<div style="height:3px; border-radius:9999px; background-image:linear-gradient(90deg,rgba(16,111,235,0) 0%,#106feb 50%,rgba(16,111,235,0) 100%);">&nbsp;</div>
</td></tr>
</table>
