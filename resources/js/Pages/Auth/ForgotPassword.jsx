import { useForm, Link, Head } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => { e.preventDefault(); post(route('password.email')); };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Head title="Forgot Password" />
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1">Forgot Password</h2>
                    <p className="text-sm text-gray-500 mb-5">Enter your email and we'll send a reset link.</p>
                    {status && <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{status}</div>}
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                required autoFocus
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <button type="submit" disabled={processing}
                            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            {processing ? 'Sending…' : 'Send Reset Link'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                    <Link href={route('login')} className="text-purple-600 font-medium hover:underline">Back to login</Link>
                </p>
            </div>
        </div>
    );
}
