{{--
    Header email branded E-Magang Kota Madiun: judul biru besar + badge subteks.
    Parameter:
      $badge     : teks badge status (mis. "Disetujui", "Ditolak").
      $badgeBg   : warna latar badge (default biru muda).
      $badgeText : warna teks badge (default biru).
--}}
@php
    $badge = $badge ?? null;
    $badgeBg = $badgeBg ?? '#dbeafe';
    $badgeText = $badgeText ?? '#106feb';
@endphp
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding-bottom: 8px;">
<span style="display:inline-block; font-size:30px; line-height:1.2; font-weight:800; color:#106feb; letter-spacing:-0.5px;">
E-Magang Kota Madiun
</span>
</td></tr>
@if($badge)
<tr><td align="center" style="padding-bottom: 20px;">
<span style="display:inline-block; padding:6px 18px; border-radius:9999px; background:{{ $badgeBg }}; color:{{ $badgeText }}; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
{{ $badge }}
</span>
</td></tr>
@endif
</table>
