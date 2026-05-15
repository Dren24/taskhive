import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useCallback } from 'react';
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

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(time) {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isDueSoon(task) {
    if (!task.due_date || task.is_overdue || task.status === 'done') return false;
    const due = new Date(task.due_date + 'T' + (task.due_time || '23:59') + ':00');
    const h = (due - new Date()) / 36e5;
    return h >= 0 && h <= 48;
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name) {
    if (!name) return '📎';
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    if (['doc','docx'].includes(ext)) return '📝';
    if (['xls','xlsx','csv'].includes(ext)) return '📊';
    if (['zip','rar','7z','tar'].includes(ext)) return '🗜️';
    return '📎';
}

/* ─── Submission Modal ───────────────────────────────────────────────── */
function SubmitModal({ task, projectOptions = [], onClose }) {
    const [file, setFile] = useState(null);
    const [comment, setComment] = useState('');
    const [dragging, setDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [projectId, setProjectId] = useState(task.project_id || (projectOptions?.[0]?.id ?? ''));
    const fileRef = useRef();

    const isResubmit = (task.submissions_count || 0) > 0;
    const label = isResubmit ? 'Resubmit Task' : 'Submit Task';
    const MAX_COMMENT = 2000;

    const pickFile = (f) => {
        if (!f) return;
        if (f.size > 20 * 1024 * 1024) { alert('File must be under 20 MB.'); return; }
        setFile(f);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files[0]);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!task.project_id && !projectId) {
            alert('Please select a project folder for this submission.');
            return;
        }

        const formData = new FormData();
        if (comment.trim()) formData.append('comment', comment.trim());
        if (file) formData.append('file', file);
        if (!task.project_id && projectId) formData.append('project_id', projectId);

        setSubmitting(true);
        setProgress(0);

        router.post(route('tasks.submit', task.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onProgress: (p) => setProgress(p?.percentage ?? 50),
            onFinish: () => { setSubmitting(false); setProgress(0); },
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed08,#9333ea04)' }}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">📤</span>
                            <h2 className="text-base font-bold text-gray-900">{label}</h2>
                            {isResubmit && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                    Attempt #{(task.submissions_count || 0) + 1}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-purple-700 truncate max-w-sm">{task.title}</p>
                        {task.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                        )}
                        {task.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                                📅 Due: <span className="font-medium text-gray-700">{formatDate(task.due_date)}{task.due_time && ` · ${formatTime(task.due_time)}`}</span>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} disabled={submitting}
                        className="ml-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shrink-0">
                        ✕
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">

                        {/* File upload drop zone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Attach File <span className="text-gray-400 font-normal normal-case">(optional · max 20 MB)</span>
                            </label>
                            <div
                                onClick={() => !file && fileRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={onDrop}
                                className={`relative border-2 border-dashed rounded-xl transition cursor-pointer
                                    ${file ? 'border-purple-300 bg-purple-50' : dragging ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50'}`}>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => pickFile(e.target.files[0])}
                                />

                                {file ? (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <span className="text-2xl">{fileIcon(file.name)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                        </div>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-rose-100 hover:text-rose-600 text-xs transition">
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-8 px-4 text-center">
                                        <div className="text-3xl mb-2">☁️</div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, PNG, ZIP and more</p>
                                        <button type="button" onClick={() => fileRef.current?.click()}
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 text-purple-600 bg-white hover:bg-purple-50 transition">
                                            📂 Browse files
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comment textarea */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Comment <span className="text-gray-400 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                                rows={4}
                                placeholder="Add a note or explanation for your submission..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            />
                            <div className={`text-right text-xs mt-1 ${comment.length > MAX_COMMENT * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                                {comment.length}/{MAX_COMMENT}
                            </div>
                        </div>

                        {!task.project_id && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Project Folder <span className="text-rose-400">*</span>
                                </label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                >
                                    <option value="">Select project</option>
                                    {projectOptions.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Choose an assigned project folder for this submission.</p>
                            </div>
                        )}

                        {/* Progress bar */}
                        {submitting && (
                            <div className="space-y-1">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#9333ea)' }} />
                                </div>
                                <p className="text-xs text-gray-500 text-center">Uploading… {progress}%</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose} disabled={submitting}
                                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                {submitting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Submitting…
                                    </>
                                ) : (
                                    <>{isResubmit ? '🔄' : '📤'} {label}</>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Submission history */}
                    {(task.submissions || []).length > 0 && (
                        <div className="px-6 pb-6">
                            <div className="border-t border-gray-100 pt-5">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                                    Submission History ({task.submissions.length})
                                </h3>
                                <div className="space-y-3">
                                    {task.submissions.map((s, i) => (
                                        <div key={s.id}
                                            className={`rounded-xl border p-4 ${i === 0 ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${i === 0 ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                                                        #{s.attempt}
                                                    </span>
                                                    {i === 0 && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Latest</span>
                                                    )}
                                                    <span className="text-xs text-gray-500 font-medium">{s.user?.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{s.created_at}</span>
                                            </div>
                                            {s.comment && (
                                                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{s.comment}</p>
                                            )}
                                            {s.original_name && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{fileIcon(s.original_name)}</span>
                                                    {s.download_url ? (
                                                        <a href={s.download_url}
                                                            className="text-xs text-purple-600 hover:underline font-medium truncate max-w-xs">
                                                            {s.original_name}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 truncate max-w-xs">{s.original_name}</span>
                                                    )}
                                                </div>
                                            )}
                                            {!s.comment && !s.original_name && (
                                                <p className="text-xs text-gray-400 italic">No file or comment attached.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TaskIndex({ tasks, isAdmin, projectOptions = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const authId = props.auth?.user?.id;
    const [deletingId, setDeletingId] = useState(null);
    const [reopenTask, setReopenTask] = useState(null);
    const [reopenComment, setReopenComment] = useState('');
    const [reopenSubmitting, setReopenSubmitting] = useState(false);
    const [doneTask, setDoneTask] = useState(null);
    const [doneProjectId, setDoneProjectId] = useState('');
    const [doneSubmitting, setDoneSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState({});
    const [replyText, setReplyText] = useState({});
    const [replySubmitting, setReplySubmitting] = useState({});
    const [submitModalTask, setSubmitModalTask] = useState(null);

    const toggleComments = (taskId) => {
        setExpandedComments(prev => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const submitReply = (e, task) => {
        e.preventDefault();
        const body = (replyText[task.id] || '').trim();
        if (!body) return;
        setReplySubmitting(prev => ({ ...prev, [task.id]: true }));
        router.post(route('tasks.comments.store', task.id), { body }, {
            preserveScroll: true,
            onFinish: () => setReplySubmitting(prev => ({ ...prev, [task.id]: false })),
            onSuccess: () => setReplyText(prev => ({ ...prev, [task.id]: '' })),
        });
    };

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

                {/* Task list — Canvas assignment style */}
                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
                            <p className="text-sm">No tasks yet.</p>
                        </div>
                    ) : (
                        tasks.map(task => {
                            const overdue = task.is_overdue;
                            const done = task.status === 'done';
                            const soon = isDueSoon(task);
                            const inProgress = task.status === 'in_progress';
                            const stripColor = overdue ? '#f87171' : done ? '#34d399' : soon ? '#fbbf24' : inProgress ? '#a78bfa' : '#d1d5db';
                            const statusLbl = done ? 'Done' : inProgress ? 'In Progress' : 'To Do';
                            const statusCls = done ? 'bg-emerald-100 text-emerald-700' : inProgress ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500';

                            return (
                                <div key={task.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition
                                    ${overdue ? 'border-rose-200' : soon ? 'border-amber-200' : done ? 'border-emerald-100' : 'border-gray-100'}`}>
                                    <div className="flex">
                                        {/* Left color strip */}
                                        <div className="w-1.5 shrink-0" style={{ backgroundColor: stripColor }} />

                                        {/* Main content */}
                                        <div className="flex-1 px-5 py-4 min-w-0">
                                            {/* Title */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`text-base font-bold ${done ? 'line-through text-gray-400' : overdue ? 'text-rose-700' : 'text-gray-900'}`}>
                                                    {done && '✅ '}{overdue && '⚠️ '}{soon && !overdue && '⏰ '}{task.title}
                                                </h3>
                                                <button
                                                    onClick={() => toggleComments(task.id)}
                                                    title={task.comments_count > 0 ? 'View / add comments' : 'Add a comment'}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-600 hover:bg-purple-200 transition">
                                                    💬{task.comments_count > 0 ? ` ${task.comments_count}` : ''} {expandedComments[task.id] ? '▲' : '▼'}
                                                </button>
                                                {task.submissions_count > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                                                        📤 {task.submissions_count}{task.max_submissions ? `/${task.max_submissions}` : ''}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Canvas-style metadata row */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 border-b border-gray-100 pb-3 mt-2 mb-3">
                                                {task.due_date ? (
                                                    <span className={overdue ? 'text-rose-600 font-semibold' : soon ? 'text-amber-600 font-semibold' : ''}>
                                                        <span className="font-semibold text-gray-800">Due</span>{' '}
                                                        {formatDate(task.due_date)}
                                                        {task.due_time && (
                                                            <span className={`font-semibold ${overdue ? 'text-rose-600' : soon ? 'text-amber-600' : 'text-purple-600'}`}>
                                                                {' '}by {formatTime(task.due_time)}
                                                            </span>
                                                        )}
                                                        {overdue && <span className="ml-1.5 text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">Overdue</span>}
                                                        {soon && !overdue && <span className="ml-1.5 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Due soon</span>}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">No deadline</span>
                                                )}
                                                <span className="text-gray-300 hidden sm:inline">|</span>
                                                <span>
                                                    <span className="font-semibold text-gray-800">Priority</span>{' '}
                                                    <span className={priorityBadge(task.priority)}>{task.priority}</span>
                                                </span>
                                                <span className="text-gray-300 hidden sm:inline">|</span>
                                                <span>
                                                    <span className="font-semibold text-gray-800">Status</span>{' '}
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>{statusLbl}</span>
                                                </span>
                                                {isAdmin && task.user?.name && (
                                                    <>
                                                        <span className="text-gray-300 hidden sm:inline">|</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-semibold text-gray-800">Assigned to</span>{' '}
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                                                <span className="w-4 h-4 rounded-full bg-violet-400 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                                                    {task.user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                                {task.user.name}
                                                            </span>
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: action button */}
                                        <div className="flex flex-col items-end justify-center gap-2 px-4 py-4 shrink-0 border-l border-gray-50">
                                            {!isAdmin && (() => {
                                                const limit = task.max_submissions;
                                                const count = task.submissions_count || 0;
                                                const atLimit = limit !== null && limit !== undefined && count >= limit;
                                                const label = count === 0 ? 'Submit' : 'Resubmit';
                                                return (
                                                    <button
                                                        onClick={() => !atLimit && setSubmitModalTask(task)}
                                                        disabled={atLimit}
                                                        title={atLimit ? `Submission limit reached (${count}/${limit})` : `${label} this task`}
                                                        className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition
                                                            ${atLimit ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'hover:opacity-90'}
                                                            ${!atLimit && overdue ? 'bg-rose-500' : !atLimit ? 'bg-blue-500' : ''}`}
                                                    >
                                                        {atLimit ? `Submitted (${count}/${limit})` : limit ? `${label} (${count}/${limit})` : label}
                                                    </button>
                                                );
                                            })()}
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => toggleStatus(task)}
                                                        className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90
                                                            ${done ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                                        {done ? '🔓 Reopen' : '✅ Close'}
                                                    </button>
                                                    <Link href={route('tasks.edit', task.id)}
                                                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition text-center">
                                                        ✏️ Edit
                                                    </Link>
                                                    <button onClick={() => deleteTask(task)} disabled={deletingId === task.id}
                                                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition disabled:opacity-50">
                                                        🗑️ Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expandable comments panel */}
                                    {expandedComments[task.id] && (
                                        <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
                                            {(task.comments || []).map(c => (
                                                <div key={c.id} className="flex gap-3">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${c.user.is_admin ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600'}`}>
                                                        {c.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-semibold text-gray-800">{c.user.name}</span>
                                                            {c.user.is_admin && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">Admin</span>}
                                                            <span className="text-xs text-gray-400">{c.created_at}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{c.body}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <form onSubmit={(e) => submitReply(e, task)} className="flex gap-2 pt-1">
                                                <input
                                                    type="text"
                                                    value={replyText[task.id] || ''}
                                                    onChange={(e) => setReplyText(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                    placeholder="Write a reply..."
                                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                />
                                                <button type="submit"
                                                    disabled={replySubmitting[task.id] || !(replyText[task.id] || '').trim()}
                                                    className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                                                    {replySubmitting[task.id] ? '...' : 'Reply'}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {submitModalTask && (
                <SubmitModal
                    task={submitModalTask}
                    projectOptions={projectOptions}
                    onClose={() => setSubmitModalTask(null)}
                />
            )}

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
