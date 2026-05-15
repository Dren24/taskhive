import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

// ─── 2-step User Delete Modal ───────────────────────────────────────────────
function UserDeleteModal({ user, step, verifyText, setVerifyText, onCancel, onContinue, onConfirm }) {
    if (!user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-md">
                {step === 1 ? (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-lg mb-3">🗑️</div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Delete user account?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            You are about to permanently delete <span className="font-semibold text-gray-800">{user.name}</span>.
                            This removes all related tasks, submissions, comments, and files.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={onContinue}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-rose-500 hover:bg-rose-600 transition">
                                Continue
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-lg mb-3">⚠️</div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Second-step verification</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Type <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm removal of{' '}
                            <span className="font-semibold text-gray-800">{user.email}</span>.
                        </p>
                        <input
                            value={verifyText}
                            onChange={e => setVerifyText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            autoFocus
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition mb-4"
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={onConfirm} disabled={verifyText !== 'DELETE'}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-rose-500 hover:bg-rose-600 transition disabled:opacity-40">
                                Delete User
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ProfileEdit({ mustVerifyEmail, status, isAdmin = false, managedUsers = [], auditLogs = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const tabs = isAdmin
        ? [['profile', 'Profile'], ['password', 'Password'], ['accounts', 'Account Management']]
        : [['profile', 'Profile'], ['password', 'Password'], ['delete', 'Delete Account']];

    const [activeTab, setActiveTab] = useState('profile');

    // User delete state (admin only)
    const [deleteUser, setDeleteUser]     = useState(null);
    const [deleteStep, setDeleteStep]     = useState(1);
    const [deleteText, setDeleteText]     = useState('');

    const startDelete  = (u) => { setDeleteUser(u); setDeleteStep(1); setDeleteText(''); };
    const continueStep = ()  => setDeleteStep(2);
    const cancelDelete = ()  => { setDeleteUser(null); setDeleteStep(1); setDeleteText(''); };
    const confirmDelete = () => {
        router.delete(route('profile.users.destroy', deleteUser.id), {
            preserveScroll: true,
            onFinish: cancelDelete,
        });
    };

    return (
        <AppLayout>
            <Head title="Profile Settings" />
            <style>{`
                @keyframes modalIn {
                    from { opacity:0; transform:scale(0.95) translateY(-8px); }
                    to   { opacity:1; transform:scale(1)    translateY(0);    }
                }
                .animate-modal { animation: modalIn 0.2s ease-out forwards; }
            `}</style>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>

                {flash.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                        ✅ {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                        ⚠️ {flash.error}
                    </div>
                )}

                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {tabs.map(([key, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`px-5 py-2 text-xs font-semibold rounded-lg transition ${activeTab === key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile'  && <ProfileForm mustVerifyEmail={mustVerifyEmail} status={status} />}
                {activeTab === 'password' && <PasswordForm />}
                {activeTab === 'delete'   && <DeleteForm />}
                {activeTab === 'accounts' && isAdmin && (
                    <AccountManagement users={managedUsers} auditLogs={auditLogs} onDelete={startDelete} />
                )}
            </div>

            {deleteUser && (
                <UserDeleteModal
                    user={deleteUser}
                    step={deleteStep}
                    verifyText={deleteText}
                    setVerifyText={setDeleteText}
                    onCancel={cancelDelete}
                    onContinue={continueStep}
                    onConfirm={confirmDelete}
                />
            )}
        </AppLayout>
    );
}

// ─── Account Management (admin) ──────────────────────────────────────────────
function AccountManagement({ users, auditLogs, onDelete }) {
    return (
        <div className="space-y-5">
            {/* User table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900">User Accounts</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Delete user accounts with verified two-step confirmation.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left py-3 px-5">User</th>
                                <th className="text-center py-3">Role</th>
                                <th className="text-center py-3">Projects</th>
                                <th className="text-center py-3">Tasks</th>
                                <th className="text-right py-3 px-4">Last Active</th>
                                <th className="text-right py-3 pr-5">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="py-3.5 px-5">
                                            <p className="font-semibold text-gray-800">{u.name}</p>
                                            <p className="text-gray-400 truncate">{u.email}</p>
                                        </td>
                                        <td className="text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="text-center text-gray-600">{u.projects_count}</td>
                                        <td className="text-center text-gray-600">{u.tasks_count}</td>
                                        <td className="text-right pr-4 text-gray-400">{u.last_active}</td>
                                        <td className="text-right pr-5">
                                            <button onClick={() => onDelete(u)}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition">
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Audit Log</h2>
                {auditLogs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No audit events yet.</p>
                ) : (
                    <div className="space-y-3">
                        {auditLogs.map(log => (
                            <div key={log.id} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                                    🛡️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-700">
                                        <span className="font-semibold text-gray-900">{log.actor}</span>
                                        {' '}<span className="text-gray-500">deleted</span>{' '}
                                        <span className="font-semibold text-gray-800">{log.target_name}</span>
                                    </p>
                                    <p className="text-[11px] text-gray-400">{log.target_email} · {log.created_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────
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

// ─── Password Form ────────────────────────────────────────────────────────────
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

// ─── Delete Own Account Form (non-admins) ─────────────────────────────────────
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

