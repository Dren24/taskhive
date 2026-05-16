import { useTheme } from '../Context/ThemeContext';

/**
 * Comprehensive theming utilities for consistent styling across the application
 */

// Color scheme mappings
export const themeColors = {
    light: {
        bg: { primary: '#FFFFFF', secondary: '#F8F9FB', tertiary: '#F0F1F5' },
        text: { primary: '#1F2937', secondary: '#6B7280', tertiary: '#9CA3AF' },
        border: { primary: '#E5E7EB', light: '#F3F4F6' },
        status: { success: '#22C55E', warning: '#EAB308', error: '#EF4444', info: '#3B82F6' },
    },
    dark: {
        bg: { primary: '#0F1419', secondary: '#1A1F2E', tertiary: '#252D3D' },
        text: { primary: '#F9FAFB', secondary: '#D1D5DB', tertiary: '#9CA3AF' },
        border: { primary: '#374151', light: '#4B5563' },
        status: { success: '#22C55E', warning: '#EAB308', error: '#EF4444', info: '#3B82F6' },
    },
};

// Priority badge colors with dark mode support
export const priorityBadgeClass = (priority, isDark) => {
    const map = {
        high: isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-100 text-rose-700 border border-rose-200',
        medium: isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200',
        low: isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    };
    return `inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${map[priority] || map.low}`;
};

// Status badge colors with dark mode support
export const statusBadgeClass = (status, isOverdue, isDark) => {
    if (isOverdue) {
        return isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200';
    }
    const map = {
        done: isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        in_progress: isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200',
        todo: isDark ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' : 'bg-gray-100 text-gray-700 border border-gray-200',
    };
    return `inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${map[status] || map.todo}`;
};

// Card styles
export const cardClass = (isDark, hoverable = true) => {
    const base = isDark
        ? 'bg-dark-bg-secondary border border-dark-border rounded-xl shadow-card-dark transition-all duration-300'
        : 'bg-white border border-light-border rounded-xl shadow-card transition-all duration-300';
    const hover = hoverable
        ? isDark
            ? 'hover:shadow-elevated-dark hover:border-accent-500/30'
            : 'hover:shadow-elevated'
        : '';
    return `${base} ${hover}`;
};

// Button styles
export const buttonClass = (variant = 'primary', isDark = false, size = 'md') => {
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3 text-base',
    };

    const variants = {
        primary: 'bg-gradient-to-r from-accent-600 to-accent-700 text-white hover:shadow-lg hover:from-accent-700 hover:to-accent-800 active:scale-95',
        secondary: isDark
            ? 'bg-dark-bg-tertiary text-dark-text border border-dark-border hover:bg-dark-border'
            : 'bg-light-bg-tertiary text-light-text border border-light-border hover:bg-light-bg-secondary',
        outline: 'border-2 border-accent-500 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 active:scale-95',
        ghost: isDark
            ? 'text-dark-text hover:bg-dark-bg-tertiary'
            : 'text-light-text hover:bg-light-bg-tertiary',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return `font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]}`;
};

// Input field styles
export const inputClass = (isDark = false) => {
    return isDark
        ? 'w-full px-4 py-2.5 bg-dark-bg-secondary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-dark-text-tertiary transition-all duration-200'
        : 'w-full px-4 py-2.5 bg-light-bg-secondary border border-light-border rounded-lg text-light-text placeholder-light-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 hover:border-light-text-tertiary transition-all duration-200';
};

// Table header styles
export const tableHeaderClass = (isDark) => {
    return isDark
        ? 'bg-dark-bg-secondary text-dark-text font-semibold border-b border-dark-border'
        : 'bg-light-bg-secondary text-light-text font-semibold border-b border-light-border';
};

// Table row styles
export const tableRowClass = (isDark) => {
    return isDark
        ? 'border-b border-dark-border hover:bg-dark-bg-tertiary/50 transition-colors duration-200'
        : 'border-b border-light-border hover:bg-light-bg-tertiary transition-colors duration-200';
};

// Modal overlay styles
export const modalOverlayClass = (isDark) => {
    return `fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/60' : 'bg-black/40'} backdrop-blur-sm`;
};

// Modal content styles
export const modalContentClass = (isDark) => {
    return isDark
        ? 'rounded-2xl shadow-2xl border border-dark-border relative w-full max-w-2xl bg-dark-bg-primary'
        : 'rounded-2xl shadow-2xl border border-light-border relative w-full max-w-2xl bg-white';
};

// Form label styles
export const labelClass = (isDark) => {
    return isDark
        ? 'block text-sm font-medium mb-2 text-dark-text'
        : 'block text-sm font-medium mb-2 text-light-text';
};

// Error text styles
export const errorClass = () => {
    return 'mt-1.5 text-sm text-red-600 dark:text-red-400';
};

// Helper text styles
export const helperClass = (isDark) => {
    return isDark
        ? 'mt-1 text-xs text-dark-text-tertiary'
        : 'mt-1 text-xs text-light-text-tertiary';
};

// Avatar background colors
export const avatarBgColors = [
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-emerald-500 to-emerald-600',
    'bg-gradient-to-br from-amber-500 to-amber-600',
    'bg-gradient-to-br from-rose-500 to-rose-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
];

export const getAvatarBg = (name) => {
    return avatarBgColors[(name?.charCodeAt(0) || 0) % avatarBgColors.length];
};

// Notification styles with dark mode
export const notificationClass = (type, isDark) => {
    const base = 'rounded-lg p-4 flex items-start gap-3 border-l-4';
    const variants = {
        success: isDark
            ? `${base} border-green-500 bg-green-500/10 text-green-300`
            : `${base} border-green-500 bg-green-50 text-green-800`,
        warning: isDark
            ? `${base} border-yellow-500 bg-yellow-500/10 text-yellow-300`
            : `${base} border-yellow-500 bg-yellow-50 text-yellow-800`,
        error: isDark
            ? `${base} border-red-500 bg-red-500/10 text-red-300`
            : `${base} border-red-500 bg-red-50 text-red-800`,
        info: isDark
            ? `${base} border-accent-500 bg-accent-500/10 text-accent-300`
            : `${base} border-accent-500 bg-accent-50 text-accent-800`,
    };
    return variants[type] || variants.info;
};

// Custom hook for theme-aware classes
export function useThemedClasses() {
    const { isDark } = useTheme();

    return {
        isDark,
        card: cardClass(isDark),
        button: buttonClass('primary', isDark),
        input: inputClass(isDark),
        tableHeader: tableHeaderClass(isDark),
        tableRow: tableRowClass(isDark),
        modalOverlay: modalOverlayClass(isDark),
        modalContent: modalContentClass(isDark),
        label: labelClass(isDark),
        error: errorClass(),
        helper: helperClass(isDark),
        notification: (type) => notificationClass(type, isDark),
        priorityBadge: (priority) => priorityBadgeClass(priority, isDark),
        statusBadge: (status, isOverdue) => statusBadgeClass(status, isOverdue, isDark),
    };
}

// Utility to get contrast color based on theme
export const getContrastTextColor = (isDark) => {
    return isDark ? 'text-dark-text' : 'text-light-text';
};

// Utility to get background for sections
export const getSectionBg = (isDark) => {
    return isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary';
};

// Utility to get border color
export const getBorderColor = (isDark) => {
    return isDark ? 'border-dark-border' : 'border-light-border';
};
