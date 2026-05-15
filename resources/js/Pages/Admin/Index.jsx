import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTime(time) {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function priorityBadge(p) {
    const map = { high: 'bg-rose-100 text-rose-600 border-rose-200', medium: 'bg-amber-100 text-amber-600 border-amber-200', low: 'bg-gray-100 text-gray-500 border-gray-200' };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${map[p] || 'bg-gray-100 text-gray-500 border-gray-200'}`;
}

function statusInfo(t) {
    if (t.is_overdue) return { label: 'Overdue', cls: 'bg-rose-100 text-rose-600 border-rose-200' };
    return {
        done:        { label: 'Done',        cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        in_progress: { label: 'In Progress', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
        todo:        { label: 'Todo',         cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    }[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
}

// ─── Confirmation Modal ─────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, confirmCls, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm animate-modal">
                <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 mb-5">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition ${confirmCls}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Task Modal ────────────────────────────────────────────────────────

function EditTaskModal({ task, onClose }) {
    const [form, setForm] = useState({
        title:       task.title || '',
        description: task.description || '',
        priority:    task.priority || 'medium',
        status:      task.status || 'todo',
        due_date:    task.due_date || '',
        due_time:    task.due_time || '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const save = () => {
        setSaving(true);
        router.patch(route('admin.tasks.update', task.id), form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError: (errs) => { setSaving(false); setErrors(errs); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg animate-modal overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    <div>
                        <h2 className="text-base font-bold text-white">Edit Task</h2>
                        <p className="text-purple-200 text-xs mt-0.5">Assigned to: {task.user?.name || '—'}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Task Title *</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition"
                            placeholder="Task title" />
                        {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition resize-none"
                            placeholder="Optional description" />
                    </div>

                    {/* Deadline Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deadline Date</label>
                            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deadline Time</label>
                            <input type="time" value={form.due_time} onChange={e => set('due_time', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition" />
                        </div>
                    </div>

                    {/* Priority & Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Priority</label>
                            <select value={form.priority} onChange={e => set('priority', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition bg-white">
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition bg-white">
                                <option value="todo">⏳ Todo</option>
                                <option value="in_progress">🔄 In Progress</option>
                                <option value="done">✅ Done</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} disabled={saving}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
                        Cancel
                    </button>
                    <button onClick={save} disabled={saving}
                        className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminIndex({ users, tasks, stats }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [selectedUser, setSelectedUser] = useState(null);
    const [editTask, setEditTask] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [closeConfirm, setCloseConfirm] = useState(null);

    const filtered = selectedUser ? tasks.filter(t => t.user?.id === selectedUser) : tasks;

    const confirmDelete = (task) => setDeleteConfirm(task);
    const doDelete = () => {
        router.delete(route('admin.tasks.destroy', deleteConfirm.id), { preserveScroll: true });
        setDeleteConfirm(null);
    };

    const confirmClose = (task) => setCloseConfirm(task);
    const doClose = () => {
        router.patch(route('admin.tasks.status', closeConfirm.id), { action: 'close' }, { preserveScroll: true });
        setCloseConfirm(null);
    };

    const reopenTask = (task) => {
        router.patch(route('admin.tasks.status', task.id), { action: 'reopen' }, { preserveScroll: true });
    };

    const statCards = [
        { label: 'Total Users', value: stats?.users ?? 0, icon: '👥', color: 'bg-purple-50 text-purple-600' },
        { label: 'Total Tasks', value: stats?.total ?? 0, icon: '📋', color: 'bg-blue-50 text-blue-600' },
        { label: 'Active',      value: stats?.active ?? 0, icon: '🔄', color: 'bg-amber-50 text-amber-600' },
        { label: 'Done',        value: stats?.done ?? 0,   icon: '✅', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Overdue',     value: stats?.overdue ?? 0, icon: '⚠️', color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <AppLayout>
            <Head title="Admin" />

            {/* Modal animation */}
            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);     }
                }
                .animate-modal { animation: modalIn 0.2s ease-out forwards; }
            `}</style>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                    <p className="text-purple-200 text-sm mt-1">Manage all tasks and users.</p>
                </div>

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

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {statCards.map(c => (
                        <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition">
                            <span className="text-xl block mb-1">{c.icon}</span>
                            <span className={`text-2xl font-bold block ${c.color.split(' ')[1]}`}>{c.value}</span>
                            <span className="text-xs text-gray-500 mt-1 block">{c.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-6">
                    {/* User sidebar */}
                    <div className="w-48 shrink-0 space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">Filter by User</p>
                        <button onClick={() => setSelectedUser(null)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${selectedUser === null ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                            All Users
                            <span className="ml-1 text-xs opacity-60">({tasks.length})</span>
                        </button>
                        {(users || []).map(u => (
                            <button key={u.id} onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${selectedUser === u.id ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                {u.name}
                                <span className="ml-1 text-xs opacity-60">({u.tasks_count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Task list */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
                            <Link href={route('tasks.create')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg shadow hover:opacity-90 transition"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                + New Task
                            </Link>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 text-sm">No tasks found.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filtered.map(t => {
                                    const st = statusInfo(t);
                                    return (
                                        <div key={t.id} className={`group flex items-start gap-4 px-5 py-4 hover:bg-gray-50/80 transition ${t.is_overdue ? 'bg-rose-50/60' : t.status === 'done' ? 'bg-emerald-50/30' : ''}`}>
                                            {/* Status indicator strip */}
                                            <div className={`w-1 self-stretch rounded-full shrink-0 ${t.is_overdue ? 'bg-rose-400' : t.status === 'done' ? 'bg-emerald-400' : t.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-200'}`} />

                                            <div className="flex-1 min-w-0">
                                                {/* Title row */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`text-sm font-semibold ${t.status === 'done' ? 'line-through text-gray-400' : t.is_overdue ? 'text-rose-700' : 'text-gray-800'}`}>
                                                        {t.status === 'done' ? '✅ ' : t.is_overdue ? '⚠️ ' : ''}{t.title}
                                                    </p>
                                                    {t.comments_count > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-600">
                                                            💬 {t.comments_count}
                                                        </span>
                                                    )}
                                                    {t.submissions_count > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                                                            📤 {t.submissions_count}{t.max_submissions ? `/${t.max_submissions}` : ''}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Meta row */}
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className={`${priorityBadge(t.priority)} border`}>{t.priority}</span>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>{st.label}</span>
                                                    {t.user && <span className="text-xs text-gray-400">👤 {t.user.name}</span>}
                                                    {t.project && <span className="text-xs text-gray-400">📁 {t.project.name}</span>}
                                                </div>

                                                {/* Deadline */}
                                                {t.due_date && (
                                                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${t.is_overdue ? 'text-rose-500 font-semibold' : 'text-gray-400'}`}>
                                                        📅 {formatDate(t.due_date)}
                                                        {t.due_time && (
                                                            <span className="text-purple-500 font-semibold">· 🕐 {formatTime(t.due_time)}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                                <button onClick={() => setEditTask(t)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                                                    ✏️ Edit
                                                </button>
                                                {t.status === 'done' ? (
                                                    <button onClick={() => reopenTask(t)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 transition">
                                                        🔓 Reopen
                                                    </button>
                                                ) : (
                                                    <button onClick={() => confirmClose(t)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition">
                                                        ✅ Close
                                                    </button>
                                                )}
                                                <button onClick={() => confirmDelete(t)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition">
                                                    🗑️ Delete
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

            {/* Edit Modal */}
            {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <ConfirmModal
                    title="Delete Task?"
                    message={`Are you sure you want to permanently delete "${deleteConfirm.title}"? This cannot be undone.`}
                    confirmLabel="Delete"
                    confirmCls="bg-rose-500 hover:bg-rose-600"
                    onConfirm={doDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}

            {/* Close Confirmation */}
            {closeConfirm && (
                <ConfirmModal
                    title="Close Task?"
                    message={`Mark "${closeConfirm.title}" as done? The assigned user will no longer be able to edit it.`}
                    confirmLabel="Close Task"
                    confirmCls="bg-emerald-500 hover:bg-emerald-600"
                    onConfirm={doClose}
                    onCancel={() => setCloseConfirm(null)}
                />
            )}
        </AppLayout>
    );
}

