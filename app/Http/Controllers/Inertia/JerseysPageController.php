<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Jersey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class JerseysPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manageJerseys');

        $jerseys = Jersey::query()
            ->with(['club:id,name,short', 'variants'])
            ->when($request->filled('club_id'), fn ($query) => $query->where('club_id', $request->integer('club_id')))
            ->when($request->filled('q'), function ($query) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('name', 'like', $term)
                        ->orWhere('slug', 'like', $term);
                });
            })
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString()
            ->through(fn (Jersey $jersey): array => [
                'id' => $jersey->id,
                'name' => $jersey->name,
                'slug' => $jersey->slug,
                'price' => (string) $jersey->price,
                'is_active' => $jersey->is_active,
                'image_url' => $jersey->image_url,
                'description' => $jersey->description,
                'club_id' => $jersey->club_id,
                'club' => $jersey->club,
                'stock_total' => $jersey->totalStock(),
                'variants' => $jersey->variants->map(fn ($variant): array => [
                    'id' => $variant->id,
                    'size' => $variant->size->value,
                    'stock' => $variant->stock,
                    'sku' => $variant->sku,
                ])->all(),
            ]);

        return Inertia::render('Admin/Jerseys/Index', [
            'jerseys' => $jerseys,
            'clubs' => Club::query()->orderBy('name')->get(['id', 'name', 'short']),
            'filters' => [
                'club_id' => $request->integer('club_id') ?: null,
                'q' => $request->string('q')->toString() ?: null,
            ],
        ]);
    }
}
