<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskVote extends Model
{
    protected $fillable = ['task_id', 'voter_user_id', 'candidate_user_id'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function voter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voter_user_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_user_id');
    }
}
