<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectNotification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectMembershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_project_member_and_notification_is_created(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Launch Plan',
            'color' => '#8B5CF6',
        ]);

        $response = $this->actingAs($admin)->post(route('projects.members.store', $project), [
            'user_id' => $member->id,
            'access_level' => 'manager',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('project_user', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'access_level' => 'manager',
        ]);
        $this->assertTrue(ProjectNotification::where('user_id', $member->id)
            ->where('project_id', $project->id)
            ->where('type', 'project_added')
            ->exists());
    }

    public function test_task_creation_rejects_users_who_are_not_project_members(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $outsider = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id, [
            'access_level' => 'editor',
            'permissions' => json_encode(['view', 'comment', 'submit', 'upload']),
        ]);

        $response = $this->actingAs($admin)->post(route('tasks.store'), [
            'tasks' => [[
                'title' => 'Restricted Task',
                'description' => null,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => now()->addDay()->format('Y-m-d'),
                'due_time' => '',
                'project_id' => $project->id,
                'assign_to' => $outsider->id,
                'max_submissions' => '',
            ]],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('tasks', [
            'title' => 'Restricted Task',
            'user_id' => $outsider->id,
        ]);
    }

    public function test_task_creation_accepts_project_members(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id, [
            'access_level' => 'editor',
            'permissions' => json_encode(['view', 'comment', 'submit', 'upload']),
        ]);

        $response = $this->actingAs($admin)->post(route('tasks.store'), [
            'tasks' => [[
                'title' => 'Member Task',
                'description' => null,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => now()->addDay()->format('Y-m-d'),
                'due_time' => '',
                'project_id' => $project->id,
                'assign_to' => $member->id,
                'max_submissions' => '',
            ]],
        ]);

        $response->assertRedirect(route('tasks.index'));
        $this->assertTrue(Task::where('title', 'Member Task')
            ->where('user_id', $member->id)
            ->where('project_id', $project->id)
            ->exists());
    }
}
