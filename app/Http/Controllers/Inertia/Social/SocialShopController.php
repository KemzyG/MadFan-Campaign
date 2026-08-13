<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\User;
use App\Services\Shop\JerseyCatalogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopController extends Controller
{
    public function index(Request $request, JerseyCatalogService $catalog): Response
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', JerseyOrder::class);

        $clubId = $request->integer('club_id') ?: null;

        return Inertia::render('Social/Shop/Index', [
            'jerseys' => $catalog->presentCatalog($clubId),
            'cart_count' => $catalog->presentCart()['count'],
            'filters' => [
                'club_id' => $clubId,
            ],
            'favourite_club_id' => $user->favourite_club_id,
        ]);
    }

    public function show(Request $request, Jersey $jersey, JerseyCatalogService $catalog): Response
    {
        $this->authorize('viewAny', JerseyOrder::class);

        abort_unless($jersey->is_active, 404);

        return Inertia::render('Social/Shop/Show', [
            'jersey' => $catalog->presentJersey($jersey),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }
}
