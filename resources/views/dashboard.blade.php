<x-mobile-layout>
<div x-data="{
    today: new Date(),
    current: new Date(),
    selected: null,
    taskDates: {{ $taskDates }},
    get monthYear() {
        return this.current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    },
    get days() {
        const year = this.current.getFullYear();
        const month = this.current.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const total = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= total; d++) days.push(d);
        return days;
    },
    isToday(day) {
        if (!day) return false;
        return new Date(this.current.getFullYear(), this.current.getMonth(), day).toDateString() === this.today.toDateString();
    },
    isSelected(day) {
        if (!day || !this.selected) return false;
        return new Date(this.current.getFullYear(), this.current.getMonth(), day).toDateString() === this.selected.toDateString();
    },
    hasTask(day) {
        if (!day) return false;
        const d = new Date(this.current.getFullYear(), this.current.getMonth(), day);
        const str = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        return this.taskDates.includes(str);
    },
    prevMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth()-1, 1); },
    nextMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth()+1, 1); },
    selectDay(day) {
        if (!day) return;
        const d = new Date(this.current.getFullYear(), this.current.getMonth(), day);
        this.selected = (this.selected && d.toDateString() === this.selected.toDateString()) ? null : d;
    }
}">

    {{-- ── Stat cards ── --}}
    <div class="grid grid-cols-3 gap-6 mb-8">
        {{-- To Do --}}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                 style="background: linear-gradient(135deg,#ede9fe,#ddd6fe);">
                <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
            </div>
            <div>
                <p class="text-3xl font-bold text-gray-900">{{ $stats['todo'] }}</p>
                <p class="text-sm text-gray-400 mt-0.5">To Do</p>
            </div>
        </div>

        {{-- In Progress --}}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                 style="background: linear-gradient(135deg,#ede9fe,#ddd6fe);">
                <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div>
                <p class="text-3xl font-bold text-gray-900">{{ $stats['in_progress'] }}</p>
                <p class="text-sm text-gray-400 mt-0.5">In Progress</p>
            </div>
        </div>

        {{-- Done --}}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                 style="background: linear-gradient(135deg,#d1fae5,#a7f3d0);">
                <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div>
                <p class="text-3xl font-bold text-gray-900">{{ $stats['done'] }}</p>
                <p class="text-sm text-gray-400 mt-0.5">Done</p>
            </div>
        </div>
    </div>

    {{-- ── Two-column layout: Recent Tasks + Calendar ── --}}
    <div class="grid grid-cols-3 gap-6">

        {{-- Recent Tasks (2/3 width) --}}
        <div class="col-span-2">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center justify-between mb-5">
                    <h2 class="text-base font-bold text-gray-900">Recent Tasks</h2>
                    <a href="{{ route('tasks.index') }}"
                       class="text-sm font-semibold text-purple-600 hover:text-purple-800 transition">View All →</a>
                </div>

                @forelse($tasks as $task)
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
                    <div class="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 group">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <div class="w-2 h-2 rounded-full shrink-0 {{ $task->status === 'done' ? 'bg-emerald-400' : ($task->status === 'in_progress' ? 'bg-purple-500' : 'bg-gray-300') }}"></div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-800 truncate {{ $task->status === 'done' ? 'line-through text-gray-400' : '' }}">
                                    {{ $task->title }}
                                </p>
                                @if($task->due_date)
                                    <p class="text-xs text-gray-400 mt-0.5">Due {{ $task->due_date->format('M j, Y') }}</p>
                                @endif
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0 ml-4">
                            <span class="text-xs px-2.5 py-1 rounded-full font-medium {{ $priorityColor }}">
                                {{ ucfirst($task->priority ?? 'medium') }}
                            </span>
                            <span class="text-xs px-2.5 py-1 rounded-full font-medium {{ $statusStyle }}">
                                {{ $statusLabel }}
                            </span>
                            <a href="{{ route('tasks.edit', $task) }}"
                               class="text-gray-300 hover:text-purple-600 transition opacity-0 group-hover:opacity-100">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                @empty
                    <div class="text-center py-12">
                        <div class="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                            <svg class="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </div>
                        <p class="text-gray-400 text-sm">No tasks yet.</p>
                        <a href="{{ route('tasks.create') }}"
                           class="inline-block mt-3 text-sm font-semibold px-5 py-2 rounded-xl text-white shadow hover:opacity-90 transition"
                           style="background: linear-gradient(135deg,#7c3aed,#9333ea);">
                            Create your first task
                        </a>
                    </div>
                @endforelse
            </div>
        </div>

        {{-- Calendar (1/3 width) --}}
        <div class="col-span-1">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div class="flex items-center justify-between mb-4">
                    <button @click="prevMonth()"
                            class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-purple-100 hover:text-purple-600 transition">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <span class="text-sm font-bold text-gray-800" x-text="monthYear"></span>
                    <button @click="nextMonth()"
                            class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-purple-100 hover:text-purple-600 transition">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                <div class="grid grid-cols-7 mb-2">
                    <template x-for="day in ['Su','Mo','Tu','We','Th','Fr','Sa']">
                        <div class="text-center text-xs font-semibold text-gray-400 py-1" x-text="day"></div>
                    </template>
                </div>

                <div class="grid grid-cols-7 gap-y-0.5">
                    <template x-for="(day, i) in days" :key="i">
                        <div class="flex flex-col items-center py-0.5">
                            <button @click="selectDay(day)"
                                :class="[
                                    'w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition',
                                    !day ? 'invisible' : '',
                                    isToday(day) && !isSelected(day) ? 'bg-purple-100 text-purple-700 font-bold' : '',
                                    isSelected(day) ? 'text-white font-bold' : '',
                                    !isToday(day) && !isSelected(day) && day ? 'text-gray-700 hover:bg-gray-100' : ''
                                ]"
                                :style="isSelected(day) ? 'background:linear-gradient(135deg,#7c3aed,#9333ea)' : ''"
                                x-text="day">
                            </button>
                            <span x-show="hasTask(day)" class="w-1.5 h-1.5 rounded-full" style="background:#7c3aed"></span>
                        </div>
                    </template>
                </div>

                <div x-show="selected" x-transition class="mt-3 pt-3 border-t border-gray-100 text-center">
                    <p class="text-xs text-gray-500">
                        <span class="font-semibold text-purple-700"
                              x-text="selected ? selected.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) : ''"></span>
                    </p>
                </div>
            </div>
        </div>

    </div>

</div>
</x-mobile-layout>
