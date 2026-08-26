<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Support\MadFanLegal;
use Inertia\Inertia;
use Inertia\Response;

class LegalPageController extends Controller
{
    public function show(string $doc): Response
    {
        if (! in_array($doc, MadFanLegal::slugs(), true)) {
            abort(404);
        }

        return Inertia::render('Fan/Legal', [
            'slug' => $doc,
            ...MadFanLegal::page($doc),
        ]);
    }
}
