@extends('pdf.layouts.surat')

@section('title', 'Sertifikat Magang — '.$application->ticket_number)

@section('styles')
    .bar { margin-bottom: 24px; }
    .title { margin-bottom: 24px; }
    .title h3 { font-size: 18px; }
    .ttd { margin-top: 44px; }
@endsection

@section('content')
    <div class="title">
        <h3>Sertifikat Magang</h3>
    </div>

    <div class="body">{{ $body }}</div>

    @include('pdf.partials.signature', [
        'signer' => $signer ?? [
            'name' => $certificate->signer_name,
            'title' => $certificate->signer_title,
            'nip' => $certificate->signer_nip,
        ],
    ])
@endsection
