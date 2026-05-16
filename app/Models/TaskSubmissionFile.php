<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskSubmissionFile extends Model
{
    protected $fillable = [
        'task_submission_id',
        'task_id',
        'project_id',
        'user_id',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    public function submission()
    {
        return $this->belongsTo(TaskSubmission::class, 'task_submission_id');
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
