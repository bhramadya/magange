<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Penerimaan Magang — {{ $application->ticket_number }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #12213e; font-size: 12px; line-height: 1.5; margin: 0; }
        .kop { border-bottom: 3px solid #106feb; padding-bottom: 10px; margin-bottom: 4px; }
        .kop table { width: 100%; border-collapse: collapse; }
        .kop .logo { width: 70px; text-align: center; vertical-align: middle; }
        .kop .logo div {
            width: 56px; height: 56px; line-height: 56px; border-radius: 8px;
            background: #106feb; color: #fff; font-size: 20px; font-weight: bold; text-align: center;
        }
        .kop h1 { font-size: 17px; margin: 0; text-transform: uppercase; }
        .kop h2 { font-size: 14px; margin: 2px 0; color: #106feb; text-transform: uppercase; }
        .kop p { margin: 1px 0; font-size: 10px; color: #52525b; }
        .bar { height: 3px; background: #12213e; margin-bottom: 18px; }
        .title { text-align: center; margin-bottom: 18px; }
        .title h3 { margin: 0; font-size: 14px; text-decoration: underline; text-transform: uppercase; }
        .title p { margin: 2px 0 0; font-size: 11px; }
        table.detail { width: 100%; border-collapse: collapse; margin: 12px 0; }
        table.detail td { padding: 4px 6px; vertical-align: top; }
        table.detail td.label { width: 38%; }
        table.detail td.sep { width: 4%; }
        .ttd { width: 100%; margin-top: 36px; }
        .ttd table { width: 100%; }
        .ttd .box { width: 40%; float: right; text-align: center; }
        .space { height: 70px; }
        .muted { color: #52525b; }
    </style>
</head>
<body>
    <div class="kop">
        <table>
            <tr>
                <td class="logo"><div>eM</div></td>
                <td>
                    <h1>Pemerintah Kota Madiun</h1>
                    <h2>Dinas Komunikasi dan Informatika</h2>
                    <p>Jalan Perintis Kemerdekaan No. 32, Kota Madiun, Jawa Timur 63122</p>
                    <p>Telepon (0351) 467327 &middot; email: kominfo@madiunkota.go.id</p>
                </td>
            </tr>
        </table>
    </div>
    <div class="bar"></div>

    <div class="title">
        <h3>Surat Penerimaan Peserta Magang</h3>
        <p>Nomor: {{ $letterNumber }}</p>
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
    </table>

    <p>Demikian surat penerimaan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>

    <div class="ttd">
        <div class="box">
            <p class="muted">Madiun, {{ now()->format('d F Y') }}</p>
            <p>a.n. Kepala Dinas Komunikasi dan Informatika</p>
            <div class="space"></div>
            <p><strong>__________________________</strong></p>
            <p class="muted">NIP. ________________________</p>
        </div>
    </div>
</body>
</html>
