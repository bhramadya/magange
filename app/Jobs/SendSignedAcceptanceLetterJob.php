<?php

namespace App\Jobs;

use App\Mail\AcceptanceLetterMail;
use App\Models\InternshipApplication;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendSignedAcceptanceLetterJob implements ShouldQueue
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

    public function __construct(public InternshipApplication $application)
    {
        $this->onQueue('emails');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->application->loadMissing('user');

        Mail::to($this->application->user->email)
            ->send(new AcceptanceLetterMail(
                $this->application,
                (string) $this->application->acceptance_signed_path,
            ));
    }
}
