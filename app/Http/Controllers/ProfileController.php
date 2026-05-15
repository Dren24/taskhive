<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $props = [
            'mustVerifyEmail' => $user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail,
            'status'          => session('status'),
            'isAdmin'         => $user->isAdmin(),
        ];

        if ($user->isAdmin()) {
            $users = User::where('role', '!=', 'admin')
                ->withCount(['tasks', 'projects', 'memberProjects'])
                ->withMax('tasks', 'updated_at')
                ->with(['projects:id,name,user_id', 'memberProjects:id,name'])
                ->orderBy('name')
                ->get();

            $props['managedUsers'] = $users->map(fn($u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'email'          => $u->email,
                'role'           => $u->role,
                'tasks_count'    => $u->tasks_count,
                'projects_count' => ($u->projects_count ?? 0) + ($u->member_projects_count ?? 0),
                'last_active'    => $u->tasks_max_updated_at
                    ? \Carbon\Carbon::parse($u->tasks_max_updated_at)->diffForHumans()
                    : 'No activity',
            ]);

            $props['auditLogs'] = AuditLog::with('actor')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($log) => [
                    'id'           => $log->id,
                    'actor'        => $log->actor?->name ?? 'System',
                    'target_name'  => $log->target_name,
                    'target_email' => $log->target_email,
                    'created_at'   => $log->created_at->diffForHumans(),
                ]);
        }

        return Inertia::render('Profile/Edit', $props);
    }

    /**
     * Admin: delete a managed user account with audit logging.
     */
    public function destroyManagedUser(Request $request, User $user): RedirectResponse
    {
        /** @var \App\Models\User $admin */
        $admin = $request->user();
        abort_if(!$admin->isAdmin(), 403);
        abort_if($user->id === $admin->id, 422, 'You cannot delete your own account.');
        abort_if($user->isAdmin(), 422, 'Admin accounts cannot be deleted.');

        $metadata = [
            'user_id'    => $user->id,
            'user_email' => $user->email,
            'user_role'  => $user->role,
        ];

        DB::transaction(function () use ($admin, $user, $metadata) {
            AuditLog::create([
                'actor_id'      => $admin->id,
                'action'        => 'user_deleted',
                'target_user_id'=> $user->id,
                'target_name'   => $user->name,
                'target_email'  => $user->email,
                'metadata'      => $metadata,
                'ip_address'    => request()->ip(),
                'user_agent'    => request()->userAgent(),
            ]);
            $user->delete();
        });

        return back()->with('success', 'User account permanently deleted.');
    }

    /**
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
