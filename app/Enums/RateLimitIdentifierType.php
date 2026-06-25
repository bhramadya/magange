<?php

namespace App\Enums;

enum RateLimitIdentifierType: string
{
    case Email = 'email';
    case Whatsapp = 'whatsapp';
}
