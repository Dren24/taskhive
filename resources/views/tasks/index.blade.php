<x-mobile-layout>

    {{-- Top bar --}}
    <div class="flex items-center justify-between px-4 pt-6 pb-4">
        <h1 class="text-xl font-bold text-gray-900">My Tasks</h1>
        <a href="{{ route('tasks.create') }}"
           class="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
           style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
            +
        </a>
    </div>

    <div class="px-4">

        @if(session('success'))
            <div class="mb-4 px-4 py-3 rounded-xl bg-green-100 text-green-800 text-sm">
                {{ session('success') }}
            </div>
        @endif

        {{-- Stats bar --}}
        @php
            $todo        = $tasks->where('status', 'todo')->count();
            $in_progress = $tasks->where('status', 'in_progress')->count();
            $done        = $tasks->where('status', 'done')->count();
        @endphp
        <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
                <p class="text-2xl font-bold text-gray-800">{{ $todo }}</p>
                <p class="text-xs text-gray-400 mt-0.5">To Do</p>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
                <p class="text-2xl font-bold text-purple-600">{{ $in_progress }}</p>
                <p class="text-xs text-gray-400 mt-0.5">In Progress</p>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
                <p class="text-2xl font-bold text-emerald-500">{{ $done }}</p>
                <p class="text-xs text-gray-400 mt-0.5">Done</p>
            </div>
        </div>

        @if($tasks->isEmpty())
            <div class="text-center py-20 text-gray-400">
                <p class="text-base">No tasks yet. Create your first task!</p>
                <a href="{{ route('tasks.create') }}"
                   class="inline-block mt-4 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow"
                   style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
                    + Create Task
                </a>
            </div>
        @else
            <div class="space-y-3">
                @foreach($tasks as $task)
                    @php
                        $priorityColor = match($task->priority ?? 'medium') {
                            'high'   => 'bg-rose-100 text-rose-600',
                            'medium' => 'bg-amber-100 text-amber-600',
                            'low'    => 'bg-gray-100 text-gray-500',
                            default  => 'bg-gray-100 text-gray-500',
                        };
                        $statusStyle = match($task->status) {
                            'in_progress' => 'bg-purple-600 text-white',
                            'done'        => 'bg-emerald-500 text-white',
                            default       => 'bg-gray-100 text-gray-500',
                        };
                        $statusLabel = match($task->status) {
                            'in_progress' => 'in progress',
                            'done'        => 'done',
                            default       => 'todo',
                        };
                    @endphp

                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4
                        {{ $task->status === 'done' ? 'opacity-60' : '' }}">

                        {{-- Title + Priority --}}
                        <div class="flex items-start justify-between gap-2 mb-1.5">
                            <p class="font-semibold text-gray-900 text-sm flex-1 leading-snug
                                {{ $task->status === 'done' ? 'line-through text-gray-400' : '' }}">
                                {{ $task->title }}
                            </p>
                            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 {{ $priorityColor }}">
                                {{ $task->priority ?? 'medium' }}
                            </span>
                        </div>

                        {{-- Description --}}
                        @if($task->description)
                            <p class="text-gray-400 text-xs mb-3 leading-relaxed">
                                {{ Str::limit($task->description, 90) }}
                            </p>
                        @endif

                        {{-- Due date + Status --}}
                        <div class="flex items-center justify-between mt-2">
                            <p class="text-gray-400 text-xs">
                                @if($task->due_date)
                                    Due: {{ $task->due_date->format('n/j/Y') }}
                                @endif
                            </p>
                            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium {{ $statusStyle }}">
                                {{ $statusLabel }}
                            </span>
                        </div>

                        {{-- Action buttons --}}
                        <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <form action="{{ route('tasks.toggle', $task) }}" method="POST" class="flex-1">
                                @csrf @method('PATCH')
                                <button type="submit"
                                    class="w-full text-xs py-1.5 rounded-lg border font-medium transition
                                    {{ $task->status === 'done'
                                        ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                        : 'border-purple-300 text-purple-600 hover:bg-purple-50' }}">
                                    {{ $task->status === 'done' ? 'Reopen' : 'Advance' }}
                                </button>
                            </form>

                            <a href="{{ route('tasks.edit', $task) }}"
                               class="flex-1 text-center text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition">
                                Edit
                            </a>

                            <form action="{{ route('tasks.destroy', $task) }}" method="POST" class="flex-1"
                                  onsubmit="return confirm('Delete this task?')">
                                @csrf @method('DELETE')
                                <button type="submit"
                                    class="w-full text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition">
                                    Delete
                                </button>
                            </form>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>
</x-mobile-layout>
