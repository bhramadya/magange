<?php

namespace App\Mail;

use App\Models\InternshipApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AcceptanceLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public InternshipApplication $application,
        public string $pdfPath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Surat Penerimaan Magang — '.$this->application->ticket_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.acceptance-letter',
        );
    }

    /**
     * Lampirkan PDF surat penerimaan dari disk privat.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromStorageDisk('local', $this->pdfPath)
                ->as('surat-penerimaan-'.$this->application->ticket_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
