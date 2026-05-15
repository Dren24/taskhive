import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTime(time) {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
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
        todo:        { label: 'Todo',        cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    }[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
}

function initials(name) { return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function avatarColor(name) {
    const colors = ['bg-purple-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-indigo-500'];
    return colors[(name || '').charCodeAt(0) % colors.length];
}

// ─── Confirm Modal ─────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, confirmCls, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm animate-modal">
                <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 mb-5">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition ${confirmCls}`}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Task Modal ────────────────────────────────────────────────────────

function EditTaskModal({ task, onClose }) {
    const [form, setForm] = useState({
        title: task.title || '', description: task.description || '',
        priority: task.priority || 'medium', status: task.status || 'todo',
        due_date: task.due_date || '', due_time: task.due_time || '',
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
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    <div>
                        <h2 className="text-base font-bold text-white">Edit Task</h2>
                        <p className="text-purple-200 text-xs mt-0.5">Assigned to: {task.user?.name || '—'}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Task Title *</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition" />
                        {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Optional description"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition resize-none" />
                    </div>
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
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminIndex({ users, tasks, stats, auditLogs = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const [selectedUser, setSelectedUser] = useState(null);
    const [editTask, setEditTask]         = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [closeConfirm, setCloseConfirm]   = useState(null);
    const [search, setSearch]             = useState('');

    const filtered = (selectedUser ? tasks.filter(t => t.user?.id === selectedUser) : tasks)
        .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.user?.name || '').toLowerCase().includes(search.toLowerCase()));

    const doDelete = () => { router.delete(route('admin.tasks.destroy', deleteConfirm.id), { preserveScroll: true }); setDeleteConfirm(null); };
    const doClose  = () => { router.patch(route('admin.tasks.status', closeConfirm.id), { action: 'close' }, { preserveScroll: true }); setCloseConfirm(null); };
    const reopenTask = (task) => router.patch(route('admin.tasks.status', task.id), { action: 'reopen' }, { preserveScroll: true });

    const exportCSV = () => {
        const headers = ['Title','Assigned To','Project','Status','Priority','Due Date'];
        const rows = filtered.map(t => [
            `"${(t.title||'').replace(/"/g,'""')}"`,
            `"${(t.user?.name||'').replace(/"/g,'""')}"`,
            `"${(t.project?.name||'').replace(/"/g,'""')}"`,
            t.is_overdue ? 'Overdue' : t.status, t.priority, t.due_date||'',
        ]);
        const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
        const blob = new Blob([csv],{type:'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download='tasks-export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const statCards = [
        { label: 'Total Users', value: stats?.users   ?? 0, icon: '👥', accent: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-100' },
        { label: 'Total Tasks', value: stats?.total   ?? 0, icon: '📋', accent: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
        { label: 'Active',      value: stats?.active  ?? 0, icon: '🔄', accent: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100'  },
        { label: 'Done',        value: stats?.done    ?? 0, icon: '✅', accent: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100'},
        { label: 'Overdue',     value: stats?.overdue ?? 0, icon: '⚠️', accent: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-100'   },
    ];

    const borderAccent = (t) => t.is_overdue ? 'bg-rose-400' : t.status === 'done' ? 'bg-emerald-400' : t.status === 'in_progress' ? 'bg-purple-500' : 'bg-gray-200';
    const rowBg        = (t) => t.is_overdue ? 'bg-rose-50/50' : t.status === 'done' ? 'bg-emerald-50/30' : '';

    return (
        <AppLayout>
            <Head title="Admin" />

            <style>{`
                @keyframes modalIn { from{opacity:0;transform:scale(.95) translateY(-8px)} to{opacity:1;transform:scale(1) translateY(0)} }
                .animate-modal { animation: modalIn .2s ease-out forwards; }
                .audit-scroll::-webkit-scrollbar { display:none; }
                .audit-scroll { -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

                {/* Banner */}
                <div className="rounded-2xl px-7 py-5 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
                        <p className="text-purple-200 text-sm mt-0.5">Manage all tasks and users.</p>
                    </div>
                    <span className="text-5xl opacity-20 select-none">⚙️</span>
                </div>

                {flash.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">✅ {flash.success}</div>}
                {flash.error   && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">⚠️ {flash.error}</div>}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {statCards.map(c => (
                        <div key={c.label} className={`bg-white rounded-2xl border ${c.border} shadow-sm p-4 text-center hover:shadow-md transition group`}>
                            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-xl mx-auto mb-2 group-hover:scale-110 transition-transform`}>{c.icon}</div>
                            <span className={`text-2xl font-extrabold block ${c.accent}`}>{c.value}</span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block font-medium">{c.label}</span>
                        </div>
                    ))}
                </div>

                {/* Compact Audit Log bar */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm">🛡️</span>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Audit Log</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 shrink-0" />
                    {auditLogs.length === 0 ? (
                        <span className="text-xs text-gray-400">No audit events yet.</span>
                    ) : (
                        <div className="flex gap-5 overflow-x-auto audit-scroll flex-1 pb-px">
                            {auditLogs.map(log => (
                                <div key={log.id} className="flex items-center gap-1.5 shrink-0 text-xs text-gray-600 whitespace-nowrap">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarColor(log.actor)} text-white`}>
                                        {initials(log.actor)}
                                    </span>
                                    <span><span className="font-semibold text-gray-800">{log.actor}</span> deleted <span className="font-semibold text-gray-700">{log.target_name}</span></span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-gray-400">{log.created_at}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main area: sidebar + task table */}
                <div className="flex gap-5 items-start">

                    {/* Sidebar */}
                    <div className="w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Filter by User</p>
                        </div>
                        <div className="p-2 space-y-0.5">
                            <button onClick={() => setSelectedUser(null)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center justify-between ${selectedUser === null ? 'bg-purple-600 text-white font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span>All Users</span>
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${selectedUser === null ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>{tasks.length}</span>
                            </button>
                            {(users || []).map(u => (
                                <button key={u.id} onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-2 ${selectedUser === u.id ? 'bg-purple-600 text-white font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${selectedUser === u.id ? 'bg-white/25 text-white' : `${avatarColor(u.name)} text-white`}`}>
                                        {initials(u.name)}
                                    </span>
                                    <span className="flex-1 truncate">{u.name}</span>
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${selectedUser === u.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>{u.tasks_count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Task panel */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                        {/* Toolbar */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or users…"
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition" />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 font-medium">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
                            <button onClick={exportCSV}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition shrink-0">
                                ⬇️ Export CSV
                            </button>
                            <Link href={route('tasks.create')}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-xl shadow-sm hover:opacity-90 transition shrink-0"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                + New Task
                            </Link>
                        </div>

                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_100px_80px_120px] gap-x-3 px-5 py-2 bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Task</span>
                            <span className="text-center">Status</span>
                            <span className="text-center">Priority</span>
                            <span className="text-right">Actions</span>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 text-sm">
                                <div className="text-4xl mb-3 opacity-30">📋</div>
                                No tasks found.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filtered.map(t => {
                                    const st = statusInfo(t);
                                    return (
                                        <div key={t.id} className={`group flex items-center hover:bg-gray-50/80 transition ${rowBg(t)}`}>
                                            {/* Left color strip */}
                                            <div className={`w-[3px] self-stretch shrink-0 ${borderAccent(t)}`} />

                                            {/* Task info */}
                                            <div className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(t.user?.name)}`}>
                                                    {initials(t.user?.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`text-sm font-semibold truncate ${t.status === 'done' ? 'line-through text-gray-400' : t.is_overdue ? 'text-rose-700' : 'text-gray-800'}`}>
                                                            {t.title}
                                                        </p>
                                                        {t.comments_count > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold shrink-0">💬 {t.comments_count}</span>}
                                                        {t.submissions_count > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold shrink-0">📤 {t.submissions_count}{t.max_submissions ? `/${t.max_submissions}` : ''}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 flex-wrap">
                                                        {t.user    && <span>👤 {t.user.name}</span>}
                                                        {t.project && <span>📁 {t.project.name}</span>}
                                                        {t.due_date && <span className={t.is_overdue ? 'text-rose-500 font-semibold' : ''}>📅 {formatDate(t.due_date)}{t.due_time ? ` · 🕐 ${formatTime(t.due_time)}` : ''}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="w-[100px] flex justify-center shrink-0 px-2">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>{st.label}</span>
                                            </div>

                                            {/* Priority */}
                                            <div className="w-[80px] flex justify-center shrink-0 px-2">
                                                <span className={priorityBadge(t.priority)}>{t.priority}</span>
                                            </div>

                                            {/* Actions */}
                                            <div className="w-[120px] flex items-center justify-end gap-1.5 pr-4 shrink-0 opacity-60 group-hover:opacity-100 transition">
                                                <button onClick={() => setEditTask(t)} title="Edit"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 transition text-sm">✏️</button>
                                                {t.status === 'done' ? (
                                                    <button onClick={() => reopenTask(t)} title="Reopen"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 transition text-sm">🔓</button>
                                                ) : (
                                                    <button onClick={() => setCloseConfirm(t)} title="Mark Done"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition text-sm">✅</button>
                                                )}
                                                <button onClick={() => setDeleteConfirm(t)} title="Delete"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition text-sm">🗑️</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />}

            {deleteConfirm && (
                <ConfirmModal title="Delete Task?"
                    message={`Permanently delete "${deleteConfirm.title}"? This cannot be undone.`}
                    confirmLabel="Delete" confirmCls="bg-rose-500 hover:bg-rose-600"
                    onConfirm={doDelete} onCancel={() => setDeleteConfirm(null)} />
            )}

            {closeConfirm && (
                <ConfirmModal title="Mark as Done?"
                    message={`Close "${closeConfirm.title}"? The user won't be able to edit it.`}
                    confirmLabel="Close Task" confirmCls="bg-emerald-500 hover:bg-emerald-600"
                    onConfirm={doClose} onCancel={() => setCloseConfirm(null)} />
            )}
        </AppLayout>
    );
}
