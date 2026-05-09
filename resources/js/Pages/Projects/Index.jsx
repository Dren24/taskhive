import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

const COLORS = ['#7c3aed', '#9333ea', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777'];

export default function ProjectsIndex({ projects, users = [], isAdmin }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        color: '#7c3aed',
        user_id: users.length > 0 ? String(users[0].id) : '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (!data.user_id) return;
        post(route('projects.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    };

    return (
        <AppLayout>
            <Head title="Projects" />
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Projects</h1>
                        <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && (
                        <button onClick={() => setShowForm(v => !v)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            {showForm ? 'Cancel' : '+ New Project'}
                        </button>
                    )}
                </div>

                {isAdmin && showForm && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-sm font-bold text-gray-900 mb-4">Create Project</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name *</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required
                                    placeholder="Project name"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign To *</label>
                                <select
                                    value={data.user_id}
                                    onChange={e => setData('user_id', e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                >
                                    {users.length === 0 && <option value="">No users available</option>}
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                                {errors.user_id && <p className="text-red-500 text-xs mt-1">{errors.user_id}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <button type="button" key={c} onClick={() => setData('color', c)}
                                            className={`w-7 h-7 rounded-full border-2 transition ${data.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={processing}
                                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                {processing ? 'Creating…' : 'Create Project'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.length === 0 ? (
                        <div className="col-span-3 text-center py-16 text-gray-400 text-sm">No projects yet.</div>
                    ) : projects.map(p => (
                        <Link key={p.id} href={route('projects.show', p.id)}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: p.color || '#7c3aed' }}>
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition">{p.name}</p>
                                    <p className="text-xs text-gray-400">{p.tasks_count} task{p.tasks_count !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
