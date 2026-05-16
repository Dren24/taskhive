import { useTheme } from '../Context/ThemeContext';

export function Card({ children, className = '', hoverable = true }) {
    const { isDark } = useTheme();

    return (
        <div
            className={`${isDark
                    ? 'bg-dark-bg-secondary border-dark-border shadow-card-dark'
                    : 'bg-white border-light-border shadow-card'
                } border rounded-xl transition-all duration-300 ${hoverable ? (isDark ? 'hover:shadow-elevated-dark hover:border-accent-500/30' : 'hover:shadow-elevated') : ''
                } ${className}`}
        >
            {children}
        </div>
    );
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    ...props
}) {
    const { isDark } = useTheme();

    const baseStyles = 'font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const variantStyles = {
        primary: isDark
            ? 'bg-gradient-to-r from-accent-600 to-accent-700 text-white hover:shadow-glow-purple-dark'
            : 'bg-gradient-to-r from-accent-600 to-accent-700 text-white hover:shadow-elevated',
        secondary: isDark
            ? 'bg-dark-bg-tertiary text-dark-text border border-dark-border hover:bg-dark-border'
            : 'bg-light-bg-tertiary text-light-text border border-light-border hover:bg-light-bg-secondary',
        outline: 'border-2 border-accent-500 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10',
        ghost: isDark
            ? 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-tertiary'
            : 'text-light-text-secondary hover:text-light-text hover:bg-light-bg-secondary',
        danger: 'bg-red-600 text-white hover:bg-red-700 dark:hover:shadow-lg',
    };

    return (
        <button
            disabled={disabled}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

export function Badge({ children, variant = 'primary' }) {
    const { isDark } = useTheme();

    const variants = {
        primary: isDark
            ? 'bg-accent-500/20 text-accent-300'
            : 'bg-accent-100 text-accent-700',
        success: isDark
            ? 'bg-green-500/20 text-green-300'
            : 'bg-green-100 text-green-700',
        warning: isDark
            ? 'bg-yellow-500/20 text-yellow-300'
            : 'bg-yellow-100 text-yellow-700',
        danger: isDark
            ? 'bg-red-500/20 text-red-300'
            : 'bg-red-100 text-red-700',
    };

    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${variants[variant]}`}>
            {children}
        </span>
    );
}

export function Input({ label, error, ...props }) {
    const { isDark } = useTheme();

    return (
        <div className="w-full">
            {label && (
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${isDark
                        ? 'bg-dark-bg-secondary border-dark-border text-dark-text placeholder-dark-text-tertiary focus:ring-accent-500'
                        : 'bg-light-bg-secondary border-light-border text-light-text placeholder-light-text-tertiary focus:ring-accent-500'
                    } focus:outline-none focus:ring-2 focus:border-accent-500 ${error ? (isDark ? 'border-red-500 focus:ring-red-500' : 'border-red-500 focus:ring-red-500') : ''
                    }`}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}

export function Skeleton({ className = '' }) {
    const { isDark } = useTheme();

    return (
        <div
            className={`animate-pulse rounded-lg ${isDark ? 'bg-dark-bg-tertiary' : 'bg-light-bg-secondary'
                } ${className}`}
        />
    );
}
