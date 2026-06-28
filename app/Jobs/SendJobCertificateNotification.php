<?php

namespace App\Jobs;

use App\Mail\CertificateNotificationMail;
use App\Models\Certificate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendJobCertificateNotification implements ShouldQueue
{
    use Queueable;

    /**
     * @var int
     */
    public $tries = 3;

    /**
     * @var array<int, int>
     */
    public $backoff = [30, 60, 120];

    public function __construct(
        public Certificate $certificate,
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        $this->certificate->loadMissing('application.user');

        Mail::to($this->certificate->application->user->email)
            ->send(new CertificateNotificationMail($this->certificate));
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('SendJobCertificateNotification gagal', [
            'certificate_id' => $this->certificate->id,
            'error' => $exception?->getMessage(),
        ]);
    }
}
