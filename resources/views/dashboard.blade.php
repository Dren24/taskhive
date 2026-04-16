<x-mobile-layout>
<div x-data="{
    calendarOpen: false,
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
        const d = new Date(this.current.getFullYear(), this.current.getMonth(), day);
        return d.toDateString() === this.today.toDateString();
    },
    isSelected(day) {
        if (!day || !this.selected) return false;
        const d = new Date(this.current.getFullYear(), this.current.getMonth(), day);
        return d.toDateString() === this.selected.toDateString();
    },
    hasTask(day) {
        if (!day) return false;
        const d = new Date(this.current.getFullYear(), this.current.getMonth(), day);
        const str = d.getFullYear() + '-' +
            String(d.getMonth()+1).padStart(2,'0') + '-' +
            String(d.getDate()).padStart(2,'0');
        return this.taskDates.includes(str);
    },
    prevMonth() {
        this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1);
    },
    nextMonth() {
        this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1);
    },
    selectDay(day) {
        if (!day) return;
        const d = new Date(this.current.getFullYear(), this.current.getMonth(), day);
        this.selected = (this.selected && d.toDateString() === this.selected.toDateString()) ? null : d;
    }
}">

    {{-- Purple gradient header card --}}
    <div class="mx-4 mt-6 rounded-3xl p-6 pb-7"
         style="background: linear-gradient(135deg, #6d28d9, #7c3aed, #9333ea);">

        {{-- Top row: welcome text + action icons --}}
        <div class="flex items-start justify-between mb-6">
            <div>
                <p class="text-purple-200 text-sm font-medium">Welcome back,</p>
                <h1 class="text-white text-2xl font-bold mt-0.5">{{ Auth::user()->name }}</h1>
            </div>
            <div class="flex items-center gap-2 mt-1">
                {{-- Notification bell --}}
                <div class="relative">
                    <button class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    @if($stats['todo'] + $stats['in_progress'] > 0)
                        <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white
                                     text-xs flex items-center justify-center font-bold leading-none">
                            {{ $stats['todo'] + $stats['in_progress'] }}
                        </span>
                    @endif
                </div>

                {{-- Calendar toggle --}}
                <button @click="calendarOpen = !calendarOpen"
                        :class="calendarOpen ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'"
                        class="w-10 h-10 rounded-full flex items-center justify-center transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>

                {{-- Logout --}}
                <form action="{{ route('logout') }}" method="POST">
                    @csrf
                    <button type="submit"
                            class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>

        {{-- Stat cards --}}
        <div class="grid grid-cols-3 gap-3">
            {{-- To Do --}}
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div class="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <p class="text-white text-2xl font-bold">{{ $stats['todo'] }}</p>
                <p class="text-purple-200 text-xs font-medium mt-0.5">To Do</p>
            </div>

            {{-- In Progress --}}
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div class="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p class="text-white text-2xl font-bold">{{ $stats['in_progress'] }}</p>
                <p class="text-purple-200 text-xs font-medium mt-0.5">In Progress</p>
            </div>

            {{-- Done --}}
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div class="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p class="text-white text-2xl font-bold">{{ $stats['done'] }}</p>
                <p class="text-purple-200 text-xs font-medium mt-0.5">Done</p>
            </div>
        </div>
    </div>

    {{-- Calendar (toggled from header icon) --}}
    <div class="px-4 mt-4"
         x-show="calendarOpen"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 -translate-y-2"
         x-transition:enter-end="opacity-100 translate-y-0"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100 translate-y-0"
         x-transition:leave-end="opacity-0 -translate-y-2">

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            {{-- Month navigation --}}
            <div class="flex items-center justify-between mb-4">
                <button @click="prevMonth()"
                        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-purple-100 hover:text-purple-600 transition">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                <span class="text-sm font-bold text-gray-800" x-text="monthYear"></span>
                <button @click="nextMonth()"
                        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-purple-100 hover:text-purple-600 transition">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>

            {{-- Day headers --}}
            <div class="grid grid-cols-7 mb-2">
                <template x-for="day in ['Su','Mo','Tu','We','Th','Fr','Sa']">
                    <div class="text-center text-xs font-semibold text-gray-400 py-1" x-text="day"></div>
                </template>
            </div>

            {{-- Day cells --}}
            <div class="grid grid-cols-7 gap-y-1">
                <template x-for="(day, i) in days" :key="i">
                    <div class="flex flex-col items-center justify-start py-0.5">
                        <button
                            @click="selectDay(day)"
                            :class="[
                                'w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition',
                                !day ? 'invisible' : '',
                                isToday(day) && !isSelected(day) ? 'bg-purple-100 text-purple-700 font-bold' : '',
                                isSelected(day) ? 'text-white font-bold' : '',
                                !isToday(day) && !isSelected(day) && day ? 'text-gray-700 hover:bg-gray-100' : ''
                            ]"
                            :style="isSelected(day) ? 'background: linear-gradient(135deg, #7c3aed, #9333ea)' : ''"
                            x-text="day">
                        </button>
                        <span x-show="hasTask(day)" class="w-1.5 h-1.5 rounded-full mt-0.5" style="background:#7c3aed"></span>
                    </div>
                </template>
            </div>

            {{-- Selected date label --}}
            <div x-show="selected" x-transition class="mt-3 pt-3 border-t border-gray-100 text-center">
                <p class="text-xs text-gray-500">
                    Selected: <span class="font-semibold text-purple-700"
                        x-text="selected ? selected.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'}) : ''"></span>
                </p>
            </div>
        </div>
    </div>

    {{-- Recent Tasks section --}}
    <div class="px-4 mt-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-gray-900 text-lg font-bold">Recent Tasks</h2>
            <a href="{{ route('tasks.index') }}"
               class="text-sm font-semibold" style="color: #7c3aed;">View All</a>
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
                    'in_progress' => 'bg-purple-600 text-white border-transparent',
                    'done'        => 'bg-emerald-500 text-white border-transparent',
                    default       => 'bg-gray-100 text-gray-500 border-gray-200',
                };
                $statusLabel = match($task->status) {
                    'in_progress' => 'in progress',
                    'done'        => 'done',
                    default       => 'todo',
                };
            @endphp

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3">
                {{-- Title + Priority --}}
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <h3 class="text-gray-900 font-semibold text-sm flex-1 leading-snug">
                        {{ $task->title }}
                    </h3>
                    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 {{ $priorityColor }}">
                        {{ $task->priority ?? 'medium' }}
                    </span>
                </div>

                {{-- Description --}}
                @if($task->description)
                    <p class="text-gray-400 text-xs mb-3 leading-relaxed">
                        {{ Str::limit($task->description, 80) }}
                    </p>
                @endif

                {{-- Due date + Status --}}
                <div class="flex items-center justify-between mt-2">
                    <p class="text-gray-400 text-xs">
                        @if($task->due_date)
                            Due: {{ $task->due_date->format('n/j/Y') }}
                        @endif
                    </p>
                    <span class="text-xs px-2.5 py-0.5 rounded-full border font-medium {{ $statusStyle }}">
                        {{ $statusLabel }}
                    </span>
                </div>
            </div>
        @empty
            <div class="text-center py-14">
                <p class="text-gray-400 text-sm">No tasks yet.</p>
                <a href="{{ route('tasks.create') }}"
                   class="inline-block mt-3 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow"
                   style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
                    Create your first task
                </a>
            </div>
        @endforelse
    </div>

</div>
</x-mobile-layout>
