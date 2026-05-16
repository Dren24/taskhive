import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Bell, Menu, X, LogOut } from 'lucide-react';
import BrandLogo from '../Components/BrandLogo';
import ThemeToggle from '../Components/ThemeToggle';
import { useTheme } from '../Context/ThemeContext';

export default function AppLayout({ title, children }) {
    const { auth, notifications = [] } = usePage().props;
    const { isDark } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef(null);
    const isAdmin = auth?.user?.role === 'admin';
    const unread = notifications.filter(n => !n.read);

    // Close bell dropdown when clicking outside
    useEffect(() => {
        function handleClick(e) {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setBellOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function markRead(notif) {
        const routeName = notif.kind === 'project' ? 'project-notifications.read' : 'notifications.read';
        setBellOpen(false);
        router.patch(route(routeName, notif.id), {}, {
            preserveScroll: false,
            onSuccess: () => router.visit(notif.url),
            onError: () => router.visit(notif.url),
        });
    }

    function markAllRead() {
        router.post(route('notifications.read-all'), {}, { preserveScroll: true });
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
                ? 'bg-dark-bg text-dark-text'
                : 'bg-light-bg text-light-text'
            }`}>
            {/* Premium Top Navigation */}
            <nav className={`sticky top-0 z-30 backdrop-blur-md ${isDark
                    ? 'bg-dark-bg-secondary/80 border-dark-border'
                    : 'bg-white/80 border-light-border'
                } border-b transition-all duration-300`}>
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link
                            href={route('dashboard')}
                            className={`flex items-center gap-3 font-bold text-lg transition-opacity hover:opacity-80 ${isDark ? 'text-white' : 'text-accent-700'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg ${isDark
                                    ? 'bg-gradient-to-br from-accent-500 to-accent-600'
                                    : 'bg-gradient-to-br from-accent-600 to-accent-700'
                                } flex items-center justify-center`}>
                                <span className="text-white text-sm font-bold">T</span>
                            </div>
                            <span className="hidden sm:inline">TaskHive</span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden sm:flex items-center gap-1">
                            <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                Dashboard
                            </NavLink>
                            <NavLink href={route('tasks.index')} active={route().current('tasks.*')}>
                                Tasks
                            </NavLink>
                            <NavLink href={route('projects.index')} active={route().current('projects.*')}>
                                Projects
                            </NavLink>
                            {isAdmin && (
                                <NavLink href={route('admin.index')} active={route().current('admin.*')}>
                                    Admin
                                </NavLink>
                            )}
                        </div>

                        {/* Right Side Controls */}
                        <div className="hidden sm:flex items-center gap-3">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Notifications Bell */}
                            <div className="relative" ref={bellRef}>
                                <button
                                    onClick={() => setBellOpen(v => !v)}
                                    className={`relative p-2.5 rounded-lg transition-all duration-200 ${isDark
                                            ? 'bg-dark-bg-tertiary hover:bg-dark-border text-dark-text-secondary hover:text-dark-text'
                                            : 'bg-light-bg-secondary hover:bg-light-bg-tertiary text-light-text-secondary hover:text-light-text'
                                        } ${bellOpen ? (isDark ? 'bg-dark-border' : 'bg-light-bg-tertiary') : ''}`}
                                    aria-label="Notifications"
                                >
                                    <Bell size={20} />
                                    {unread.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[11px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                                            {unread.length > 9 ? '9+' : unread.length}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {bellOpen && (
                                    <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-elevated-dark border transition-all duration-300 animate-slideDown overflow-hidden ${isDark
                                            ? 'bg-dark-bg-secondary border-dark-border'
                                            : 'bg-white border-light-border'
                                        }`}>
                                        {/* Header */}
                                        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-dark-border' : 'border-light-border'
                                            }`}>
                                            <span className={`text-sm font-semibold ${isDark ? 'text-dark-text' : 'text-light-text'
                                                }`}>
                                                Notifications
                                            </span>
                                            {unread.length > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    className="text-xs text-accent-600 hover:text-accent-700 dark:text-accent-400 hover:underline font-medium"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        {/* Notifications List */}
                                        <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-light-border dark:divide-dark-border">
                                            {notifications.length === 0 ? (
                                                <p className={`text-sm px-4 py-8 text-center ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
                                                    }`}>
                                                    No notifications yet
                                                </p>
                                            ) : (
                                                notifications.map(n => (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => markRead(n)}
                                                        className={`w-full text-left px-4 py-3 transition-colors duration-200 ${!n.read
                                                                ? isDark
                                                                    ? 'bg-accent-500/15'
                                                                    : 'bg-accent-50'
                                                                : isDark
                                                                    ? 'hover:bg-dark-bg-tertiary'
                                                                    : 'hover:bg-light-bg-secondary'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-lg flex-shrink-0">
                                                                {n.type === 'reopen_request' ? '📩'
                                                                    : n.type === 'overdue' ? '🚨'
                                                                        : n.type === 'due_soon' ? '⏰'
                                                                            : n.type === 'file_upload' ? '📎'
                                                                                : n.type === 'submission' ? '📥'
                                                                                    : n.type === 'project_added' ? '📁'
                                                                                        : n.type === 'project_updated' ? '🛠️'
                                                                                            : n.type === 'assigned' ? '🎯'
                                                                                                : '🔔'}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-dark-text' : 'text-light-text'
                                                                    }`}>
                                                                    {n.title}
                                                                </p>
                                                                <p className={`text-xs mt-1 ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'
                                                                    }`}>
                                                                    {n.message} · {n.created_at}
                                                                </p>
                                                            </div>
                                                            {!n.read && (
                                                                <span className="w-2 h-2 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className={`flex items-center gap-3 pl-3 ${isDark ? 'border-l border-dark-border' : 'border-l border-light-border'
                                }`}>
                                <span className={`text-sm font-medium hidden sm:inline ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
                                    }`}>
                                    {auth?.user?.name}
                                </span>
                                <Link
                                    href={route('profile.edit')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark
                                            ? 'bg-dark-bg-tertiary hover:bg-dark-border text-dark-text-secondary hover:text-dark-text'
                                            : 'bg-light-bg-secondary hover:bg-light-bg-tertiary text-light-text-secondary hover:text-light-text'
                                        }`}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className={`p-2.5 rounded-lg transition-all duration-200 ${isDark
                                            ? 'bg-dark-bg-tertiary hover:bg-red-500/20 text-dark-text-secondary hover:text-red-400'
                                            : 'bg-light-bg-secondary hover:bg-red-50 text-light-text-secondary hover:text-red-600'
                                        }`}
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </Link>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className={`sm:hidden p-2 rounded-lg transition-colors ${isDark
                                    ? 'bg-dark-bg-tertiary hover:bg-dark-border text-dark-text'
                                    : 'bg-light-bg-secondary hover:bg-light-bg-tertiary text-light-text'
                                }`}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className={`sm:hidden px-4 pb-4 pt-2 space-y-2 border-t transition-colors duration-300 ${isDark
                            ? 'border-dark-border bg-dark-bg-secondary/50'
                            : 'border-light-border bg-light-bg-secondary/50'
                        }`}>
                        <MobileLink href={route('dashboard')}>Dashboard</MobileLink>
                        <MobileLink href={route('tasks.index')}>Tasks</MobileLink>
                        <MobileLink href={route('projects.index')}>Projects</MobileLink>
                        {isAdmin && <MobileLink href={route('admin.index')}>Admin</MobileLink>}

                        {notifications.length > 0 && (
                            <div className={`pt-2 mt-2 border-t space-y-2 ${isDark ? 'border-dark-border' : 'border-light-border'
                                }`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide px-3 ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'
                                    }`}>
                                    Notifications {unread.length > 0 && <span className="text-red-500">({unread.length})</span>}
                                </p>
                                {notifications.slice(0, 5).map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => { setMenuOpen(false); markRead(n); }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!n.read
                                                ? isDark
                                                    ? 'font-medium text-dark-text bg-accent-500/15'
                                                    : 'font-medium text-light-text bg-accent-50'
                                                : isDark
                                                    ? 'text-dark-text-secondary hover:bg-dark-bg-tertiary'
                                                    : 'text-light-text-secondary hover:bg-light-bg-secondary'
                                            }`}
                                    >
                                        {n.type === 'reopen_request' ? '📩'
                                            : n.type === 'overdue' ? '🚨'
                                                : n.type === 'due_soon' ? '⏰'
                                                    : n.type === 'file_upload' ? '📎'
                                                        : n.type === 'submission' ? '📥'
                                                            : n.type === 'project_added' ? '📁'
                                                                : n.type === 'project_updated' ? '🛠️'
                                                                    : n.type === 'assigned' ? '🎯'
                                                                        : '🔔'} {n.title}
                                    </button>
                                ))}
                                {unread.length > 0 && (
                                    <button
                                        onClick={() => { markAllRead(); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-accent-600 dark:text-accent-400 hover:underline font-medium"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        )}

                        <div className={`pt-2 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                            <MobileLink href={route('profile.edit')}>Profile</MobileLink>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${isDark
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-red-600 hover:bg-red-50'
                                    }`}
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content Area */}
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {title && (
                    <div className="mb-8">
                        <h1 className={`text-3xl sm:text-4xl font-bold transition-colors ${isDark
                                ? 'text-white'
                                : 'text-dark'
                            }`}>
                            {title}
                        </h1>
                        <div className={`mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-accent-500 to-accent-600`} />
                    </div>
                )}
                <div className="animate-fadeInScale">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, active, children }) {
    const { isDark } = useTheme();

    return (
        <Link
            href={href}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? isDark
                        ? 'bg-accent-500/25 text-accent-300'
                        : 'bg-accent-100 text-accent-700'
                    : isDark
                        ? 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-tertiary'
                        : 'text-light-text-secondary hover:text-light-text hover:bg-light-bg-secondary'
                }`}
        >
            {children}
        </Link>
    );
}

function MobileLink({ href, children }) {
    const { isDark } = useTheme();

    return (
        <Link
            href={href}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark
                    ? 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-tertiary'
                    : 'text-light-text-secondary hover:text-light-text hover:bg-light-bg-secondary'
                }`}
        >
            {children}
        </Link>
    );
}
