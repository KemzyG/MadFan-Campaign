<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EventType;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SocialAnnouncement;
use App\Support\BrandLogoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AnnouncementsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageAnnouncements');

        $items = SocialAnnouncement::query()
            ->with('club:id,name')
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->when($request->filled('search'), fn ($query) => $query->where('headline', 'like', '%'.$request->string('search').'%'))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($items);
    }

    public function show(SocialAnnouncement $announcement): JsonResponse
    {
        Gate::authorize('manageAnnouncements');

        return response()->json($announcement->load('club:id,name'));
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manageAnnouncements');

        $data = $request->validate([
            'type' => ['required', Rule::in(EventType::editorialValues())],
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'headline' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'link_label' => ['nullable', 'string', 'max:120'],
            'meta' => ['nullable', 'array'],
            'is_pinned' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'published_at' => ['nullable', 'date'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $data['is_pinned'] = $request->boolean('is_pinned', false);
        $data['published_at'] ??= now();

        if ($request->hasFile('image')) {
            $data['image_path'] = BrandLogoStorage::store($request->file('image'), 'announcements');
        }

        unset($data['image']);

        $announcement = SocialAnnouncement::query()->create($data);

        ActivityLog::record('announcement.created', "Created announcement {$announcement->headline}");

        return response()->json($announcement->load('club:id,name'), 201);
    }

    public function update(Request $request, SocialAnnouncement $announcement): JsonResponse
    {
        Gate::authorize('manageAnnouncements');

        $data = $request->validate([
            'type' => ['sometimes', Rule::in(EventType::editorialValues())],
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'headline' => ['sometimes', 'required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'link_label' => ['nullable', 'string', 'max:120'],
            'meta' => ['nullable', 'array'],
            'is_pinned' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'published_at' => ['nullable', 'date'],
            'image' => ['nullable', 'image', 'max:4096'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('remove_image') && ! $request->hasFile('image')) {
            BrandLogoStorage::delete($announcement->image_path);
            $data['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            $data['image_path'] = BrandLogoStorage::replace(
                $announcement->image_path,
                $request->file('image'),
                'announcements',
            );
        }

        unset($data['image'], $data['remove_image']);

        $announcement->update($data);

        ActivityLog::record('announcement.updated', "Updated announcement {$announcement->headline}");

        return response()->json($announcement->fresh()->load('club:id,name'));
    }

    public function destroy(SocialAnnouncement $announcement): JsonResponse
    {
        Gate::authorize('manageAnnouncements');

        ActivityLog::record('announcement.deleted', "Deleted announcement {$announcement->headline}");
        BrandLogoStorage::delete($announcement->image_path);
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
