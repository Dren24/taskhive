import { useForm, Head, Link } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => { e.preventDefault(); post(route('verification.send')); };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Head title="Verify Email" />
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-2">Verify your email</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Thanks for signing up! Please verify your email address by clicking the link we just sent.
                    </p>
                    {status === 'verification-link-sent' && (
                        <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            A new verification link has been sent.
                        </div>
                    )}
                    <form onSubmit={submit}>
                        <button type="submit" disabled={processing}
                            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            {processing ? 'Sending…' : 'Resend Verification Email'}
                        </button>
                    </form>
                    <Link
                        href={route('logout')} method="post" as="button"
                        className="mt-3 block text-center text-sm text-gray-500 hover:underline"
                    >
                        Log Out
                    </Link>
                </div>
            </div>
        </div>
    );
}
