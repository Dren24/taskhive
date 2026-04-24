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

export default function TaskIndex({ tasks, isAdmin }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [deletingId, setDeletingId] = useState(null);

    const toggleStatus = (task) => {
        router.post(route('tasks.toggle', task.id), {}, { preserveScroll: true });
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
                                        <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            <span className={priorityBadge(task.priority)}>{task.priority}</span>
                                            <span className={statusBadge(task)}>{statusLabel(task)}</span>
                                            {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => toggleStatus(task)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${task.status === 'done' ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                                            {task.status === 'done' ? 'Reopen' : 'Mark Done'}
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
        </AppLayout>
    );
}
