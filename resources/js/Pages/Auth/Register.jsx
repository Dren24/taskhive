import { useForm, Link, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import BrandLogo from '../../Components/BrandLogo';
import PasswordInput from '../../Components/PasswordInput';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user',
        admin_invitation_code: '',
    });
    const [codeState, setCodeState] = useState({ status: 'idle', message: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    useEffect(() => {
        if (data.role !== 'user' || !data.admin_invitation_code.trim()) {
            setCodeState({ status: 'idle', message: '' });
            return;
        }

        const timeout = setTimeout(() => {
            setCodeState({ status: 'checking', message: 'Checking code...' });
            window.axios.post(route('register.verify-admin-code'), {
                admin_invitation_code: data.admin_invitation_code,
            })
                .then((response) => {
                    setCodeState({
                        status: 'valid',
                        message: response.data.message || 'Admin code verified.',
                    });
                })
                .catch((error) => {
                    setCodeState({
                        status: 'invalid',
                        message: error.response?.data?.message || 'Invalid or expired admin invitation code.',
                    });
                });
        }, 450);

        return () => clearTimeout(timeout);
    }, [data.role, data.admin_invitation_code]);

    const roleCards = [
        {
            value: 'admin',
            title: 'Admin',
            description: 'Create a workspace and invite staff with your private access code.',
        },
        {
            value: 'user',
            title: 'User',
            description: 'Join an admin workspace or create your account first and connect later.',
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <Head title="Register" />
            <div className="w-full max-w-xl">
                <BrandLogo className="mb-8" subtitle="Create your account" />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">Account Type</label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {roleCards.map((role) => {
                                    const active = data.role === role.value;
                                    return (
                                        <button
                                            type="button"
                                            key={role.value}
                                            onClick={() => setData('role', role.value)}
                                            className={`text-left rounded-2xl border p-4 transition-all ${active
                                                ? 'border-purple-500 bg-purple-50 shadow-sm ring-2 ring-purple-100'
                                                : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/50'
                                            }`}
                                            aria-pressed={active}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className={`text-sm font-bold ${active ? 'text-purple-700' : 'text-gray-900'}`}>{role.title}</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{role.description}</p>
                                                </div>
                                                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 text-transparent'}`}>
                                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.2a1 1 0 01-1.41 0l-3.25-3.23a1 1 0 111.41-1.42l2.545 2.53 6.545-6.5a1 1 0 011.41 0z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                required autoFocus
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
                            <PasswordInput
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm Password</label>
                            <PasswordInput
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                required
                            />
                        </div>
                        {data.role === 'user' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Admin Invitation Code <span className="font-normal text-gray-400">(optional)</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.admin_invitation_code}
                                        onChange={e => setData('admin_invitation_code', e.target.value.toUpperCase())}
                                        placeholder="ADM-XXXX-XXXX"
                                        className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 transition ${codeState.status === 'valid'
                                            ? 'border-purple-400 bg-purple-50 focus:ring-purple-300'
                                            : codeState.status === 'invalid' || errors.admin_invitation_code
                                                ? 'border-rose-300 bg-rose-50 focus:ring-rose-300'
                                                : 'border-gray-200 focus:ring-purple-400'
                                        }`}
                                    />
                                    {codeState.status === 'valid' && (
                                        <svg className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-600 animate-fadeInScale" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.2a1 1 0 01-1.41 0l-3.25-3.23a1 1 0 111.41-1.42l2.545 2.53 6.545-6.5a1 1 0 011.41 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                {codeState.message && (
                                    <p className={`mt-1.5 text-xs font-medium ${codeState.status === 'valid' ? 'text-purple-700' : codeState.status === 'invalid' ? 'text-rose-600' : 'text-gray-500'}`}>
                                        {codeState.message}
                                    </p>
                                )}
                                {errors.admin_invitation_code && <p className="text-red-500 text-xs mt-1">{errors.admin_invitation_code}</p>}
                            </div>
                        )}
                        <button type="submit" disabled={processing}
                            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            {processing ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <Link href={route('login')} className="text-purple-600 font-medium hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
