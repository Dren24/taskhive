import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

function priorityBadge(p) {
    const map = { high: 'bg-rose-100 text-rose-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-gray-100 text-gray-500' };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-500'}`;
}

function statusBadge(t) {
    if (t.is_overdue) return 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-600';
    const map = { done: 'bg-emerald-100 text-emerald-700', in_progress: 'bg-purple-100 text-purple-700', todo: 'bg-gray-100 text-gray-500' };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[t.status] || 'bg-gray-100 text-gray-500'}`;
}

function statusLabel(t) {
    if (t.is_overdue) return 'Overdue';
    return { done: 'Done', in_progress: 'In Progress', todo: 'Todo' }[t.status] || t.status;
}

export default function TaskIndex({ tasks, isAdmin, projectOptions = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [deletingId, setDeletingId] = useState(null);
    const [reopenTask, setReopenTask] = useState(null);
    const [reopenComment, setReopenComment] = useState('');
    const [reopenSubmitting, setReopenSubmitting] = useState(false);
    const [doneTask, setDoneTask] = useState(null);
    const [doneProjectId, setDoneProjectId] = useState('');
    const [doneSubmitting, setDoneSubmitting] = useState(false);

    const nextStatus = (status) => {
        if (status === 'todo') return 'in_progress';
        if (status === 'in_progress') return 'done';
        return 'todo';
    };

    const toggleStatus = (task) => {
        const upcoming = nextStatus(task.status);

        if (!isAdmin && upcoming === 'done') {
            const defaultProject = String(task.project_id || projectOptions?.[0]?.id || '');
            if (!defaultProject) {
                alert('No project folder available. Ask admin to assign a project first.');
                return;
            }

            setDoneTask(task);
            setDoneProjectId(defaultProject);
            return;
        }

        router.patch(route('tasks.toggle', task.id), {}, { preserveScroll: true });
    };

    const submitDoneFolder = (e) => {
        e.preventDefault();
        if (!doneTask || !doneProjectId) return;

        router.patch(
            route('tasks.toggle', doneTask.id),
            { project_id: doneProjectId },
            {
                preserveScroll: true,
                onStart: () => setDoneSubmitting(true),
                onFinish: () => setDoneSubmitting(false),
                onSuccess: () => {
                    setDoneTask(null);
                    setDoneProjectId('');
                },
            }
        );
    };

    const askAdminReopen = (task) => {
        setReopenTask(task);
        setReopenComment('');
    };

    const closeReopenModal = () => {
        if (reopenSubmitting) return;
        setReopenTask(null);
        setReopenComment('');
    };

    const submitReopenRequest = (e) => {
        e.preventDefault();
        if (!reopenTask || !reopenComment.trim()) return;

        router.post(
            route('tasks.request-reopen', reopenTask.id),
            { comment: reopenComment.trim() },
            {
                preserveScroll: true,
                onStart: () => setReopenSubmitting(true),
                onFinish: () => setReopenSubmitting(false),
                onSuccess: () => closeReopenModal(),
            }
        );
    };

    const deleteTask = (task) => {
        if (!confirm(`Delete "${task.title}"?`)) return;
        setDeletingId(task.id);
        router.delete(route('tasks.destroy', task.id), { onFinish: () => setDeletingId(null) });
    };

    return (
        <AppLayout>
            <Head title="Tasks" />
            <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Tasks</h1>
                        <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && (
                        <Link href={route('tasks.create')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Task
                        </Link>
                    )}
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{flash.success}</div>
                )}
                {flash.error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{flash.error}</div>
                )}

                {/* Task list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {tasks.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-sm">No tasks yet.</p>
                            {isAdmin && (
                                <Link href={route('tasks.create')} className="text-purple-600 text-sm font-medium hover:underline mt-2 inline-block">Create one</Link>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {tasks.map(task => (
                                <div key={task.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition ${task.is_overdue ? 'bg-rose-50' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                                            {task.comments_count > 0 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-600">
                                                    💬 {task.comments_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            <span className={priorityBadge(task.priority)}>{task.priority}</span>
                                            <span className={statusBadge(task)}>{statusLabel(task)}</span>
                                            {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!isAdmin && (task.is_overdue || task.status === 'done') && (
                                            <button
                                                onClick={() => askAdminReopen(task)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition"
                                            >
                                                Ask Admin
                                            </button>
                                        )}
                                        <button
                                            onClick={() => isAdmin || (!task.is_overdue && task.status !== 'done') ? toggleStatus(task) : null}
                                            disabled={!isAdmin && (task.is_overdue || task.status === 'done')}
                                            title={!isAdmin && (task.is_overdue || task.status === 'done') ? 'Ask admin to reopen this task' : undefined}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${!isAdmin && (task.is_overdue || task.status === 'done')
                                                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60'
                                                : task.status === 'done'
                                                    ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100'
                                                    : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                }`}>
                                            {task.status === 'done' || task.is_overdue ? 'Reopen' : 'Close'}
                                        </button>
                                        <Link href={route('tasks.edit', task.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                                            Edit
                                        </Link>
                                        {isAdmin && (
                                            <button onClick={() => deleteTask(task)} disabled={deletingId === task.id}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition disabled:opacity-50">
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {reopenTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Ask Admin to Reopen</h2>
                            <p className="text-xs text-gray-500 mt-1">Task: {reopenTask.title}</p>
                        </div>
                        <form onSubmit={submitReopenRequest} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Comment *</label>
                                <textarea
                                    value={reopenComment}
                                    onChange={(e) => setReopenComment(e.target.value)}
                                    rows={4}
                                    placeholder="Explain why this task should be reopened..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeReopenModal}
                                    disabled={reopenSubmitting}
                                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reopenSubmitting || !reopenComment.trim()}
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
                                >
                                    {reopenSubmitting ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {doneTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Choose Folder for Done Task</h2>
                            <p className="text-xs text-gray-500 mt-1">Task: {doneTask.title}</p>
                        </div>
                        <form onSubmit={submitDoneFolder} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Folder / Project *</label>
                                <select
                                    value={doneProjectId}
                                    onChange={(e) => setDoneProjectId(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                >
                                    {projectOptions.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { if (!doneSubmitting) { setDoneTask(null); setDoneProjectId(''); } }}
                                    disabled={doneSubmitting}
                                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={doneSubmitting || !doneProjectId}
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
                                >
                                    {doneSubmitting ? 'Saving...' : 'Close Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
