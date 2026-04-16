<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans text-gray-900 antialiased" style="background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 50%, #e8eaf6 100%); min-height: 100vh;">
        <div class="min-h-screen flex items-center justify-center px-4 py-12">
            <div class="w-full max-w-sm bg-white rounded-3xl shadow-xl px-8 py-10">
                {{-- Logo --}}
                <div class="flex justify-center mb-5">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md" style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
                        <div class="w-8 h-8 bg-white rounded-lg opacity-90"></div>
                    </div>
                </div>
                {{ $slot }}
            </div>
        </div>
    </body>
</html>
