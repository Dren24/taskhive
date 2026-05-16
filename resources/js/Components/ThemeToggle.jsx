import { useTheme } from '../Context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg
                     bg-light-bg-tertiary dark:bg-dark-bg-tertiary
                     border border-light-border dark:border-dark-border
                     hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                     transition-all duration-300 ease-out
                     hover:shadow-md dark:hover:shadow-glow-purple-dark
                     group"
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div className="relative w-6 h-6">
                {/* Sun Icon - Light Mode */}
                <Sun
                    size={20}
                    className={`absolute inset-0 text-yellow-500 transition-all duration-300
                        ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
                />

                {/* Moon Icon - Dark Mode */}
                <Moon
                    size={20}
                    className={`absolute inset-0 text-purple-300 transition-all duration-300
                        ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                />
            </div>

            {/* Animated background glow effect */}
            <div
                className={`absolute inset-0 rounded-lg transition-all duration-300
                    ${isDark
                        ? 'bg-gradient-to-br from-purple-500/20 to-transparent'
                        : 'bg-gradient-to-br from-yellow-300/10 to-transparent'
                    }`}
                style={{ pointerEvents: 'none' }}
            />
        </button>
    );
}
