<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that restricts access to admin-only routes.
 *
 * Applied at the route level so admin checks are enforced
 * before reaching any controller, providing defense-in-depth
 * on top of the per-controller abort_if() checks.
 */
class EnsureUserIsAdmin
{
    /**
     * Reject unauthenticated or non-admin users with a 403
     * before they reach the controller.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        abort_if(!$user || !$user->isAdmin(), 403, 'Admin access only.');

        return $next($request);
    }
}
