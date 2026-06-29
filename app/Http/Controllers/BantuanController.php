<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BantuanController extends Controller
{
    /**
     * Pusat Bantuan (FAQ statis) — hanya butuh prop user untuk header/nav.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return Inertia::render('bantuan', [
            'user' => $user->toMagangArray(),
        ]);
    }
}
