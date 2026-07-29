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
    @include('pdf.partials.letterhead', ['application' => $application])

    <div class="title">
        <h3>Surat Penerimaan Peserta Magang</h3>
        <p>NOMOR : {{ $application->sk_number ?? $letterNumber }}</p>
    </div>

    @if (isset($body))
        <div style="white-space: pre-line;">{{ $body }}</div>
    @else
        <p>Dengan ini menerangkan bahwa berdasarkan pengajuan dengan nomor tiket
            <strong>{{ $application->ticket_number }}</strong>, yang bersangkutan
            <strong>diterima</strong> sebagai peserta magang dengan rincian sebagai berikut:</p>
    @endif

    <div class="ttd">
        <div class="box">
            <p class="muted">Ditetapkan di: Madiun</p>
            <p class="muted">Pada tanggal: {{ ($application->sk_issued_at ?? now())->format('d F Y') }}</p>
            <p>{{ $application->acceptance_signer_title ?? 'a.n. Kepala Dinas' }}</p>
            <div class="space"></div>
            <p><strong>{{ $application->acceptance_signer_name ?? '__________________________' }}</strong></p>
            <p class="muted">NIP. {{ $application->acceptance_signer_nip ?? '__________________________' }}</p>
        </div>
    </div>
</body>
</html>
