import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

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
    const map = { high: 'bg-rose-100 text-rose-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-gray-100 text-gray-500' };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-500'}`;
}

export default function ProjectShow({ project, tasks, comments = [], isAdmin, authId, projectOptions = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
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

    const submitComment = (e) => {
        e.preventDefault();
        if (!commentBody.trim()) return;
        setSubmitting(true);
        router.post(route('projects.comments.store', project.id), { body: commentBody }, {
            onSuccess: () => { setCommentBody(''); setSubmitting(false); },
            onError: () => setSubmitting(false),
            preserveScroll: true,
        });
    };

    const deleteComment = (commentId) => {
        if (!confirm('Delete this comment?')) return;
        router.delete(route('projects.comments.destroy', [project.id, commentId]), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={project.name} />
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                {flash.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{flash.success}</div>}
                {flash.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{flash.error}</div>}

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: project.color || '#7c3aed' }}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
                        <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="ml-auto">
                        <Link href={route('projects.index')} className="text-sm text-purple-600 hover:underline">← All Projects</Link>
                    </div>
                </div>

                {/* Tasks — Canvas assignment style */}
                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400 text-sm">
                            No tasks in this project.
                        </div>
                    ) : tasks.map(t => {
                        const overdue = t.is_overdue;
                        const done = t.status === 'done';
                        const inProgress = t.status === 'in_progress';
                        const stripColor = overdue ? '#f87171' : done ? '#34d399' : inProgress ? '#a78bfa' : '#d1d5db';
                        const statusLabel = done ? 'Done' : inProgress ? 'In Progress' : 'To Do';

                        return (
                            <div key={t.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition
                                ${overdue ? 'border-rose-200' : done ? 'border-emerald-100' : 'border-gray-100'}`}>
                                <div className="flex">
                                    {/* Left color strip */}
                                    <div className="w-1.5 shrink-0" style={{ backgroundColor: stripColor }} />

                                    {/* Main content */}
                                    <div className="flex-1 px-5 py-4 min-w-0">
                                        {/* Title */}
                                        <h3 className={`text-base font-bold mb-1 ${done ? 'line-through text-gray-400' : overdue ? 'text-rose-700' : 'text-gray-900'}`}>
                                            {done && '✅ '}{overdue && '⚠️ '}{t.title}
                                        </h3>

                                        {/* Canvas-style metadata row */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 border-b border-gray-100 pb-3 mb-3">
                                            {t.due_date ? (
                                                <span className={overdue ? 'text-rose-600 font-semibold' : ''}>
                                                    <span className="font-semibold text-gray-800">Due</span>{' '}
                                                    {formatDate(t.due_date)}
                                                    {t.due_time && <span className={`font-semibold ${overdue ? 'text-rose-600' : 'text-purple-600'}`}> by {formatTime(t.due_time)}</span>}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">No deadline set</span>
                                            )}
                                            <span className="text-gray-300 hidden sm:inline">|</span>
                                            <span>
                                                <span className="font-semibold text-gray-800">Priority</span>{' '}
                                                <span className={priorityBadge(t.priority)}>{t.priority}</span>
                                            </span>
                                            <span className="text-gray-300 hidden sm:inline">|</span>
                                            <span>
                                                <span className="font-semibold text-gray-800">Status</span>{' '}
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                                                    ${done ? 'bg-emerald-100 text-emerald-700' : inProgress ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {statusLabel}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Description if any */}
                                        {t.description && (
                                            <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>
                                        )}
                                    </div>

                                    {/* Right: action buttons */}
                                    <div className="flex flex-col items-end justify-center gap-2 px-4 py-4 shrink-0 border-l border-gray-50">
                                        {/* Main action button */}
                                        {!isAdmin && (overdue || done) ? (
                                            <button
                                                onClick={() => askAdminReopen(t)}
                                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90"
                                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
                                            >
                                                Ask Admin
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toggleStatus(t)}
                                                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90
                                                    ${done ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            >
                                                {done ? '🔓 Reopen' : t.status === 'in_progress' ? '✅ Mark Done' : '▶ Start'}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <Link href={route('tasks.edit', t.id)}
                                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition text-center">
                                                ✏️ Edit
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Progress Comments */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">Progress Notes ({comments.length})</h2>
                    <div className="space-y-3 mb-4">
                        {comments.map(c => (
                            <div key={c.id} className={`rounded-xl p-3 ${c.user?.is_admin ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-700">{c.user?.name}</span>
                                        {c.user?.is_admin && (
                                            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-purple-100 text-purple-700">Admin</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">{c.created_at}</span>
                                        {(isAdmin || c.user?.id === authId) && (
                                            <button onClick={() => deleteComment(c.id)} className="text-xs text-rose-400 hover:text-rose-600">Delete</button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700">{c.body}</p>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">No progress notes yet.</p>
                        )}
                    </div>
                    <form onSubmit={submitComment} className="flex gap-2">
                        <input
                            type="text"
                            value={commentBody}
                            onChange={e => setCommentBody(e.target.value)}
                            placeholder={isAdmin ? 'Leave a progress note…' : 'Write a comment…'}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button type="submit" disabled={submitting || !commentBody.trim()}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            Post
                        </button>
                    </form>
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
                                    {doneSubmitting ? 'Saving...' : 'Mark Done'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

