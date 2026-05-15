<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = ['user_id', 'project_id', 'title', 'description', 'priority', 'status', 'due_date', 'due_time', 'max_submissions'];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class)->latest();
    }

    public function submissions()
    {
        return $this->hasMany(TaskSubmission::class)->latest();
    }

    public function notifications()
    {
        return $this->hasMany(TaskNotification::class);
    }
}
