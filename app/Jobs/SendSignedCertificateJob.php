<?php

namespace App\Jobs;

use App\Mail\CertificateNotificationMail;
use App\Models\Certificate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendSignedCertificateJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    /**
     * @var array<int, int>
     */
    public $backoff = [30, 60, 120];

    public function __construct(public Certificate $certificate)
    {
        $this->onQueue('emails');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->certificate->loadMissing('application.user');

        Mail::to($this->certificate->application->user->email)
            ->send(new CertificateNotificationMail($this->certificate, $this->certificate->file_path));
    }
}
