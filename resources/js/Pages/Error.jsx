import { Head, Link } from '@inertiajs/react';

const messages = {
    403: { title: 'Access Denied', body: "You don't have permission to view this page." },
    404: { title: 'Page Not Found', body: "The page you're looking for doesn't exist." },
    419: { title: 'Session Expired', body: 'Your session has expired. Please refresh and try again.' },
    500: { title: 'Server Error', body: 'Something went wrong on our end. Please try again later.' },
    503: { title: 'Unavailable', body: 'The service is temporarily unavailable. Please try again soon.' },
};

export default function Error({ status }) {
    const { title, body } = messages[status] ?? {
        title: 'Unexpected Error',
        body: 'An unexpected error occurred.',
    };

    return (
        <>
            <Head title={`${status} — ${title}`} />

            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans antialiased">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
                    >
                        T
                    </div>
                    <span className="font-bold text-gray-900 text-lg">TaskHive</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
                    <p className="text-5xl font-extrabold text-purple-600 mb-3">{status}</p>
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">{title}</h1>
                    <p className="text-sm text-gray-500 mb-6">{body}</p>
                    <Link
                        href="/"
                        className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </>
    );
}
