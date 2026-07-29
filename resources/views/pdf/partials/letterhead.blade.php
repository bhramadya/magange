<div class="kop">
    <table>
        <tr>
            <td class="logo">
                {{-- Logo Pemkot Madiun tetap statis untuk semua OPD. --}}
                @if (function_exists('imagecreatefrompng'))
                    <img src="{{ public_path('images/Lambang_Kota_Madiun.png') }}" alt="Lambang Kota Madiun">
                @endif
            </td>
            <td class="teks">
                <h1>P E M E R I N T A H&nbsp;&nbsp;K O T A&nbsp;&nbsp;M A D I U N</h1>
                <h2>{{ $application->opd?->name ?? 'Pemerintah Kota Madiun' }}</h2>
                @if ($application->opd?->letterhead_address)
                    <p>{{ $application->opd->letterhead_address }}</p>
                @endif
                @if ($application->opd?->letterhead_phone)
                    <p>Telepon {{ $application->opd->letterhead_phone }}</p>
                @endif
                @if ($application->opd?->letterhead_email)
                    <p>Pos-el : {{ $application->opd->letterhead_email }}</p>
                @endif
            </td>
        </tr>
    </table>
</div>
<div class="bar"></div>
