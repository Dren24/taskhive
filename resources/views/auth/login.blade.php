<x-guest-layout>
    <h1 class="text-2xl font-bold text-center text-gray-900 tracking-tight">Welcome Back</h1>
    <p class="text-sm text-center text-gray-400 mt-1 mb-7">Sign in to continue</p>

    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}" class="space-y-4">
        @csrf

        {{-- Email --}}
        <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}"
                   class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition @error('email') border-red-400 @enderror"
                   placeholder="you@example.com" required autofocus autocomplete="username">
            @error('email')
                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
            @enderror
        </div>

        {{-- Password --}}
        <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div class="relative">
                <input id="password" type="password" name="password"
                       class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition @error('password') border-red-400 @enderror"
                       placeholder="••••••••" required autocomplete="current-password">
                <button type="button" onclick="togglePwd('password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {{-- Eye open --}}
                    <svg id="eye-open-password" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{-- Eye closed --}}
                    <svg id="eye-closed-password" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.07-3.368M9.88 9.88A3 3 0 0114.12 14.12M3 3l18 18" />
                    </svg>
                </button>
            </div>
            @error('password')
                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
            @enderror
        </div>

        {{-- Submit --}}
        <div class="pt-1">
            <button type="submit"
                    class="w-full text-white font-semibold py-3 rounded-xl text-sm shadow-md hover:opacity-90 transition"
                    style="background: linear-gradient(135deg, #7c3aed, #9333ea);">
                Sign In
            </button>
        </div>

        {{-- Forgot password --}}
        @if (Route::has('password.request'))
            <div class="text-center">
                <a href="{{ route('password.request') }}" class="text-sm font-medium" style="color: #7c3aed;">Forgot Password?</a>
            </div>
        @endif

        {{-- Register link --}}
        <p class="text-center text-sm text-gray-500 pt-1">
            Don't have an account?
            <a href="{{ route('register') }}" class="font-semibold" style="color: #7c3aed;">Sign Up</a>
        </p>
    </form>

    <script>
    function togglePwd(fieldId, btn) {
        const input = document.getElementById(fieldId);
        const open   = document.getElementById('eye-open-'   + fieldId);
        const closed = document.getElementById('eye-closed-' + fieldId);
        if (input.type === 'password') {
            input.type = 'text';
            open.classList.add('hidden');
            closed.classList.remove('hidden');
        } else {
            input.type = 'password';
            open.classList.remove('hidden');
            closed.classList.add('hidden');
        }
    }
    </script>
</x-guest-layout>
