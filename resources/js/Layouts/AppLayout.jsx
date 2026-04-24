import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AppLayout({ title, children }) {
    const { auth } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const isAdmin = auth?.user?.role === 'admin';

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Nav */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo */}
                        <Link href={route('dashboard')} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="font-bold text-gray-900 text-sm tracking-tight">TaskHive</span>
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

                        {/* User dropdown */}
                        <div className="hidden sm:flex items-center gap-3">
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
