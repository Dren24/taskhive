<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskAttachmentUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_task_with_multiple_attachments_in_project_folder(): void
    {
        Storage::fake('local');

        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id);

        $response = $this->actingAs($admin)->post(route('tasks.store'), [
            'tasks' => [[
                'title' => 'Upload brief',
                'description' => null,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => now()->addDay()->format('Y-m-d'),
                'due_time' => '',
                'project_id' => $project->id,
                'assign_to' => $member->id,
                'max_submissions' => '',
            ]],
            'files' => [[
                UploadedFile::fake()->image('brief.png'),
                UploadedFile::fake()->create('requirements.pdf', 64, 'application/pdf'),
            ]],
        ]);

        $response->assertRedirect(route('tasks.index'));

        $task = Task::where('title', 'Upload brief')->firstOrFail();

        $this->assertCount(2, $task->attachments);
        $this->assertDatabaseHas('task_attachments', [
            'task_id' => $task->id,
            'project_id' => $project->id,
            'original_name' => 'brief.png',
        ]);

        foreach ($task->attachments as $attachment) {
            $this->assertStringStartsWith("projects/{$project->id}/tasks/{$task->id}/attachments", $attachment->path);
            Storage::disk('local')->assertExists($attachment->path);
        }
    }

    public function test_user_submission_saves_multiple_files_to_submission_records(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'user', 'admin_id' => $admin->id]);
        $project = Project::create([
            'user_id' => $member->id,
            'name' => 'Client Work',
            'color' => '#8B5CF6',
        ]);
        $project->members()->attach($member->id);
        $task = Task::create([
            'user_id' => $member->id,
            'project_id' => $project->id,
            'title' => 'Submit assets',
            'priority' => 'medium',
            'status' => 'todo',
            'due_date' => now()->addDay()->format('Y-m-d'),
        ]);

        $response = $this->actingAs($member)->post(route('tasks.submit', $task), [
            'comment' => 'Here are the files.',
            'files' => [
                UploadedFile::fake()->image('screenshot.jpg'),
                UploadedFile::fake()->create('deliverable.zip', 128, 'application/zip'),
            ],
        ]);

        $response->assertRedirect();

        $submission = $task->submissions()->with('files')->firstOrFail();

        $this->assertSame(2, $submission->files->count());
        $this->assertSame($project->id, $submission->project_id);
        $this->assertDatabaseHas('task_submission_files', [
            'task_submission_id' => $submission->id,
            'task_id' => $task->id,
            'project_id' => $project->id,
            'original_name' => 'screenshot.jpg',
        ]);

        foreach ($submission->files as $file) {
            $this->assertStringStartsWith("projects/{$project->id}/tasks/{$task->id}/submissions/attempt-1", $file->path);
            Storage::disk('public')->assertExists($file->path);
        }
    }
}
