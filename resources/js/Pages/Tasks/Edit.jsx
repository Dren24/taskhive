import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import AttachmentUploader from '../../Components/AttachmentUploader';

const PRIORITIES = [
    { value: 'low',    label: 'Low',    icon: '🟢', activeClass: 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' },
    { value: 'medium', label: 'Medium', icon: '🟡', activeClass: 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm' },
    { value: 'high',   label: 'High',   icon: '🔴', activeClass: 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' },
];

const STATUSES = [
    { value: 'todo',        label: 'To Do',       icon: '○', activeClass: 'bg-gray-100 border-gray-400 text-gray-700 shadow-sm' },
    { value: 'in_progress', label: 'In Progress', icon: '◐', activeClass: 'bg-purple-50 border-purple-400 text-purple-700 shadow-sm' },
    { value: 'done',        label: 'Done',        icon: '●', activeClass: 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' },
];

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mime }) {
    if (mime?.startsWith('image/')) return <span className="text-lg">🖼️</span>;
    if (mime?.includes('pdf')) return <span className="text-lg">📄</span>;
    if (mime?.includes('word') || mime?.includes('document')) return <span className="text-lg">📝</span>;
    if (mime?.includes('sheet') || mime?.includes('excel')) return <span className="text-lg">📊</span>;
    return <span className="text-lg">📎</span>;
}

export default function TaskEdit({ task, projects, users, groupMembers = [], isAdmin, authId }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const canEdit = isAdmin || task.status !== 'done';

    const { data, setData, put, processing, errors } = useForm({
        title:           task.title || '',
        description:     task.description || '',
        priority:        task.priority || 'medium',
        status:          task.status || 'todo',
        due_date:        task.due_date || '',
        due_time:        task.due_time || '',
        project_id:      task.project_id || (projects?.[0]?.id ? String(projects[0].id) : ''),
        max_submissions: task.max_submissions ?? '',
        user_id:         task.user_id ? String(task.user_id) : '',
    });

    const [commentBody, setCommentBody] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pendingFiles, setPendingFiles] = useState([]);

    const submit = (e) => { e.preventDefault(); put(route('tasks.update', task.id)); };

    const submitComment = (e) => {
        e.preventDefault();
        if (!commentBody.trim()) return;
        setSubmittingComment(true);
        router.post(route('tasks.comments.store', task.id), { body: commentBody }, {
            onSuccess: () => { setCommentBody(''); setSubmittingComment(false); },
            onError: () => setSubmittingComment(false),
            preserveScroll: true,
        });
    };

    const deleteComment = (commentId) => {
        if (!confirm('Delete this comment?')) return;
        router.delete(route('tasks.comments.destroy', [task.id, commentId]), { preserveScroll: true });
    };

    const uploadFiles = () => {
        if (pendingFiles.length === 0) return;

        setUploadingFile(true);
        setUploadProgress(0);
        const formData = new FormData();
        pendingFiles.forEach(file => formData.append('files[]', file));

        router.post(route('tasks.attachments.store', task.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onProgress: (progress) => setUploadProgress(progress?.percentage ?? 0),
            onSuccess: () => setPendingFiles([]),
            onFinish: () => { setUploadingFile(false); setUploadProgress(0); },
        });
    };

    const deleteAttachment = (attachmentId) => {
        if (!confirm('Delete this attachment?')) return;
        router.delete(route('tasks.attachments.destroy', [task.id, attachmentId]), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={`Edit Task – ${task.title}`} />

            {/* Page header */}
            <div className="mb-6 flex items-center gap-3">
                <Link href={route('tasks.index')}
                    className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Edit Task</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Update task details, deadline, and assignment</p>
                </div>
            </div>

            {/* Flash messages */}
            {flash.success && (
                <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-4 py-3">
                    <span className="text-base">✅</span> {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="mb-5 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl px-4 py-3">
                    <span className="text-base">⚠️</span> {flash.error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left column: main form ─────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Task details card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Card header */}
                        <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-violet-50/60 to-purple-50/30">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-bold text-gray-800">Task Details</h2>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-5">
                            {/* Title */}
                            {isAdmin ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Task Title <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        required
                                        placeholder="e.g. Design landing page mockup"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                            hover:border-gray-300 transition bg-gray-50/50"
                                    />
                                    {errors.title && <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.title}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Task Title</label>
                                    <div className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 bg-gray-50 cursor-not-allowed select-none">
                                        {data.title}
                                    </div>

                                </div>
                            )}

                            {/* Description */}
                            {isAdmin ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={4}
                                        placeholder="Add task details, context, or instructions…"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                            hover:border-gray-300 transition bg-gray-50/50 resize-none"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                                    <div className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50 min-h-[80px] cursor-not-allowed select-none">
                                        {data.description || <span className="italic text-gray-400">No description</span>}
                                    </div>

                                </div>
                            )}

                            {/* Status — segmented buttons */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STATUSES.map(s => (
                                        <button
                                            type="button"
                                            key={s.value}
                                            onClick={() => setData('status', s.value)}
                                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition
                                                ${data.status === s.value
                                                    ? s.activeClass
                                                    : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span className="text-base">{s.icon}</span>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority — segmented buttons */}
                            {isAdmin ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Priority
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PRIORITIES.map(p => (
                                            <button
                                                type="button"
                                                key={p.value}
                                                onClick={() => setData('priority', p.value)}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold capitalize transition
                                                    ${data.priority === p.value
                                                        ? p.activeClass
                                                        : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <span>{p.icon}</span> {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
                                    <div className="grid grid-cols-3 gap-2 opacity-50 pointer-events-none">
                                        {PRIORITIES.map(p => (
                                            <div
                                                key={p.value}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold capitalize
                                                    ${data.priority === p.value ? p.activeClass : 'border-gray-100 text-gray-300'}`}
                                            >
                                                <span>{p.icon}</span> {p.label}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            )}

                            {/* Admin-only: Deadline date + time side by side */}
                            {isAdmin && canEdit && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Deadline
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] text-gray-400 mb-1">Date</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📅</span>
                                                <input
                                                    type="date"
                                                    value={data.due_date}
                                                    onChange={e => setData('due_date', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800
                                                        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                                        hover:border-gray-300 transition bg-gray-50/50"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-400 mb-1">Time <span className="text-gray-300">(optional)</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🕐</span>
                                                <input
                                                    type="time"
                                                    value={data.due_time}
                                                    onChange={e => setData('due_time', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800
                                                        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                                        hover:border-gray-300 transition bg-gray-50/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {data.due_date && (
                                        <p className="text-xs text-purple-500 font-medium mt-2">
                                            📌 Deadline: {new Date(data.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            {data.due_time && ` at ${(() => { const [h,m] = data.due_time.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; })()}`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Admin-only: Project */}
                            {isAdmin && canEdit && projects && projects.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Scope
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📁</span>
                                        <select
                                            value={data.project_id}
                                            onChange={e => setData('project_id', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-800
                                                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                                hover:border-gray-300 transition bg-gray-50/50 appearance-none"
                                        >
                                            <option value="">Global Task</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Global tasks stay on the Task Page. Folder tasks belong only to the selected project folder.</p>
                                </div>
                            )}

                            {/* Admin-only: Assigned User */}
                            {isAdmin && users && users.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Assigned User
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                                        <select
                                            value={data.user_id}
                                            onChange={e => setData('user_id', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-800
                                                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                                hover:border-gray-300 transition bg-gray-50/50 appearance-none"
                                        >
                                            <option value="">— Unassigned —</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                                    </div>
                                </div>
                            )}

                            {/* Admin-only: Max Submissions */}
                            {isAdmin && canEdit && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Max Submissions
                                        <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case tracking-normal">(blank = unlimited)</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.max_submissions}
                                            onChange={e => setData('max_submissions', e.target.value)}
                                            placeholder="e.g. 3"
                                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                                                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                                hover:border-gray-300 transition bg-gray-50/50"
                                        />
                                        <span className="text-xs text-gray-400 shrink-0">
                                            {task.submissions_count || 0} submitted so far
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Admin-only: Leader assignment for group tasks */}
                            {isAdmin && task.group_id && groupMembers.length > 0 && (
                                <div className="border border-amber-100 rounded-2xl p-4 bg-amber-50/50 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">👑</span>
                                        <label className="text-xs font-bold text-amber-800 uppercase tracking-wide">Group Task Leader</label>
                                        <span className="text-[10px] text-amber-500 font-medium px-2 py-0.5 bg-amber-100 rounded-full">Group Task</span>
                                    </div>

                                    {/* Submission mode */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Submission Mode</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'manual', label: '👑 Manual' },
                                                { value: 'voting', label: '🗳️ Voting' },
                                            ].map(m => (
                                                <button
                                                    key={m.value}
                                                    type="button"
                                                    onClick={() => router.post(route('tasks.assign-leader', task.id), {
                                                        submission_mode: m.value,
                                                        leader_user_id: m.value === 'voting' ? null : (task.leader?.id ?? null),
                                                    }, { preserveScroll: true })}
                                                    className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition
                                                        ${(task.submission_mode || 'manual') === m.value ? 'border-amber-500 bg-amber-100 text-amber-800' : 'border-gray-100 text-gray-500 hover:border-amber-200'}`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Leader picker (manual mode only) */}
                                    {(task.submission_mode || 'manual') === 'manual' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Designated Submitter</label>
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 rounded-lg px-2 py-1.5">
                                                    <input
                                                        type="radio"
                                                        name="leader"
                                                        value=""
                                                        checked={!task.leader}
                                                        onChange={() => router.post(route('tasks.assign-leader', task.id), { leader_user_id: null, submission_mode: 'manual' }, { preserveScroll: true })}
                                                        className="accent-amber-500"
                                                    />
                                                    <span className="text-sm text-gray-500 italic">— No leader assigned —</span>
                                                </label>
                                                {groupMembers.map(m => (
                                                    <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 rounded-lg px-2 py-1.5">
                                                        <input
                                                            type="radio"
                                                            name="leader"
                                                            value={m.id}
                                                            checked={task.leader?.id === m.id}
                                                            onChange={() => router.post(route('tasks.assign-leader', task.id), { leader_user_id: m.id, submission_mode: 'manual' }, { preserveScroll: true })}
                                                            className="accent-amber-500"
                                                        />
                                                        <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {m.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <span className="text-sm text-gray-700">{m.name}</span>
                                                        {task.leader?.id === m.id && <span className="ml-auto text-xs text-amber-600 font-semibold">👑 Leader</span>}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(task.submission_mode || 'manual') === 'voting' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Current Votes</label>
                                            <div className="space-y-1">
                                                {groupMembers.map(m => {
                                                    const count = task.vote_counts?.[m.id] || 0;
                                                    return (
                                                        <div key={m.id} className="flex items-center gap-2 text-sm">
                                                            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                                {m.name.charAt(0).toUpperCase()}
                                                            </span>
                                                            <span className="text-gray-700 flex-1">{m.name}</span>
                                                            <span className="text-xs font-semibold text-amber-700">{count} vote{count !== 1 ? 's' : ''}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => router.post(route('tasks.assign-leader', task.id), { leader_user_id: m.id, submission_mode: 'voting' }, { preserveScroll: true })}
                                                                className="text-xs px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                                                            >
                                                                Promote
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Save button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 text-sm font-bold text-white rounded-2xl shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)' }}
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Saving…
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Changes
                                        </span>
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2">
                                    Changes will update the Task Board and Calendar automatically.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── Right column: attachments + comments ───────────── */}
                <div className="space-y-5">

                    {/* Attachments card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-violet-50/40 to-purple-50/20">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-bold text-gray-800">Attachments</h2>
                                <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                                    {task.attachments?.length || 0}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-2">
                            {(task.attachments || []).map(a => (
                                <div key={a.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-100 hover:bg-purple-50/20 transition group">
                                    <FileIcon mime={a.mime_type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{a.original_name}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(a.size)} · {a.user.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                        {a.preview_url && (
                                            <a href={a.preview_url} target="_blank" rel="noreferrer"
                                                className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition" title="Preview">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </a>
                                        )}
                                        <a href={a.download_url} download
                                            className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-100 transition" title="Download">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </a>
                                        {(isAdmin || a.user.id === authId) && (
                                            <button onClick={() => deleteAttachment(a.id)}
                                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition" title="Delete">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!task.attachments || task.attachments.length === 0) && (
                                <div className="text-center py-6">
                                    <span className="text-2xl">📂</span>
                                    <p className="text-xs text-gray-400 mt-1">No attachments yet</p>
                                </div>
                            )}

                            <AttachmentUploader
                                files={pendingFiles}
                                onAdd={(selectedFiles) => setPendingFiles(prev => [...prev, ...selectedFiles])}
                                onRemove={(index) => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                                uploading={uploadingFile}
                                progress={uploadProgress}
                                title="Add Attachments"
                            />
                            {pendingFiles.length > 0 && (
                                <button
                                    type="button"
                                    onClick={uploadFiles}
                                    disabled={uploadingFile}
                                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:opacity-90 disabled:opacity-60"
                                >
                                    {uploadingFile ? `Uploading ${uploadProgress || 0}%` : `Upload ${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'}`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* User submissions card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-violet-50/40 to-purple-50/20">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V18a2 2 0 002 2h12a2 2 0 002-2v-1.5M12 4v11m0 0l-4-4m4 4l4-4" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-bold text-gray-800">Submissions</h2>
                                <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                                    {task.submissions?.length || 0}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {(task.submissions || []).map(submission => (
                                <div key={submission.id} className="rounded-xl border border-purple-100 bg-purple-50/30 p-3">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">Attempt #{submission.attempt}</p>
                                            <p className="text-[11px] text-gray-400">{submission.user?.name} · {submission.created_at}</p>
                                        </div>
                                    </div>
                                    {submission.comment && (
                                        <p className="mb-3 rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-gray-600">{submission.comment}</p>
                                    )}
                                    {(submission.files || []).length > 0 ? (
                                        <div className="grid gap-2">
                                            {submission.files.map(file => (
                                                <div key={file.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2">
                                                    {file.preview_url && file.mime_type?.startsWith('image/') ? (
                                                        <img src={file.preview_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <FileIcon mime={file.mime_type} />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-gray-800">{file.original_name}</p>
                                                        <p className="text-[11px] text-gray-400">{formatSize(file.size)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {file.preview_url && (
                                                            <a href={file.preview_url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-50" title="Preview">
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                        <a href={file.download_url} download className="rounded-lg p-1.5 text-purple-500 hover:bg-purple-50" title="Download">
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : submission.original_name ? (
                                        <a href={submission.download_url} download className="text-xs font-semibold text-purple-600 hover:underline">
                                            {submission.original_name}
                                        </a>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No files attached to this submission.</p>
                                    )}
                                </div>
                            ))}

                            {(!task.submissions || task.submissions.length === 0) && (
                                <div className="text-center py-6">
                                    <span className="text-2xl">📥</span>
                                    <p className="text-xs text-gray-400 mt-1">No submissions yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-violet-50/40 to-purple-50/20">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-bold text-gray-800">Comments</h2>
                                <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                                    {task.comments?.length || 0}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {(task.comments || []).map(c => (
                                <div key={c.id}
                                    className={`rounded-xl p-3 border ${c.user?.is_admin
                                        ? 'bg-purple-50/60 border-purple-100'
                                        : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                                                ${c.user?.is_admin ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {c.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700">{c.user?.name}</span>
                                            {c.user?.is_admin && (
                                                <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 text-purple-700 uppercase tracking-wide">Admin</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-gray-400">{c.created_at}</span>
                                            {(isAdmin || c.user?.id === authId) && (
                                                <button onClick={() => deleteComment(c.id)}
                                                    className="text-[11px] text-rose-400 hover:text-rose-600 transition">
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">{c.body}</p>
                                </div>
                            ))}

                            {(!task.comments || task.comments.length === 0) && (
                                <div className="text-center py-5">
                                    <span className="text-2xl">💬</span>
                                    <p className="text-xs text-gray-400 mt-1">No comments yet</p>
                                </div>
                            )}

                            <form onSubmit={submitComment} className="flex gap-2 pt-1">
                                <input
                                    type="text"
                                    value={commentBody}
                                    onChange={e => setCommentBody(e.target.value)}
                                    placeholder="Write a comment…"
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                                        hover:border-gray-300 transition bg-gray-50"
                                />
                                <button
                                    type="submit"
                                    disabled={submittingComment || !commentBody.trim()}
                                    className="px-3 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition disabled:opacity-40 shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
                                >
                                    Post
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
