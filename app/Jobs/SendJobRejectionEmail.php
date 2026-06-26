<?php

namespace App\Jobs;

use App\Mail\ApplicationRejectionMail;
use App\Models\InternshipApplication;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendJobRejectionEmail implements ShouldQueue
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
        public InternshipApplication $application,
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        $this->application->loadMissing('user');

        Mail::to($this->application->user->email)
            ->send(new ApplicationRejectionMail($this->application));
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('SendJobRejectionEmail gagal', [
            'application_id' => $this->application->id,
            'error' => $exception?->getMessage(),
        ]);
    }
}
