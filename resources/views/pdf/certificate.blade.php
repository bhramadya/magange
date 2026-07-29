<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Sertifikat Magang — {{ $application->ticket_number }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #111; font-size: 12px; line-height: 1.6; margin: 0; }
        .kop { border-bottom: 3px solid #111; padding-bottom: 8px; margin-bottom: 2px; }
        .kop table { width: 100%; border-collapse: collapse; }
        .kop .logo { width: 90px; text-align: center; vertical-align: middle; }
        .kop .logo img { width: 72px; }
        .kop .teks { text-align: center; padding-right: 90px; }
        .kop h1 { font-size: 14px; margin: 0; letter-spacing: 4px; font-weight: normal; }
        .kop h2 { font-size: 18px; margin: 2px 0 0; text-transform: uppercase; font-weight: bold; }
        .kop p { margin: 1px 0; font-size: 10px; }
        .bar { height: 1px; background: #111; margin-bottom: 24px; }
        .title { text-align: center; margin-bottom: 24px; }
        .title h3 { margin: 0; font-size: 18px; text-decoration: underline; text-transform: uppercase; }
        .body { white-space: pre-line; }
        .ttd { width: 100%; margin-top: 44px; }
        .ttd .box { width: 45%; float: right; text-align: center; }
        .space { height: 70px; }
        .muted { color: #444; }
    </style>
</head>
<body>
    @include('pdf.partials.letterhead', ['application' => $application])

    <div class="title">
        <h3>Sertifikat Magang</h3>
    </div>

    <div class="body">{{ $body }}</div>

    <div class="ttd">
        <div class="box">
            <p class="muted">Ditetapkan di: Madiun</p>
            <p class="muted">Pada tanggal: {{ now()->translatedFormat('d F Y') }}</p>
            <p>{{ $certificate->signer_title }}</p>
            <div class="space"></div>
            <p><strong>{{ $certificate->signer_name }}</strong></p>
            <p class="muted">NIP. {{ $certificate->signer_nip }}</p>
        </div>
    </div>
</body>
</html>
