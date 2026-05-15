<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectNotification extends Model
{
    protected $fillable = ['user_id', 'project_id', 'type', 'read_at'];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function isUnread(): bool
    {
        return $this->read_at === null;
    }
}
