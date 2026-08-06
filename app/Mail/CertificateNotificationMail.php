<?php

namespace App\Mail;

use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CertificateNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Certificate $certificate,
        public ?string $pdfPath = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Sertifikat Magang Tersedia — E-Magang Kota Madiun',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.certificate-notification',
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if ($this->pdfPath === null) {
            return [];
        }

        return [
            Attachment::fromStorageDisk('local', $this->pdfPath)
                ->as('sertifikat-'.$this->certificate->application->ticket_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
