import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

export default function TaskEdit({ task, projects, isAdmin, authId }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const canEdit = isAdmin || task.status !== 'done';

    const { data, setData, put, processing, errors } = useForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        due_date: task.due_date || '',
        project_id: task.project_id || (projects?.[0]?.id ? String(projects[0].id) : ''),
    });

    const [commentBody, setCommentBody] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

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

    return (
        <AppLayout>
            <Head title={`Edit: ${task.title}`} />
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Flash */}
                {flash.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{flash.success}</div>}
                {flash.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{flash.error}</div>}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h1 className="text-base font-bold text-gray-900 mb-5">Edit Task</h1>
                    <form onSubmit={submit} className="space-y-4">
                        {/* Status — all users can change */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                            <select value={data.status} onChange={e => setData('status', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </div>

                        {/* Admin-only fields */}
                        {canEdit && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                                    <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                                    <textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Priority</label>
                                    <div className="flex gap-2">
                                        {PRIORITIES.map(p => (
                                            <button type="button" key={p} onClick={() => setData('priority', p)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition capitalize ${data.priority === p ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Due date and project — admin only */}
                                {isAdmin && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Due Date</label>
                                            <input type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                        </div>
                                        {projects && projects.length > 0 && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Project *</label>
                                                <select value={data.project_id} onChange={e => setData('project_id', e.target.value)}
                                                    required
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        <button type="submit" disabled={processing}
                            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Comments */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">Comments ({task.comments?.length || 0})</h2>
                    <div className="space-y-3 mb-4">
                        {(task.comments || []).map(c => (
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
                        {(!task.comments || task.comments.length === 0) && (
                            <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
                        )}
                    </div>
                    <form onSubmit={submitComment} className="flex gap-2">
                        <input type="text" value={commentBody} onChange={e => setCommentBody(e.target.value)}
                            placeholder="Write a comment…"
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        <button type="submit" disabled={submittingComment || !commentBody.trim()}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            Post
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
