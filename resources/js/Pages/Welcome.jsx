import { Head, Link, usePage } from '@inertiajs/react';

/* ─── icon components ─── */
const IconClipboard = () => (
    <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);
const IconBolt = () => (
    <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
const IconTeam = () => (
    <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IconChart = () => (
    <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const FEATURES = [
    {
        icon: <IconClipboard />,
        bg: '#f5f3ff',
        title: 'Smart Task Tracking',
        desc: 'Move work from To Do → In Progress → Done with a visual pipeline built for real teams and real deadlines.',
    },
    {
        icon: <IconBolt />,
        bg: '#fff1f2',
        title: 'Priority Management',
        desc: 'Flag every task High, Medium, or Low to surface the work that actually matters before things slip.',
    },
    {
        icon: <IconTeam />,
        bg: '#f0fdf4',
        title: 'Team Collaboration',
        desc: 'Assign tasks across Admin, Manager, and User roles with structured project folders and shared file access.',
    },
    {
        icon: <IconChart />,
        bg: '#eff6ff',
        title: 'Real-time Insights',
        desc: 'Live dashboards, activity feeds, and full audit logs keep everyone aligned and nothing falls through the cracks.',
    },
];

const STATS = [
    { value: '10k+', label: 'Tasks completed' },
    { value: '500+', label: 'Teams onboarded' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9★', label: 'User rating' },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <>
            <Head title="TaskHive — Manage Tasks Like a Pro" />

            <div className="bg-white min-h-screen font-sans antialiased text-gray-900 overflow-x-hidden">

                {/* ══════════════════════════════════════
                    STICKY NAV
                ══════════════════════════════════════ */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 shrink-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                T
                            </div>
                            <span className="font-bold text-gray-900 text-lg tracking-tight">TaskHive</span>
                        </Link>

                        {/* Center nav */}
                        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
                            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-purple-700 transition-colors">Features</a>
                            <a href="#pricing"  className="text-sm font-medium text-gray-500 hover:text-purple-700 transition-colors">Pricing</a>
                            <a href="#about"    className="text-sm font-medium text-gray-500 hover:text-purple-700 transition-colors">About</a>
                        </nav>

                        {/* Right CTA */}
                        <div className="flex items-center gap-3 shrink-0">
                            {user ? (
                                <Link href={route('dashboard')}
                                    className="text-sm font-semibold px-5 py-2 rounded-lg text-white shadow hover:opacity-90 transition-all"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}
                                        className="hidden sm:block text-sm font-medium text-gray-600 hover:text-purple-700 transition-colors">
                                        Log in
                                    </Link>
                                    <Link href={route('register')}
                                        className="text-sm font-semibold px-5 py-2 rounded-lg text-white shadow hover:opacity-90 transition-all"
                                        style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                        Get Started Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ══════════════════════════════════════
                    HERO
                ══════════════════════════════════════ */}
                <section className="relative overflow-hidden">
                    {/* subtle grid bg */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 60% 20%, rgba(139,92,246,0.07) 0%, transparent 55%), radial-gradient(circle at 10% 80%, rgba(168,85,247,0.05) 0%, transparent 45%)',
                        }} />

                    <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32 flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

                        {/* Left: copy */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-7 tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse" />
                                Simple. Fast. Beautiful.
                            </div>

                            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-3">
                                Manage tasks
                            </h1>
                            <h2 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight mb-7"
                                style={{
                                    backgroundImage: 'linear-gradient(135deg,#7c3aed,#9333ea,#c026d3)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>
                                like a pro.
                            </h2>

                            <p className="text-gray-500 text-lg xl:text-xl leading-relaxed max-w-lg lg:max-w-none mb-10">
                                TaskHive unifies your team, projects, and deadlines in one beautifully organized workspace — built for modern companies that move fast.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                {user ? (
                                    <Link href={route('dashboard')}
                                        className="px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-purple-200 hover:scale-105 transition-all duration-200 text-center"
                                        style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                        Go to Dashboard →
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('register')}
                                            className="px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-purple-200 hover:scale-105 transition-all duration-200 text-center"
                                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                            Get Started Free
                                        </Link>
                                        <Link href={route('login')}
                                            className="px-8 py-3.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-700 transition-all duration-200 text-center shadow-sm">
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* mini social proof */}
                            <p className="mt-6 text-xs text-gray-400">No credit card required · Free during beta · Cancel anytime</p>
                        </div>

                        {/* Right: mock dashboard card */}
                        <div className="flex-1 w-full max-w-lg lg:max-w-none">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                                {/* fake top bar */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100" style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                                    <span className="ml-3 text-white/80 text-xs font-medium">TaskHive Dashboard</span>
                                </div>
                                {/* fake content */}
                                <div className="p-5 space-y-3 bg-gray-50">
                                    {[
                                        { label: 'Redesign landing page', tag: 'High', color: 'bg-red-100 text-red-600', done: true },
                                        { label: 'API integration review', tag: 'Medium', color: 'bg-yellow-100 text-yellow-600', done: false },
                                        { label: 'Write unit tests', tag: 'Low', color: 'bg-green-100 text-green-600', done: false },
                                        { label: 'Deploy to production', tag: 'High', color: 'bg-red-100 text-red-600', done: false },
                                    ].map((t, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${t.done ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                                                {t.done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`flex-1 text-sm font-medium ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.label}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.tag}</span>
                                        </div>
                                    ))}
                                    <div className="pt-1 flex items-center gap-2 text-xs text-gray-400">
                                        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                                        3 tasks due today · 1 overdue
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════
                    STATS STRIP
                ══════════════════════════════════════ */}
                <div className="border-y border-gray-100 bg-gray-50/60">
                    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {STATS.map((s, i) => (
                            <div key={i}>
                                <p className="text-3xl font-extrabold text-gray-900 mb-1">{s.value}</p>
                                <p className="text-sm text-gray-500">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    FEATURES
                ══════════════════════════════════════ */}
                <section id="features" className="py-24">
                    <div className="max-w-7xl mx-auto px-6 lg:px-10">
                        <div className="text-center mb-16">
                            <p className="text-purple-600 text-sm font-semibold uppercase tracking-widest mb-3">What you get</p>
                            <h3 className="text-4xl font-extrabold text-gray-900 mb-4">Everything your team needs</h3>
                            <p className="text-gray-500 text-lg max-w-xl mx-auto">Powerful tools without the complexity — TaskHive keeps teams focused on what matters.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {FEATURES.map((f, i) => (
                                <div key={i}
                                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-7">
                                    <div className="w-13 h-13 rounded-xl flex items-center justify-center mb-5 w-12 h-12"
                                        style={{ background: f.bg }}>
                                        {f.icon}
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-base mb-2 group-hover:text-purple-700 transition-colors">{f.title}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════
                    PRICING
                ══════════════════════════════════════ */}
                <section id="pricing" className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-10">
                        <div className="text-center mb-14">
                            <p className="text-purple-600 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
                            <h3 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h3>
                            <p className="text-gray-500 text-lg">Free during beta. No credit card required.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* Free */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
                                <p className="text-sm font-semibold text-gray-500 mb-2">Starter</p>
                                <p className="text-4xl font-extrabold text-gray-900 mb-1">Free</p>
                                <p className="text-sm text-gray-400 mb-6">Forever free</p>
                                <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                                    {['Up to 3 projects', 'Unlimited tasks', 'Basic reporting', 'Email support'].map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link href={route('register')} className="block text-center py-3 rounded-xl border border-purple-300 text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-colors">
                                    Get started
                                </Link>
                            </div>

                            {/* Pro (highlighted) */}
                            <div className="rounded-2xl shadow-xl p-8 flex flex-col relative overflow-hidden text-white"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Popular</div>
                                <p className="text-sm font-semibold text-purple-200 mb-2">Pro</p>
                                <p className="text-4xl font-extrabold mb-1">$9<span className="text-lg font-medium text-purple-200">/mo</span></p>
                                <p className="text-sm text-purple-200 mb-6">Per user, billed monthly</p>
                                <ul className="space-y-3 text-sm flex-1 mb-8">
                                    {['Unlimited projects', 'Advanced analytics', 'File attachments', 'Priority support', 'Audit logs'].map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-purple-100">
                                            <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link href={route('register')} className="block text-center py-3 rounded-xl bg-white text-purple-700 font-bold text-sm hover:bg-purple-50 transition-colors shadow">
                                    Start free trial
                                </Link>
                            </div>

                            {/* Enterprise */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
                                <p className="text-sm font-semibold text-gray-500 mb-2">Enterprise</p>
                                <p className="text-4xl font-extrabold text-gray-900 mb-1">Custom</p>
                                <p className="text-sm text-gray-400 mb-6">Contact us for pricing</p>
                                <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                                    {['Everything in Pro', 'SSO / SAML', 'Custom roles', 'SLA guarantee', 'Dedicated support'].map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <a href="mailto:hello@taskhive.app" className="block text-center py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-purple-300 hover:text-purple-700 transition-colors">
                                    Contact sales
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════
                    CTA BANNER
                ══════════════════════════════════════ */}
                <section id="about" className="py-24">
                    <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
                        <div className="rounded-3xl p-16 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea,#c026d3)' }}>
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />
                            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 relative">
                                Ready to get organized?
                            </h3>
                            <p className="text-purple-200 text-base mb-8 max-w-md mx-auto relative">
                                Join hundreds of teams already using TaskHive to ship faster and stress less.
                            </p>
                            <Link href={route(user ? 'dashboard' : 'register')}
                                className="inline-block px-8 py-3.5 text-sm font-bold text-purple-700 bg-white rounded-xl shadow-lg hover:scale-105 transition-all duration-200 relative">
                                {user ? 'Go to Dashboard →' : 'Create Free Account →'}
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════
                    FOOTER
                ══════════════════════════════════════ */}
                <footer className="border-t border-gray-100 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-extrabold"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>T</div>
                            <span className="font-bold text-gray-800 text-base">TaskHive</span>
                        </div>
                        <nav className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                            <a href="#features" className="hover:text-purple-700 transition-colors">Features</a>
                            <a href="#pricing" className="hover:text-purple-700 transition-colors">Pricing</a>
                            <a href="mailto:hello@taskhive.app" className="hover:text-purple-700 transition-colors">Contact</a>
                        </nav>
                        <p className="text-sm text-gray-400">© {new Date().getFullYear()} TaskHive. All rights reserved.</p>
                    </div>
                </footer>

            </div>
        </>
    );
}
