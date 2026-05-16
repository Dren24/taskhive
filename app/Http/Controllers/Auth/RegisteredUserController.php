<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['nullable', 'in:admin,user'],
            'admin_invitation_code' => ['nullable', 'string', 'max:24'],
        ]);

        $role = $request->input('role', 'user');
        $admin = null;
        $code = trim((string) $request->input('admin_invitation_code'));

        if ($role === 'user' && $code !== '') {
            $admin = $this->findAdminByInvitationCode($code);

            if (!$admin || !$admin->invitationCodeIsActive()) {
                throw ValidationException::withMessages([
                    'admin_invitation_code' => 'This admin invitation code is invalid or expired.',
                ]);
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'admin_id' => $role === 'user' ? $admin?->id : null,
            'admin_invitation_code' => $role === 'admin' ? $this->generateAdminInvitationCode() : null,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }

    public function verifyInvitationCode(Request $request)
    {
        $validated = $request->validate([
            'admin_invitation_code' => ['required', 'string', 'max:24'],
        ]);

        $admin = $this->findAdminByInvitationCode($validated['admin_invitation_code']);

        if (!$admin || !$admin->invitationCodeIsActive()) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or expired admin invitation code.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => "Connected to {$admin->name}'s workspace.",
            'admin' => [
                'name' => $admin->name,
            ],
        ]);
    }

    private function findAdminByInvitationCode(string $code): ?User
    {
        $normalized = Str::upper(trim($code));

        return User::where('role', 'admin')
            ->whereRaw('upper(admin_invitation_code) = ?', [$normalized])
            ->first();
    }

    private function generateAdminInvitationCode(): string
    {
        do {
            $code = 'ADM-' . Str::upper(Str::random(4)) . '-' . Str::upper(Str::random(4));
        } while (User::where('admin_invitation_code', $code)->exists());

        return $code;
    }
}
