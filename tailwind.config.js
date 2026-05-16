import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Light Mode Colors
                light: {
                    bg: '#FFFFFF',
                    'bg-secondary': '#F8F9FB',
                    'bg-tertiary': '#F0F1F5',
                    text: '#1F2937',
                    'text-secondary': '#6B7280',
                    'text-tertiary': '#9CA3AF',
                    border: '#E5E7EB',
                    'border-light': '#F3F4F6',
                },
                // Dark Mode Colors
                dark: {
                    bg: '#0F1419',
                    'bg-secondary': '#1A1F2E',
                    'bg-tertiary': '#252D3D',
                    text: '#F9FAFB',
                    'text-secondary': '#D1D5DB',
                    'text-tertiary': '#9CA3AF',
                    border: '#374151',
                    'border-light': '#4B5563',
                },
                // Purple Accent
                accent: {
                    50: '#FAF5FF',
                    100: '#F3E8FF',
                    200: '#E9D5FF',
                    300: '#D8B4FE',
                    400: '#C084FC',
                    500: '#A855F7',
                    600: '#9333EA',
                    700: '#7E22CE',
                    800: '#6B21A8',
                    900: '#581C87',
                },
            },
            backgroundColor: {
                primary: 'var(--bg-primary)',
                secondary: 'var(--bg-secondary)',
                tertiary: 'var(--bg-tertiary)',
            },
            textColor: {
                primary: 'var(--text-primary)',
                secondary: 'var(--text-secondary)',
                tertiary: 'var(--text-tertiary)',
            },
            borderColor: {
                primary: 'var(--border-primary)',
                light: 'var(--border-light)',
            },
            boxShadow: {
                'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
                'glow-purple-dark': '0 0 30px rgba(168, 85, 247, 0.2)',
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'card-dark': '0 4px 6px 0 rgba(0, 0, 0, 0.3)',
                'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'elevated-dark': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'theme-switch': 'themeSwitch 0.5s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
                themeSwitch: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            borderRadius: {
                'lg': '12px',
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
            },
        },
    },

    plugins: [forms],
};
