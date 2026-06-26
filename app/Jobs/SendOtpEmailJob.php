<?php

namespace App\Jobs;

use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendOtpEmailJob implements ShouldQueue
{
    use Queueable;

    /**
     * Jumlah percobaan & jeda backoff (detik) antar percobaan.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * @var array<int, int>
     */
    public $backoff = [30, 60, 120];

    public function __construct(
        public User $user,
        public string $plainOtp,
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        Mail::to($this->user->email)->send(new OtpMail($this->user, $this->plainOtp));
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('SendOtpEmailJob gagal', [
            'user_id' => $this->user->id,
            'error' => $exception?->getMessage(),
        ]);
    }
}
