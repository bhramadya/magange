@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Logo Pemerintah Kota Madiun (menggantikan logo Laravel bawaan). --}}
<img src="{{ asset('images/Lambang_Kota_Madiun.png') }}" class="logo" alt="Lambang Kota Madiun" style="height: 64px; width: auto;">
</a>
</td>
</tr>
