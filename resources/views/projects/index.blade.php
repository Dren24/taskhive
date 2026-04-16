<x-mobile-layout>

    {{-- Flash --}}
    @if(session('success'))
        <div class="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            {{ session('success') }}
        </div>
    @endif

    {{-- Header row --}}
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-xl font-bold text-gray-900">Projects</h1>
            <p class="text-sm text-gray-400 mt-0.5">Organize your tasks</p>
        </div>
        <button onclick="document.getElementById('new-project-modal').classList.remove('hidden')"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow transition hover:opacity-90"
                style="background: linear-gradient(135deg,#7c3aed,#9333ea);">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            New Project
        </button>
    </div>

    {{-- Project cards grid --}}
    @if($projects->isEmpty())
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 flex flex-col items-center justify-center">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                 style="background: linear-gradient(135deg,#ede9fe,#ddd6fe);">
                <svg class="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                </svg>
            </div>
            <p class="text-gray-500 text-sm font-medium">No projects yet.</p>
            <p class="text-gray-400 text-xs mt-1">Create a project to group your tasks.</p>
        </div>
    @else
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            @foreach($projects as $project)
                @php
                    $gradients = [
                        'purple' => ['bg' => 'linear-gradient(135deg,#ede9fe,#ddd6fe)', 'icon' => 'text-purple-600', 'dot' => '#7c3aed'],
                        'blue'   => ['bg' => 'linear-gradient(135deg,#dbeafe,#bfdbfe)', 'icon' => 'text-blue-600',   'dot' => '#2563eb'],
                        'green'  => ['bg' => 'linear-gradient(135deg,#d1fae5,#a7f3d0)', 'icon' => 'text-emerald-600','dot' => '#059669'],
                        'rose'   => ['bg' => 'linear-gradient(135deg,#ffe4e6,#fecdd3)', 'icon' => 'text-rose-600',   'dot' => '#e11d48'],
                        'amber'  => ['bg' => 'linear-gradient(135deg,#fef3c7,#fde68a)', 'icon' => 'text-amber-600',  'dot' => '#d97706'],
                        'indigo' => ['bg' => 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', 'icon' => 'text-indigo-600', 'dot' => '#4338ca'],
                    ];
                    $g = $gradients[$project->color] ?? $gradients['purple'];
                @endphp
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 group relative">
                    {{-- Top row: icon + menu --}}
                    <div class="flex items-start justify-between">
                        <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                             style="background: {{ $g['bg'] }};">
                            <svg class="w-5 h-5 {{ $g['icon'] }}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                            </svg>
                        </div>
                        {{-- Delete button (three-dot style) --}}
                        <div x-data="{ open: false }" class="relative">
                            <button @click="open = !open"
                                    class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                                </svg>
                            </button>
                            <div x-show="open" @click.outside="open = false"
                                 class="absolute right-0 top-8 w-32 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                                <form action="{{ route('projects.destroy', $project) }}" method="POST"
                                      onsubmit="return confirm('Delete this project?')">
                                    @csrf @method('DELETE')
                                    <button type="submit"
                                            class="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition">
                                        Delete
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {{-- Name + task count --}}
                    <div>
                        <h3 class="text-sm font-bold text-gray-900 leading-snug">{{ $project->name }}</h3>
                        <p class="text-xs text-gray-400 mt-1">
                            Tasks &nbsp;<span class="font-semibold text-gray-600">{{ $project->tasks_count }}</span>
                        </p>
                    </div>

                    {{-- Mini progress dot --}}
                    <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        @if($project->tasks_count > 0)
                            @php
                                $done = $project->tasks()->where('status','done')->count();
                                $pct  = round(($done / $project->tasks_count) * 100);
                            @endphp
                            <div class="h-full rounded-full transition-all"
                                 style="width:{{ $pct }}%; background:{{ $g['dot'] }};"></div>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    @endif

    {{-- ── New Project Modal ── --}}
    <div id="new-project-modal"
         class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div class="flex items-center justify-between mb-5">
                <h2 class="text-base font-bold text-gray-900">New Project</h2>
                <button onclick="document.getElementById('new-project-modal').classList.add('hidden')"
                        class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form action="{{ route('projects.store') }}" method="POST" class="space-y-5">
                @csrf
                {{-- Name --}}
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Project Name</label>
                    <input type="text" name="name" placeholder="e.g. Website Redesign"
                           class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                           required>
                </div>

                {{-- Color --}}
                <div x-data="{ color: 'purple' }">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <input type="hidden" name="color" :value="color">
                    <div class="flex gap-3">
                        @foreach([
                            'purple' => '#7c3aed',
                            'blue'   => '#2563eb',
                            'green'  => '#059669',
                            'rose'   => '#e11d48',
                            'amber'  => '#d97706',
                            'indigo' => '#4338ca',
                        ] as $key => $hex)
                            <button type="button" @click="color = '{{ $key }}'"
                                    :class="color === '{{ $key }}' ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''"
                                    class="w-7 h-7 rounded-full transition-transform"
                                    style="background: {{ $hex }};"></button>
                        @endforeach
                    </div>
                </div>

                {{-- Actions --}}
                <div class="flex items-center justify-end gap-3 pt-1">
                    <button type="button"
                            onclick="document.getElementById('new-project-modal').classList.add('hidden')"
                            class="px-5 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition"
                            style="background: linear-gradient(135deg,#7c3aed,#9333ea);">
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    </div>

</x-mobile-layout>
