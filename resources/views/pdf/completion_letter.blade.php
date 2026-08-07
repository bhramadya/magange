@php($application = $report->application)
@extends('pdf.layouts.surat')

@section('title', 'Surat Penyelesaian Magang — '.$application->ticket_number)

@section('content')
    <div class="title">
        <h3>Surat Keterangan Penyelesaian Magang</h3>
        <p>NOMOR : {{ $report->completion_sk_number }}</p>
    </div>

    <p>Dengan ini menerangkan bahwa peserta magang berikut telah
        <strong>menyelesaikan</strong> program magang pada Pemerintah Kota Madiun
        (nomor tiket <strong>{{ $application->ticket_number }}</strong>) dengan
        rincian sebagai berikut:</p>

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
            <td class="label">Laporan Akhir</td><td class="sep">:</td>
            <td>Diterima pada {{ $report->submitted_at->format('d F Y') }}</td>
        </tr>
    </table>

    <p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>

    @include('pdf.partials.signature', [
        'signer' => $signer ?? [
            'name' => $report->completion_signer_name,
            'title' => $report->completion_signer_title,
            'nip' => $report->completion_signer_nip,
        ],
        'tanggal' => ($report->completion_sk_issued_at ?? now())->translatedFormat('d F Y'),
    ])
@endsection
