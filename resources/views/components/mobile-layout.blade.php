<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'TaskHive') }}</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased bg-gray-50">

        <div class="min-h-screen flex">

            {{-- ── Sidebar ── --}}
            <aside class="w-64 shrink-0 flex flex-col shadow-sm" style="background: linear-gradient(180deg,#5b21b6 0%,#7c3aed 60%,#9333ea 100%);">

                {{-- Logo --}}
                <div class="px-6 py-6 flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                        </svg>
                    </div>
                    <span class="text-white text-xl font-bold tracking-tight">TaskHive</span>
                </div>

                {{-- Nav links --}}
                <nav class="flex-1 px-4 space-y-1">
                    <a href="{{ route('dashboard') }}"
                       class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
                              {{ request()->routeIs('dashboard') ? 'bg-white/20 text-white' : 'text-purple-200 hover:bg-white/10 hover:text-white' }}">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.75z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 21V12h6v9"/>
                        </svg>
                        Dashboard
                    </a>
                    <a href="{{ route('tasks.index') }}"
                       class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
                              {{ request()->routeIs('tasks.*') ? 'bg-white/20 text-white' : 'text-purple-200 hover:bg-white/10 hover:text-white' }}">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                        </svg>
                        My Tasks
                    </a>
                    <a href="{{ route('tasks.create') }}"
                       class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
                              {{ request()->routeIs('tasks.create') ? 'bg-white/20 text-white' : 'text-purple-200 hover:bg-white/10 hover:text-white' }}">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        New Task
                    </a>
                </nav>

                {{-- User block --}}
                <div class="px-4 pb-6">
                    <div class="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {{ strtoupper(substr(Auth::user()->name, 0, 1)) }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-white text-sm font-semibold truncate">{{ Auth::user()->name }}</p>
                            <p class="text-purple-300 text-xs truncate">{{ Auth::user()->email }}</p>
                        </div>
                        <form action="{{ route('logout') }}" method="POST">
                            @csrf
                            <button type="submit" title="Logout"
                                    class="text-purple-300 hover:text-white transition">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {{-- ── Main area ── --}}
            <div class="flex-1 flex flex-col min-w-0">

                {{-- Top bar --}}
                <header class="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 class="text-xl font-bold text-gray-900">
                            @if(request()->routeIs('dashboard'))          Dashboard
                            @elseif(request()->routeIs('tasks.create'))   New Task
                            @elseif(request()->routeIs('tasks.edit'))     Edit Task
                            @else                                          My Tasks
                            @endif
                        </h1>
                        <p class="text-sm text-gray-400 mt-0.5">{{ now()->format('l, F j, Y') }}</p>
                    </div>
                </header>

                {{-- Page content --}}
                <main class="flex-1 overflow-y-auto p-8">
                    {{ $slot }}
                </main>
            </div>

        </div>

    </body>
</html>
