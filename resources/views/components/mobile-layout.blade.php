<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'TaskHive') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased bg-gray-50">
        <div class="min-h-screen max-w-md mx-auto relative pb-24">
            {{ $slot }}
        </div>

        {{-- Bottom Navigation --}}
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
            <div class="max-w-md mx-auto flex items-center justify-around py-3 px-6">
                {{-- Home --}}
                <a href="{{ route('dashboard') }}"
                   class="flex flex-col items-center gap-1 {{ request()->routeIs('dashboard') ? 'text-purple-600' : 'text-gray-400' }}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.75z" />
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 21V12h6v9" />
                    </svg>
                    <span class="text-xs font-medium">Home</span>
                </a>

                {{-- Tasks --}}
                <a href="{{ route('tasks.index') }}"
                   class="flex flex-col items-center gap-1 {{ request()->routeIs('tasks.*') ? 'text-purple-600' : 'text-gray-400' }}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span class="text-xs font-medium">Tasks</span>
                </a>

                {{-- Stats --}}
                <a href="{{ route('tasks.index') }}"
                   class="flex flex-col items-center gap-1 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span class="text-xs font-medium">Stats</span>
                </a>
            </div>
        </nav>
    </body>
</html>
