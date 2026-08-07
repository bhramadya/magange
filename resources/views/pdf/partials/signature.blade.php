{{-- Blok tanda tangan bersama (R3c). Diterima dari caller:
      $signer  -> array hasil LetterDocumentService::signerSnapshot():
                  name (bergelar), title/jabatan, nip, nik, rank,
                  on_behalf_of. Semua nullable → data lama tetap aman.
      $tanggal -> string tanggal terbit, opsional (default now).
     --}}
@php($tanggal = $tanggal ?? now()->translatedFormat('d F Y'))
<div class="ttd">
    <div class="box">
        <p class="muted">Ditetapkan di: Madiun</p>
        <p class="muted">Pada tanggal: {{ $tanggal }}</p>
        @if (($signer['on_behalf_of'] ?? null) !== null && ($signer['on_behalf_of'] ?? '') !== '')
            <p>{{ $signer['on_behalf_of'] }}</p>
        @elseif (($signer['title'] ?? null) !== null && ($signer['title'] ?? '') !== '')
            <p>{{ $signer['title'] }}</p>
        @endif
        <div class="space"></div>
        <p><strong>{{ $signer['name'] ?? '__________________________' }}</strong></p>
        @if (($signer['rank'] ?? null) !== null && ($signer['rank'] ?? '') !== '')
            <p class="muted">{{ $signer['rank'] }}</p>
        @endif
        @if (($signer['nik'] ?? null) !== null && ($signer['nik'] ?? '') !== '')
            <p class="muted">NIK. {{ $signer['nik'] }}</p>
        @else
            <p class="muted">NIP. {{ $signer['nip'] ?? '__________________________' }}</p>
        @endif
    </div>
</div>