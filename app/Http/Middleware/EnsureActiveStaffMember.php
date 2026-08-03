<?php

namespace App\Http\Middleware;

use App\Services\Staff\StaffAssignmentService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveStaffMember
{
    public function __construct(
        protected StaffAssignmentService $staffAssignments,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $this->staffAssignments->isActiveStaff($user)) {
            return redirect()
                ->route('fan.daily-claim')
                ->with('error', 'Staff access requires an active staff position.');
        }

        return $next($request);
    }
}
