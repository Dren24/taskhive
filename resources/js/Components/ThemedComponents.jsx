import { useTheme } from '../Context/ThemeContext';
import { X } from 'lucide-react';

/**
 * Themed Modal Components - Used throughout the application
 */

export function ThemedConfirmModal({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
    loading = false
}) {
    const { isDark } = useTheme();

    const confirmButtonClass = {
        primary: 'bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    }[confirmVariant] || 'bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/60' : 'bg-black/40'
            } backdrop-blur-sm`}>
            <div className={`relative rounded-2xl shadow-2xl border w-full max-w-sm p-6 ${isDark
                    ? 'bg-dark-bg-primary border-dark-border'
                    : 'bg-white border-light-border'
                } animate-fadeInScale`}>
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-dark-text' : 'text-light-text'
                    }`}>
                    {title}
                </h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
                    }`}>
                    {message}
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium rounded-xl border transition ${isDark
                                ? 'border-dark-border text-dark-text hover:bg-dark-bg-tertiary'
                                : 'border-light-border text-light-text hover:bg-light-bg-tertiary'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-5 py-2 text-sm font-semibold rounded-xl transition ${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                    >
                        {loading ? 'Loading...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ThemedModal({
    title,
    subtitle,
    onClose,
    children,
    footer,
    maxWidth = 'max-w-lg',
    showHeader = true
}) {
    const { isDark } = useTheme();

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/60' : 'bg-black/40'
            } backdrop-blur-sm`}>
            <div className={`relative rounded-2xl shadow-2xl border overflow-hidden w-full ${maxWidth} ${isDark
                    ? 'bg-dark-bg-primary border-dark-border'
                    : 'bg-white border-light-border'
                } animate-fadeInScale`}>
                {/* Header */}
                {showHeader && (
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark
                            ? 'bg-dark-bg-secondary border-dark-border'
                            : 'bg-light-bg-secondary border-light-border'
                        }`}>
                        <div className="flex-1">
                            <h2 className={`text-base font-bold ${isDark ? 'text-dark-text' : 'text-light-text'
                                }`}>
                                {title}
                            </h2>
                            {subtitle && (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
                                    }`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition ${isDark
                                    ? 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-tertiary'
                                    : 'text-light-text-secondary hover:text-light-text hover:bg-light-bg-tertiary'
                                }`}
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={`p-6 max-h-[70vh] overflow-y-auto scrollbar-thin ${isDark ? 'text-dark-text' : 'text-light-text'
                    }`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark
                            ? 'bg-dark-bg-secondary border-dark-border'
                            : 'bg-light-bg-secondary border-light-border'
                        }`}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ThemedFormGroup({
    label,
    error,
    children,
    helperText
}) {
    const { isDark } = useTheme();

    return (
        <div className="w-full">
            {label && (
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-dark-text' : 'text-light-text'
                    }`}>
                    {label}
                </label>
            )}
            {children}
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
            {helperText && (
                <p className={`mt-1 text-xs ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'
                    }`}>
                    {helperText}
                </p>
            )}
        </div>
    );
}

export function ThemedSelect({
    value,
    onChange,
    options,
    placeholder,
    error,
    disabled = false
}) {
    const { isDark } = useTheme();

    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 font-medium ${isDark
                    ? 'bg-dark-bg-secondary border-dark-border text-dark-text hover:border-dark-text-tertiary focus:border-accent-500'
                    : 'bg-light-bg-secondary border-light-border text-light-text hover:border-light-text-tertiary focus:border-accent-500'
                } focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export function ThemedInput({
    value,
    onChange,
    type = 'text',
    placeholder,
    error,
    disabled = false,
    ...props
}) {
    const { isDark } = useTheme();

    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${isDark
                    ? 'bg-dark-bg-secondary border-dark-border text-dark-text placeholder-dark-text-tertiary hover:border-dark-text-tertiary focus:border-accent-500'
                    : 'bg-light-bg-secondary border-light-border text-light-text placeholder-light-text-tertiary hover:border-light-text-tertiary focus:border-accent-500'
                } focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
            {...props}
        />
    );
}

export function ThemedTextarea({
    value,
    onChange,
    placeholder,
    rows = 3,
    error,
    disabled = false,
    ...props
}) {
    const { isDark } = useTheme();

    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 resize-none ${isDark
                    ? 'bg-dark-bg-secondary border-dark-border text-dark-text placeholder-dark-text-tertiary hover:border-dark-text-tertiary focus:border-accent-500'
                    : 'bg-light-bg-secondary border-light-border text-light-text placeholder-light-text-tertiary hover:border-light-text-tertiary focus:border-accent-500'
                } focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
            {...props}
        />
    );
}

export function ThemedButton({
    onClick,
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    ...props
}) {
    const { isDark } = useTheme();

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const variants = {
        primary: 'bg-gradient-to-r from-accent-600 to-accent-700 text-white hover:from-accent-700 hover:to-accent-800 disabled:from-accent-400 disabled:to-accent-500',
        secondary: isDark
            ? 'bg-dark-bg-tertiary text-dark-text border border-dark-border hover:bg-dark-border disabled:opacity-50'
            : 'bg-light-bg-tertiary text-light-text border border-light-border hover:bg-light-bg-secondary disabled:opacity-50',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
        outline: 'border-2 border-accent-500 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 disabled:opacity-50',
        ghost: isDark
            ? 'text-dark-text hover:bg-dark-bg-tertiary disabled:opacity-50'
            : 'text-light-text hover:bg-light-bg-tertiary disabled:opacity-50',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
}
