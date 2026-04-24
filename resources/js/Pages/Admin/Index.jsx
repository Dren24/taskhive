import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

function priorityBadge(p) {
    const map = { high: 'bg-rose-100 text-rose-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-gray-100 text-gray-500' };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-500'}`;
}

function statusLabel(t) {
    if (t.is_overdue) return { label: 'Overdue', cls: 'bg-rose-100 text-rose-600' };
    return { done: { label: 'Done', cls: 'bg-emerald-100 text-emerald-700' }, in_progress: { label: 'In Progress', cls: 'bg-purple-100 text-purple-700' }, todo: { label: 'Todo', cls: 'bg-gray-100 text-gray-500' } }[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-500' };
}

export default function AdminIndex({ users, tasks, stats }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [selectedUser, setSelectedUser] = useState(null);

    const filtered = selectedUser ? tasks.filter(t => t.user?.id === selectedUser) : tasks;

    const deleteTask = (task) => {
        if (!confirm(`Delete "${task.title}"?`)) return;
        router.delete(route('tasks.destroy', task.id));
    };

    const statCards = [
        { label: 'Total Users', value: stats?.users ?? 0, color: 'bg-purple-50 text-purple-600' },
        { label: 'Total Tasks', value: stats?.total ?? 0, color: 'bg-blue-50 text-blue-600' },
        { label: 'Active', value: stats?.active ?? 0, color: 'bg-amber-50 text-amber-600' },
        { label: 'Done', value: stats?.done ?? 0, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Overdue', value: stats?.overdue ?? 0, color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <AppLayout>
            <Head title="Admin" />
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                    <p className="text-purple-200 text-sm mt-1">Manage all tasks and users.</p>
                </div>

                {flash.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{flash.success}</div>}
                {flash.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{flash.error}</div>}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {statCards.map(c => (
                        <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                            <span className={`text-2xl font-bold block ${c.color.split(' ')[1]}`}>{c.value}</span>
                            <span className="text-xs text-gray-500 mt-1 block">{c.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-6">
                    {/* User sidebar */}
                    <div className="w-48 shrink-0 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filter by User</p>
                        <button onClick={() => setSelectedUser(null)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${selectedUser === null ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                            All Users
                        </button>
                        {(users || []).map(u => (
                            <button key={u.id} onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${selectedUser === u.id ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                {u.name}
                            </button>
                        ))}
                    </div>

                    {/* Task table */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">{filtered.length} tasks</span>
                            <Link href={route('tasks.create')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg shadow hover:opacity-90 transition"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                + New Task
                            </Link>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">No tasks found.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filtered.map(t => {
                                    const st = statusLabel(t);
                                    return (
                                        <div key={t.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition ${t.is_overdue ? 'bg-rose-50' : ''}`}>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className={priorityBadge(t.priority)}>{t.priority}</span>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                                                    {t.user && <span className="text-xs text-gray-400">→ {t.user.name}</span>}
                                                    {t.project && <span className="text-xs text-gray-400">📁 {t.project.name}</span>}
                                                    {t.due_date && <span className="text-xs text-gray-400">{t.due_date}</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Link href={route('tasks.edit', t.id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                                                    Edit
                                                </Link>
                                                <button onClick={() => deleteTask(t)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
