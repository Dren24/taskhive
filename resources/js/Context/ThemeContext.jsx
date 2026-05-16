import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme-mode');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
            localStorage.setItem('theme-mode', 'dark');
            html.style.colorScheme = 'dark';
        } else {
            html.classList.remove('dark');
            localStorage.setItem('theme-mode', 'light');
            html.style.colorScheme = 'light';
        }

        // Set CSS variables for theme colors
        const root = document.documentElement;
        if (isDark) {
            root.style.setProperty('--bg-primary', '#0F1419');
            root.style.setProperty('--bg-secondary', '#1A1F2E');
            root.style.setProperty('--bg-tertiary', '#252D3D');
            root.style.setProperty('--text-primary', '#F9FAFB');
            root.style.setProperty('--text-secondary', '#D1D5DB');
            root.style.setProperty('--text-tertiary', '#9CA3AF');
            root.style.setProperty('--border-primary', '#374151');
            root.style.setProperty('--border-light', '#4B5563');
        } else {
            root.style.setProperty('--bg-primary', '#FFFFFF');
            root.style.setProperty('--bg-secondary', '#F8F9FB');
            root.style.setProperty('--bg-tertiary', '#F0F1F5');
            root.style.setProperty('--text-primary', '#1F2937');
            root.style.setProperty('--text-secondary', '#6B7280');
            root.style.setProperty('--text-tertiary', '#9CA3AF');
            root.style.setProperty('--border-primary', '#E5E7EB');
            root.style.setProperty('--border-light', '#F3F4F6');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
