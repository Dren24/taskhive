<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'user_id', 'project_id', 'title', 'description', 'priority', 'status',
        'due_date', 'due_time', 'max_submissions',
        'group_id', 'submission_mode', 'leader_user_id',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_user_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class)->latest();
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(TaskSubmission::class)->latest();
    }

    public function submissionFiles(): HasMany
    {
        return $this->hasMany(TaskSubmissionFile::class)->latest();
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(TaskNotification::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(TaskVote::class);
    }
}
