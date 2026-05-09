import { useForm, Link, Head } from '@inertiajs/react';
import BrandLogo from '../../Components/BrandLogo';
import PasswordInput from '../../Components/PasswordInput';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Head title="Log In" />
            <div className="w-full max-w-sm">
                <BrandLogo className="mb-8" subtitle="Sign in to your account" />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {status && (
                        <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            {status}
                        </div>
                    )}
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                required autoFocus
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
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
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                    className="rounded"
                                />
                                Remember me
                            </label>
                            <Link href={route('password.request')} className="text-xs text-purple-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
                        >
                            {processing ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                    No account?{' '}
                    <Link href={route('register')} className="text-purple-600 font-medium hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
