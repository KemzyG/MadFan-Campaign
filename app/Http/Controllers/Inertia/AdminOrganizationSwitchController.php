<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminOrganizationSwitchController extends Controller
{
    public function __invoke(Request $request, AdminOrganizationContext $context): RedirectResponse
    {
        $validated = $request->validate([
            'organization_id' => ['nullable', 'integer', 'exists:admin_organizations,id'],
        ]);

        $context->switchOrganization(
            $request->user(),
            $request->session(),
            $validated['organization_id'] ?? null,
        );

        return back()->with('success', 'Organization context updated.');
    }
}
