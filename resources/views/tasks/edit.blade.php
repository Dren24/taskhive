<x-mobile-layout>
    <div class="max-w-2xl">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100"
             x-data="{ priority: '{{ old('priority', $task->priority) }}' }">

            {{-- Sheet header --}}
            <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 class="text-base font-bold text-gray-900">Edit Task</h2>
                <a href="{{ route('tasks.index') }}"
                   class="text-sm text-gray-400 hover:text-gray-600 transition">Cancel</a>
            </div>

            <form action="{{ route('tasks.update', $task) }}" method="POST">
                @csrf
                @method('PUT')
                <input type="hidden" name="priority" :value="priority">

                <div class="px-6 pt-5 pb-6 space-y-5">

                    {{-- Task title --}}
                    <div>
                        <input type="text" name="title" value="{{ old('title', $task->title) }}"
                               placeholder="Task title"
                               class="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 @error('title') border-red-400 @enderror"
                               required>
                        @error('title')
                            <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                        @enderror
                    </div>

                    {{-- Description --}}
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h10"/>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">Description</span>
                        </div>
                        <textarea name="description" rows="3"
                                  placeholder="Task description"
                                  class="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none">{{ old('description', $task->description) }}</textarea>
                    </div>

                    {{-- Status --}}
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h8m-8 6h16"/>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">Status</span>
                        </div>
                        <div class="relative">
                            <select name="status"
                                    class="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                                <option value="todo"        {{ old('status', $task->status) === 'todo'        ? 'selected' : '' }}>To Do</option>
                                <option value="in_progress" {{ old('status', $task->status) === 'in_progress' ? 'selected' : '' }}>In Progress</option>
                                <option value="done"        {{ old('status', $task->status) === 'done'        ? 'selected' : '' }}>Done</option>
                            </select>
                            <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                    </div>

                    {{-- Priority pill buttons --}}
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 21V8l9-5 9 5v13M9 21V12h6v9"/>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">Priority</span>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" @click="priority = 'low'"
                                    :class="priority === 'low'
                                        ? 'border-2 border-gray-400 text-gray-700 font-semibold bg-white'
                                        : 'border border-gray-200 text-gray-500 bg-white hover:border-gray-300'"
                                    class="flex-1 py-2.5 rounded-xl text-sm transition">
                                Low
                            </button>
                            <button type="button" @click="priority = 'medium'"
                                    :class="priority === 'medium'
                                        ? 'border-2 border-amber-400 text-amber-600 font-semibold bg-amber-50'
                                        : 'border border-gray-200 text-gray-500 bg-white hover:border-amber-200'"
                                    class="flex-1 py-2.5 rounded-xl text-sm transition">
                                Medium
                            </button>
                            <button type="button" @click="priority = 'high'"
                                    :class="priority === 'high'
                                        ? 'border-2 border-rose-400 text-rose-600 font-semibold bg-rose-50'
                                        : 'border border-gray-200 text-gray-500 bg-white hover:border-rose-200'"
                                    class="flex-1 py-2.5 rounded-xl text-sm transition">
                                High
                            </button>
                        </div>
                    </div>

                    {{-- Project --}}
                    @if($projects->isNotEmpty())
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">Project</span>
                        </div>
                        <div class="relative">
                            <select name="project_id"
                                    class="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                                <option value="">— No Project —</option>
                                @foreach($projects as $project)
                                    <option value="{{ $project->id }}"
                                        {{ (old('project_id', $task->project_id) == $project->id) ? 'selected' : '' }}>
                                        {{ $project->name }}
                                    </option>
                                @endforeach
                            </select>
                            <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                    </div>
                    @endif

                    {{-- Due Date --}}
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span class="text-sm font-semibold text-gray-700">Due Date</span>
                        </div>
                        <input type="date" name="due_date"
                               value="{{ old('due_date', $task->due_date?->format('Y-m-d')) }}"
                               class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        @error('due_date')
                            <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                        @enderror
                    </div>

                    {{-- Submit --}}
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <a href="{{ route('tasks.index') }}"
                           class="px-5 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                            Cancel
                        </a>
                        <button type="submit"
                                class="px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition"
                                style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
                            Save Changes
                        </button>
                    </div>

                </div>
            </form>
        </div>
    </div>
</x-mobile-layout>
