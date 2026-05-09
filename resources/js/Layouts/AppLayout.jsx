import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import BrandLogo from '../Components/BrandLogo';

export default function AppLayout({ title, children }) {
    const { auth, notifications = [] } = usePage().props;
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
        router.patch(route('notifications.read', notif.id), {}, { preserveScroll: true });
        setBellOpen(false);
        router.visit(route('tasks.edit', notif.task.id));
    }

    function markAllRead() {
        router.post(route('notifications.read-all'), {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Nav */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo */}
                        <Link href={route('dashboard')} className="flex items-center gap-2">
                            <BrandLogo compact iconSize="w-7 h-7" labelSize="text-sm" />
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden sm:flex items-center gap-1">
                            <NavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</NavLink>
                            <NavLink href={route('tasks.index')} active={route().current('tasks.*')}>Tasks</NavLink>
                            <NavLink href={route('projects.index')} active={route().current('projects.*')}>Projects</NavLink>
                            {isAdmin && (
                                <NavLink href={route('admin.index')} active={route().current('admin.*')}>Admin</NavLink>
                            )}
                        </div>

                        {/* User area */}
                        <div className="hidden sm:flex items-center gap-3">
                            {/* Bell */}
                            <div className="relative" ref={bellRef}>
                                <button
                                    onClick={() => setBellOpen(v => !v)}
                                    className="relative p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
                                    aria-label="Notifications"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0a3 3 0 01-6 0" />
                                    </svg>
                                    {unread.length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                            {unread.length > 9 ? '9+' : unread.length}
                                        </span>
                                    )}
                                </button>

                                {bellOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                                            <span className="text-sm font-semibold text-gray-700">Notifications</span>
                                            {unread.length > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-purple-600 hover:underline">
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                            {notifications.length === 0 ? (
                                                <p className="text-sm text-gray-400 px-4 py-4 text-center">No notifications</p>
                                            ) : (
                                                notifications.map(n => (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => markRead(n)}
                                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!n.read ? 'bg-purple-50/40' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-2.5">
                                                            <span className="text-base mt-0.5">{n.type === 'reopen_request' ? '📩' : n.type === 'overdue' ? '🚨' : n.type === 'due_soon' ? '⏰' : '🔔'}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800 truncate">{n.task.title}</p>
                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    {n.type === 'reopen_request'
                                                                        ? 'Reopen request received'
                                                                        : n.type === 'overdue'
                                                                            ? `Overdue since ${n.task.due_date}`
                                                                            : n.type === 'due_soon'
                                                                                ? `Due ${n.task.due_date}`
                                                                                : 'Assigned to you'}
                                                                    {' · '}{n.created_at}
                                                                </p>
                                                            </div>
                                                            {!n.read && <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <span className="text-sm text-gray-500">{auth?.user?.name}</span>
                            <Link
                                href={route('profile.edit')}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition font-medium"
                            >
                                Profile
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition font-medium"
                            >
                                Log Out
                            </Link>
                        </div>

                        {/* Hamburger */}
                        <button className="sm:hidden p-2 rounded-md text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {menuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="sm:hidden px-4 pb-4 pt-2 space-y-1 border-t border-gray-100">
                        <MobileLink href={route('dashboard')}>Dashboard</MobileLink>
                        <MobileLink href={route('tasks.index')}>Tasks</MobileLink>
                        <MobileLink href={route('projects.index')}>Projects</MobileLink>
                        {isAdmin && <MobileLink href={route('admin.index')}>Admin</MobileLink>}
                        <MobileLink href={route('profile.edit')}>Profile</MobileLink>
                        {/* Mobile notifications */}
                        {notifications.length > 0 && (
                            <div className="pt-1 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 px-3 pb-1 uppercase tracking-wide">
                                    Notifications {unread.length > 0 && <span className="text-red-500">({unread.length})</span>}
                                </p>
                                {notifications.slice(0, 5).map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => { setMenuOpen(false); markRead(n); }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 ${!n.read ? 'font-medium text-gray-800' : 'text-gray-500'}`}
                                    >
                                        {n.type === 'reopen_request' ? '📩' : n.type === 'overdue' ? '🚨' : n.type === 'due_soon' ? '⏰' : '🔔'} {n.task.title}
                                    </button>
                                ))}
                                {unread.length > 0 && (
                                    <button onClick={() => { markAllRead(); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs text-purple-600 hover:underline">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        )}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                            Log Out
                        </Link>
                    </div>
                )}
            </nav>

            {/* Main content */}
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {title && (
                    <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
                )}
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${active
                ? 'text-purple-700 bg-purple-50'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
        >
            {children}
        </Link>
    );
}

function MobileLink({ href, children }) {
    return (
        <Link href={href} className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            {children}
        </Link>
    );
}

