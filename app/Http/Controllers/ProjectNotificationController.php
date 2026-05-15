<?php

namespace App\Http\Controllers;

use App\Models\ProjectNotification;
use Illuminate\Support\Facades\Auth;

class ProjectNotificationController extends Controller
{
    public function markRead(ProjectNotification $notification)
    {
        abort_unless($notification->user_id === Auth::id(), 403);

        $notification->update(['read_at' => now()]);

        return back();
    }
}
