{{--
    Header email branded — logo Lambang Kota Madiun + E-Magang berdampingan,
    wordmark "magang kota Madiun" biru besar, badge status, garis gradien.
--}}
@php
    $badge = $badge ?? null;
    $badgeBg = $badgeBg ?? '#e8f2fe';
    $badgeText = $badgeText ?? '#106feb';
@endphp
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
{{-- Logo berdampingan: Lambang Kota Madiun + lencana E-Magang --}}
<tr><td align="center" style="padding-bottom: 12px;">
<table cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td valign="middle" style="padding-right: 12px;">
<img src="{{ asset('images/Lambang_Kota_Madiun.png') }}" alt="Lambang Kota Madiun" style="height:52px; width:auto; display:block;">
</td>
<td valign="middle" style="border-left: 1px solid #e2e8f0; padding-left: 12px;">
<span style="display:block; font-size:11px; font-weight:600; color:#94a3b8; letter-spacing:0.8px; text-transform:uppercase; padding-bottom:3px;">Portal Resmi</span>
<span style="display:block; font-size:18px; font-weight:800; color:#106feb; letter-spacing:-0.3px; line-height:1.1;">E-Magang</span>
<span style="display:block; font-size:11px; font-weight:500; color:#64748b;">Pemerintah Kota Madiun</span>
</td>
</tr>
</table>
</td></tr>
{{-- Wordmark utama: "magang kota Madiun" --}}
<tr><td align="center" style="padding-bottom: 6px;">
<span style="display:inline-block; font-size:28px; line-height:1.15; font-weight:800; color:#106feb; letter-spacing:-0.5px;">
magang kota Madiun
</span>
</td></tr>
@if($badge)
<tr><td align="center" style="padding-bottom: 18px;">
<span style="display:inline-block; padding:7px 18px; border-radius:9999px; background:{{ $badgeBg }}; color:{{ $badgeText }}; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px;">
{{ $badge }}
</span>
</td></tr>
@endif
{{-- Garis pemisah gradien --}}
<tr><td style="padding-bottom: 24px;">
<div style="height:3px; border-radius:9999px; background-image:linear-gradient(90deg,rgba(16,111,235,0) 0%,#106feb 50%,rgba(16,111,235,0) 100%);">&nbsp;</div>
</td></tr>
</table>
