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

    public function test_global_task_creation_does_not_require_project_folder(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);

        $response = $this->actingAs($admin)->post(route('tasks.store'), [
            'tasks' => [[
                'title' => 'Global Task',
                'description' => null,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => now()->addDay()->format('Y-m-d'),
                'due_time' => '',
                'project_id' => '',
                'assign_to' => $member->id,
                'max_submissions' => '',
            ]],
        ]);

        $response->assertRedirect(route('tasks.index'));
        $this->assertDatabaseHas('tasks', [
            'title' => 'Global Task',
            'user_id' => $member->id,
            'project_id' => null,
        ]);
    }

    public function test_global_task_page_excludes_project_folder_tasks(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id);

        Task::create([
            'user_id' => $member->id,
            'project_id' => null,
            'title' => 'Visible Global Task',
            'priority' => 'medium',
            'status' => 'todo',
            'due_date' => now()->addDay()->format('Y-m-d'),
        ]);
        Task::create([
            'user_id' => $member->id,
            'project_id' => $project->id,
            'title' => 'Hidden Folder Task',
            'priority' => 'medium',
            'status' => 'todo',
            'due_date' => now()->addDay()->format('Y-m-d'),
        ]);

        $response = $this->actingAs($admin)->get(route('tasks.index'));

        $response->assertOk();
        $response->assertSee('Visible Global Task');
        $response->assertDontSee('Hidden Folder Task');
    }

    public function test_task_creation_requires_deadline_date_but_not_time(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id);

        $missingDate = $this->actingAs($admin)->from(route('tasks.create'))->post(route('tasks.store'), [
            'tasks' => [[
                'title' => 'Needs Date',
                'description' => null,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => '',
                'due_time' => '',
                'project_id' => $project->id,
                'assign_to' => $member->id,
                'max_submissions' => '',
            ]],
        ]);

        $missingDate->assertRedirect(route('tasks.create'));
        $missingDate->assertSessionHasErrors('tasks.0.due_date');

        $dateOnly = $this->actingAs($admin)->post(route('tasks.store'), [
            'tasks' => [[
                'title' => 'Date Only',
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

        $dateOnly->assertRedirect(route('tasks.index'));
        $this->assertDatabaseHas('tasks', [
            'title' => 'Date Only',
            'user_id' => $member->id,
            'due_time' => null,
        ]);
    }

    public function test_group_task_creation_requires_deadline_date(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id);

        $response = $this->actingAs($admin)->from(route('projects.show', $project))->post(route('tasks.store.group'), [
            'tasks' => [[
                'title' => 'Group Task',
                'description' => null,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => '',
                'due_time' => '',
                'project_id' => $project->id,
                'assign_to' => $member->id,
            ]],
        ]);

        $response->assertRedirect(route('projects.show', $project));
        $response->assertSessionHasErrors('tasks.0.due_date');
    }
}
