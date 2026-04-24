import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <>
            <Head title="TaskHive — Manage Tasks Beautifully" />

            <div className="bg-gray-50 min-h-screen font-sans antialiased">

                {/* Nav */}
                <nav className="max-w-md mx-auto px-5 pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>T</div>
                        <span className="font-bold text-gray-900 text-base">TaskHive</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {user ? (
                            <Link href={route('dashboard')}
                                className="text-sm font-semibold px-4 py-1.5 rounded-xl text-white shadow"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')}
                                    className="text-sm font-medium text-gray-500 px-4 py-1.5 rounded-xl hover:bg-white hover:shadow-sm transition">
                                    Log in
                                </Link>
                                <Link href={route('register')}
                                    className="text-sm font-semibold px-4 py-1.5 rounded-xl text-white shadow"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero */}
                <div className="max-w-md mx-auto px-5 pt-14 pb-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
                        Simple. Fast. Beautiful.
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                        Manage tasks<br />
                        <span style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            like a pro
                        </span>
                    </h1>

                    <p className="text-gray-500 text-base leading-relaxed mb-8">
                        TaskHive keeps your work organized with priorities, statuses, and a clean mobile-first design.
                    </p>

                    <div className="flex flex-col gap-3">
                        {user ? (
                            <Link href={route('dashboard')}
                                className="w-full py-3 text-sm font-semibold text-white rounded-2xl shadow-md text-center"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('register')}
                                    className="w-full py-3 text-sm font-semibold text-white rounded-2xl shadow-md text-center"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                    Get started for free
                                </Link>
                                <Link href={route('login')}
                                    className="w-full py-3 text-sm font-medium text-gray-600 bg-white rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 transition text-center">
                                    I already have an account
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Feature tiles */}
                <div className="max-w-md mx-auto px-5 pb-16 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'linear-gradient(135deg,#ede9fe,#f3e8ff)' }}>
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">Task tracking</p>
                        <p className="text-xs text-gray-400 leading-relaxed">Move tasks from To Do → In Progress → Done</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' }}>
                            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">Priorities</p>
                        <p className="text-xs text-gray-400 leading-relaxed">Label tasks High, Medium, or Low priority</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)' }}>
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">Due dates</p>
                        <p className="text-xs text-gray-400 leading-relaxed">Set deadlines and never miss a task</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">Private</p>
                        <p className="text-xs text-gray-400 leading-relaxed">Your tasks are only visible to you</p>
                    </div>
                </div>

            </div>
        </>
    );
}
