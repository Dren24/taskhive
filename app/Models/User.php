<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'admin_id', 'admin_invitation_code', 'admin_invitation_code_expires_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'admin_invitation_code_expires_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function managedUsers()
    {
        return $this->hasMany(User::class, 'admin_id');
    }

    public function scopeManagedBy($query, User $admin)
    {
        return $query->where('admin_id', $admin->id);
    }

    public function invitationCodeIsActive(): bool
    {
        return $this->isAdmin()
            && filled($this->admin_invitation_code)
            && (
                $this->admin_invitation_code_expires_at === null
                || $this->admin_invitation_code_expires_at->isFuture()
            );
    }

    public function workspaceUserIds()
    {
        return $this->isAdmin()
            ? $this->managedUsers()->pluck('id')->push($this->id)->unique()->values()
            : collect([$this->id]);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function memberProjects()
    {
        return $this->belongsToMany(Project::class, 'project_user');
    }

    public function allProjects()
    {
        return Project::query()
            ->where('user_id', $this->id)
            ->orWhereHas('members', fn($q) => $q->where('users.id', $this->id));
    }
}
