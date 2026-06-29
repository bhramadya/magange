<?php

namespace App\Http\Controllers;

use App\Models\Opd;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Landing page publik beserta daftar OPD aktif untuk dropdown
     * form pendaftaran (welcome.tsx, anchor #daftar).
     */
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'opd_list' => Opd::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }
}
