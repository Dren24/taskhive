import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

export default function ProfileEdit({ mustVerifyEmail, status }) {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <AppLayout>
            <Head title="Profile" />
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    {[['profile', 'Profile'], ['password', 'Password'], ['delete', 'Delete Account']].map(([key, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${activeTab === key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {label}
                        </button>
                    ))}
                </div>
                {activeTab === 'profile' && <ProfileForm mustVerifyEmail={mustVerifyEmail} status={status} />}
                {activeTab === 'password' && <PasswordForm />}
                {activeTab === 'delete' && <DeleteForm />}
            </div>
        </AppLayout>
    );
}

function ProfileForm({ mustVerifyEmail, status }) {
    const { props } = usePage();
    const user = props.auth?.user || {};
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
    });
    const submit = (e) => { e.preventDefault(); patch(route('profile.update')); };
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Profile Information</h2>
            {status === 'profile-updated' && <div className="mb-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2">Profile updated.</div>}
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name</label>
                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                {mustVerifyEmail && <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">Your email is unverified.</p>}
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    {processing ? 'Saving…' : 'Save'}
                </button>
            </form>
        </div>
    );
}

function PasswordForm() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '', password: '', password_confirmation: '',
    });
    const submit = (e) => { e.preventDefault(); put(route('password.update'), { onSuccess: () => reset() }); };
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Update Password</h2>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Current Password</label>
                    <input type="password" value={data.current_password} onChange={e => setData('current_password', e.target.value)} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                    {errors.current_password && <p className="text-red-500 text-xs mt-1">{errors.current_password}</p>}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">New Password</label>
                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm Password</label>
                    <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                </div>
                <button type="submit" disabled={processing}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    {processing ? 'Updating…' : 'Update Password'}
                </button>
            </form>
        </div>
    );
}

function DeleteForm() {
    const { data, setData, delete: destroy, processing, errors } = useForm({ password: '' });
    const [showConfirm, setShowConfirm] = useState(false);
    const submit = (e) => { e.preventDefault(); destroy(route('profile.destroy')); };
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6">
            <h2 className="text-sm font-bold text-rose-700 mb-2">Delete Account</h2>
            <p className="text-sm text-gray-500 mb-4">Once deleted, all data will be permanently removed.</p>
            {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-rose-500 hover:bg-rose-600 transition">
                    Delete My Account
                </button>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm your password</label>
                        <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} required autoFocus
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"/>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={processing}
                            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-rose-500 hover:bg-rose-600 transition disabled:opacity-50">
                            {processing ? 'Deleting…' : 'Confirm Delete'}
                        </button>
                        <button type="button" onClick={() => setShowConfirm(false)}
                            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
