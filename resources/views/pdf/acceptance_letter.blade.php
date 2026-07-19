<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Penerimaan Magang — {{ $application->ticket_number }}</title>
    <style>
        /* Kop surat mengikuti acuan resmi (public/images/acuan_kopsurat.jpeg):
           logo Kota Madiun kiri, "PEMERINTAH KOTA MADIUN" + nama dinas,
           alamat/telepon/pos-el, ditutup garis tebal. */
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #111; font-size: 12px; line-height: 1.5; margin: 0; }
        .kop { border-bottom: 3px solid #111; padding-bottom: 8px; margin-bottom: 2px; }
        .kop table { width: 100%; border-collapse: collapse; }
        .kop .logo { width: 90px; text-align: center; vertical-align: middle; }
        .kop .logo img { width: 72px; }
        .kop .teks { text-align: center; padding-right: 90px; }
        .kop h1 { font-size: 14px; margin: 0; letter-spacing: 4px; font-weight: normal; }
        .kop h2 { font-size: 18px; margin: 2px 0 0; text-transform: uppercase; font-weight: bold; }
        .kop p { margin: 1px 0; font-size: 10px; }
        .bar { height: 1px; background: #111; margin-bottom: 18px; }
        .title { text-align: center; margin-bottom: 18px; }
        .title h3 { margin: 0; font-size: 14px; text-decoration: underline; text-transform: uppercase; }
        .title p { margin: 2px 0 0; font-size: 11px; }
        table.detail { width: 100%; border-collapse: collapse; margin: 12px 0; }
        table.detail td { padding: 4px 6px; vertical-align: top; }
        table.detail td.label { width: 38%; }
        table.detail td.sep { width: 4%; }
        .ttd { width: 100%; margin-top: 36px; }
        .ttd .box { width: 45%; float: right; text-align: center; }
        .space { height: 70px; }
        .muted { color: #444; }
    </style>
</head>
<body>
    <div class="kop">
        <table>
            <tr>
                <td class="logo">
                    {{-- DomPDF butuh ekstensi GD untuk merender gambar; PHP lokal
                         mungkin tanpa GD (lihat CLAUDE.md) — lewati logo agar
                         pembuatan surat tidak pernah gagal. --}}
                    @if (function_exists('imagecreatefrompng'))
                        <img src="{{ public_path('images/Lambang_Kota_Madiun.png') }}" alt="Lambang Kota Madiun">
                    @endif
                </td>
                <td class="teks">
                    <h1>P E M E R I N T A H&nbsp;&nbsp;K O T A&nbsp;&nbsp;M A D I U N</h1>
                    <h2>Dinas Komunikasi dan Informatika</h2>
                    <p>Jalan Perintis Kemerdekaan Nomor 32, Kota Madiun, Kode Pos: 63122 Jawa Timur</p>
                    <p>Telepon (0351) 467327</p>
                    <p>Pos-el : kominfo@madiunkota.go.id</p>
                </td>
            </tr>
        </table>
    </div>
    <div class="bar"></div>

    <div class="title">
        <h3>Surat Penerimaan Peserta Magang</h3>
        <p>NOMOR : {{ $application->sk_number ?? $letterNumber }}</p>
    </div>

    <p>Dengan ini menerangkan bahwa berdasarkan pengajuan dengan nomor tiket
        <strong>{{ $application->ticket_number }}</strong>, yang bersangkutan
        <strong>diterima</strong> sebagai peserta magang dengan rincian sebagai berikut:</p>

    <table class="detail">
        <tr>
            <td class="label">Nama Peserta</td><td class="sep">:</td>
            <td><strong>{{ $application->user->name }}</strong></td>
        </tr>
        <tr>
            <td class="label">Asal Instansi / Kampus</td><td class="sep">:</td>
            <td>{{ $application->institution_name }}</td>
        </tr>
        <tr>
            <td class="label">Penempatan (OPD)</td><td class="sep">:</td>
            <td>{{ $application->opd?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Bidang / Divisi</td><td class="sep">:</td>
            <td>{{ $application->division ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Periode Magang</td><td class="sep">:</td>
            <td>
                {{ $application->start_date?->format('d F Y') }} s.d. {{ $application->end_date?->format('d F Y') }}
                ({{ $application->duration_months }} bulan)
            </td>
        </tr>
        <tr>
            <td class="label">Pembimbing Lapangan</td><td class="sep">:</td>
            <td>{{ $application->field_supervisor ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Penanggung Jawab</td><td class="sep">:</td>
            <td>{{ $application->person_in_charge ?? '-' }}</td>
        </tr>
    </table>

    <p>Demikian surat penerimaan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>

    <div class="ttd">
        <div class="box">
            <p class="muted">Ditetapkan di: Madiun</p>
            <p class="muted">Pada tanggal: {{ ($application->sk_issued_at ?? now())->format('d F Y') }}</p>
            <p>a.n. Kepala Dinas Komunikasi dan Informatika</p>
            <div class="space"></div>
            <p><strong>__________________________</strong></p>
            <p class="muted">NIP. ________________________</p>
        </div>
    </div>
</body>
</html>
