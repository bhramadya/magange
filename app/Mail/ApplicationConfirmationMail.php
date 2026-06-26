<?php

namespace App\Mail;

use App\Models\InternshipApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public InternshipApplication $application,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengajuan Magang Diterima — '.$this->application->ticket_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.application-confirmation',
        );
    }
}
