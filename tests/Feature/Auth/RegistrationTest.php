<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        User::factory()->create([
            'role' => 'admin',
            'admin_invitation_code' => 'ADM-TEST-CODE',
        ]);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'user',
            'admin_invitation_code' => 'ADM-TEST-CODE',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_user_registration_requires_admin_invitation_code(): void
    {
        $response = $this->from('/register')->post('/register', [
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'user',
        ]);

        $response->assertRedirect('/register');
        $response->assertSessionHasErrors('admin_invitation_code');
        $this->assertGuest();
    }

    public function test_admin_registration_generates_invitation_code(): void
    {
        $this->post('/register', [
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $admin = User::where('email', 'admin@example.com')->first();

        $this->assertAuthenticatedAs($admin);
        $this->assertSame('admin', $admin->role);
        $this->assertNotEmpty($admin->admin_invitation_code);
    }

    public function test_user_can_register_with_valid_admin_invitation_code(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_invitation_code' => 'ADM-TEST-CODE',
        ]);

        $this->post('/register', [
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'user',
            'admin_invitation_code' => 'adm-test-code',
        ]);

        $staff = User::where('email', 'staff@example.com')->first();

        $this->assertAuthenticatedAs($staff);
        $this->assertSame('user', $staff->role);
        $this->assertSame($admin->id, $staff->admin_id);
    }

    public function test_invalid_admin_invitation_code_is_rejected(): void
    {
        $response = $this->from('/register')->post('/register', [
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'user',
            'admin_invitation_code' => 'ADM-BAD-CODE',
        ]);

        $response->assertRedirect('/register');
        $response->assertSessionHasErrors('admin_invitation_code');
        $this->assertGuest();
    }

    public function test_invitation_code_can_be_verified_before_registration(): void
    {
        User::factory()->create([
            'name' => 'Workspace Admin',
            'role' => 'admin',
            'admin_invitation_code' => 'ADM-LIVE-CODE',
        ]);

        $response = $this->postJson(route('register.verify-admin-code'), [
            'admin_invitation_code' => 'adm-live-code',
        ]);

        $response->assertOk()
            ->assertJson([
                'valid' => true,
                'admin' => ['name' => 'Workspace Admin'],
            ]);
    }
}
