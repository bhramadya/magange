@extends('pdf.layouts.surat')

@section('title', 'Surat Penerimaan Magang — '.$application->ticket_number)

@section('content')
    <div class="title">
        <h3>Surat Penerimaan Peserta Magang</h3>
        <p>NOMOR : {{ $application->sk_number ?? $letterNumber }}</p>
    </div>

    @if (isset($body))
        <div class="body">{{ $body }}</div>
    @else
        <p>Dengan ini menerangkan bahwa berdasarkan pengajuan dengan nomor tiket
            <strong>{{ $application->ticket_number }}</strong>, yang bersangkutan
            <strong>diterima</strong> sebagai peserta magang dengan rincian sebagai berikut:</p>
    @endif

    @include('pdf.partials.signature', [
        'signer' => $signer ?? [
            'name' => $application->acceptance_signer_name,
            'title' => $application->acceptance_signer_title,
            'nip' => $application->acceptance_signer_nip,
        ],
        'tanggal' => ($application->sk_issued_at ?? now())->translatedFormat('d F Y'),
    ])
@endsection
