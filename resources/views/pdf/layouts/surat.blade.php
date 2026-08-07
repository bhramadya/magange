{{-- Layout surat bersama (R3c) — CSS yang dulu terduplikasi di tiga view
     PDF kini tinggal satu tempat. Kop surat di-render via partial letterhead
     supaya nama/alamat OPD selalu dinamis (bukan hardcoded Kominfo).

     Variabel yang wajib disediakan view anak:
       $application -> InternshipApplication (dipakai partial letterhead).
       Section: title (judul + nomor), content (isi surat).
     Opsional: section styles untuk penyesuaian per-jenis surat.

     Perataan teks isi surat dibuat justify (R3b); judul tetap center. --}}
@php($application = $application ?? $report?->application)
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>@yield('title')</title>
    <style>
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
        .body { white-space: pre-line; text-align: justify; text-justify: inter-word; }
        .ttd { width: 100%; margin-top: 36px; }
        .ttd .box { width: 45%; float: right; text-align: center; }
        .space { height: 70px; }
        .muted { color: #444; }
        @yield('styles')
    </style>
</head>
<body>
    @include('pdf.partials.letterhead', ['application' => $application])

    @yield('content')
</body>
</html>