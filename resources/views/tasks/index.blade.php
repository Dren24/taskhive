<x-mobile-layout>

    {{-- Stats bar --}}
    @php
        $todo        = $tasks->where('status', 'todo')->count();
        $in_progress = $tasks->where('status', 'in_progress')->count();
        $done        = $tasks->where('status', 'done')->count();
    @endphp

    <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);">
                <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
            </div>
            <div>
                <p class="text-3xl font-bold text-gray-900">{{ $todo }}</p>
                <p class="text-sm text-gray-400 mt-0.5">To Do</p>
            </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);">
                <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div>
                <p class="text-3xl font-bold text-gray-900">{{ $in_progress }}</p>
                <p class="text-sm text-gray-400 mt-0.5">In Progress</p>
            </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#d1fae5,#a7f3d0);">
                <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div>
                <p class="text-3xl font-bold text-gray-900">{{ $done }}</p>
                <p class="text-sm text-gray-400 mt-0.5">Done</p>
            </div>
        </div>
    </div>

    {{-- Flash --}}
    @if(session('success'))
        <div class="mb-6 px-4 py-3 rounded-xl bg-green-100 text-green-800 text-sm font-medium">
            {{ session('success') }}
        </div>
    @endif

    {{-- Task table --}}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900">All Tasks</h2>
            <span class="text-sm text-gray-400">{{ $tasks->count() }} task{{ $tasks->count() === 1 ? '' : 's' }}</span>
        </div>

        @if($tasks->isEmpty())
            <div class="text-center py-20">
                <div class="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                </div>
                <p class="text-gray-400 text-sm">No tasks yet.</p>
                <a href="{{ route('tasks.create') }}"
                   class="inline-block mt-4 text-sm font-semibold px-5 py-2 rounded-xl text-white shadow hover:opacity-90 transition"
                   style="background:linear-gradient(135deg,#7c3aed,#9333ea);">+ Create Task</a>
            </div>
        @else
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50 text-left">
                        <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                        <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Priority</th>
                        <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                        <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Due Date</th>
                        <th class="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    @foreach($tasks as $task)
                        @php
                            $priorityColor = match($task->priority ?? 'medium') {
                                'high'   => 'bg-rose-100 text-rose-600',
                                'medium' => 'bg-amber-100 text-amber-600',
                                'low'    => 'bg-gray-100 text-gray-500',
                                default  => 'bg-gray-100 text-gray-500',
                            };
                            $statusStyle = match($task->status) {
                                'in_progress' => 'bg-purple-100 text-purple-700',
                                'done'        => 'bg-emerald-100 text-emerald-700',
                                default       => 'bg-gray-100 text-gray-500',
                            };
                            $statusLabel = match($task->status) {
                                'in_progress' => 'In Progress',
                                'done'        => 'Done',
                                default       => 'To Do',
                            };
                        @endphp
                        <tr class="hover:bg-gray-50 transition group">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full shrink-0 {{ $task->status === 'done' ? 'bg-emerald-400' : ($task->status === 'in_progress' ? 'bg-purple-500' : 'bg-gray-300') }}"></div>
                                    <div>
                                        <p class="text-sm font-semibold text-gray-800 {{ $task->status === 'done' ? 'line-through text-gray-400' : '' }}">
                                            {{ $task->title }}
                                        </p>
                                        @if($task->description)
                                            <p class="text-xs text-gray-400 mt-0.5">{{ Str::limit($task->description, 60) }}</p>
                                        @endif
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-4">
                                <span class="text-xs px-2.5 py-1 rounded-full font-medium {{ $priorityColor }}">{{ ucfirst($task->priority ?? 'medium') }}</span>
                            </td>
                            <td class="px-4 py-4">
                                <span class="text-xs px-2.5 py-1 rounded-full font-medium {{ $statusStyle }}">{{ $statusLabel }}</span>
                            </td>
                            <td class="px-4 py-4">
                                <span class="text-sm text-gray-500">
                                    {{ $task->due_date ? $task->due_date->format('M j, Y') : '—' }}
                                </span>
                            </td>
                            <td class="px-4 py-4">
                                <div class="flex items-center justify-end gap-2">
                                    <form action="{{ route('tasks.toggle', $task) }}" method="POST">
                                        @csrf @method('PATCH')
                                        <button type="submit"
                                            class="text-xs px-3 py-1.5 rounded-lg border font-medium transition
                                            {{ $task->status === 'done'
                                                ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                                : 'border-purple-200 text-purple-600 hover:bg-purple-50' }}">
                                            {{ $task->status === 'done' ? 'Reopen' : 'Advance' }}
                                        </button>
                                    </form>
                                    <a href="{{ route('tasks.edit', $task) }}"
                                       class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition">
                                        Edit
                                    </a>
                                    <form action="{{ route('tasks.destroy', $task) }}" method="POST"
                                          onsubmit="return confirm('Delete this task?')">
                                        @csrf @method('DELETE')
                                        <button type="submit"
                                            class="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition">
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    </div>

</x-mobile-layout>
