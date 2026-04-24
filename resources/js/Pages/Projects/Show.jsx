import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

function priorityBadge(p) {
    const map = { high: 'bg-rose-100 text-rose-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-gray-100 text-gray-500' };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-500'}`;
}

export default function ProjectShow({ project, tasks }) {
    const toggleStatus = (task) => {
        router.post(route('tasks.toggle', task.id), {}, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={project.name} />
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {tasks.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">No tasks in this project.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {tasks.map(t => (
                                <div key={t.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition ${t.is_overdue ? 'bg-rose-50' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            <span className={priorityBadge(t.priority)}>{t.priority}</span>
                                            {t.due_date && <span className="text-xs text-gray-400">{t.due_date}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => toggleStatus(t)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${t.status === 'done' ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                                            {t.status === 'done' ? 'Reopen' : 'Mark Done'}
                                        </button>
                                        <Link href={route('tasks.edit', t.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                                            Edit
                                        </Link>
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
