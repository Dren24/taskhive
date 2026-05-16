import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import AppLayout from '../../Layouts/AppLayout';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

function emptyRow(authId) {
    return { title: '', description: '', priority: 'medium', status: 'todo', due_date: '', due_time: '', project_id: '', assign_to: authId || '', max_submissions: '' };
}

export default function TaskCreate({ projects, users, projectUsers, isAdmin, authId }) {
    const [rows, setRows] = useState([{ ...emptyRow(authId), project_id: '' }]);
    const [files, setFiles] = useState([[]]);   // array of file arrays, one per row
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRefs = useRef([]);

    const updateRow = (i, field, value) => {
        setRows(prev => prev.map((r, idx) => {
            if (idx !== i) return r;
            const updated = { ...r, [field]: value };
            // When project changes, reset assign_to so stale user is cleared
            if (field === 'project_id') updated.assign_to = '';
            return updated;
        }));
    };

    const addRow = () => {
        setRows(prev => [...prev, { ...emptyRow(authId), project_id: '' }]);
        setFiles(prev => [...prev, []]);
    };

    const removeRow = (i) => {
        setRows(prev => prev.filter((_, idx) => idx !== i));
        setFiles(prev => prev.filter((_, idx) => idx !== i));
    };

    const addFiles = (i, newFiles) => {
        setFiles(prev => prev.map((arr, idx) => idx === i ? [...arr, ...Array.from(newFiles)] : arr));
        if (fileInputRefs.current[i]) fileInputRefs.current[i].value = '';
    };

    const removeFile = (rowIdx, fileIdx) => {
        setFiles(prev => prev.map((arr, idx) => idx === rowIdx ? arr.filter((_, fi) => fi !== fileIdx) : arr));
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        const formData = new FormData();
        rows.forEach((row, i) => {
            Object.entries(row).forEach(([key, val]) => {
                formData.append(`tasks[${i}][${key}]`, val ?? '');
            });
            (files[i] || []).forEach(file => {
                formData.append(`files[${i}][]`, file);
            });
        });
        router.post(route('tasks.store'), formData, {
            forceFormData: true,
            onError: (errs) => { setErrors(errs); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout>
            <Head title="Create Tasks" />
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="mb-5">
                    <h1 className="text-lg font-bold text-gray-900">Create Tasks</h1>
                    <p className="text-sm text-gray-500">Add one or more tasks at once.</p>
                </div>

                <form onSubmit={submit}>
                    <div className="space-y-4">
                        {rows.map((row, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-gray-500">Task {i + 1}</span>
                                    {rows.length > 1 && (
                                        <button type="button" onClick={() => removeRow(i)}
                                            className="text-xs text-rose-500 hover:text-rose-700">Remove</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title *</label>
                                        <input type="text" value={row.title} onChange={e => updateRow(i, 'title', e.target.value)}
                                            required placeholder="Task title"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                                        <textarea value={row.description} onChange={e => updateRow(i, 'description', e.target.value)}
                                            rows={2} placeholder="Optional description"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Priority *</label>
                                        <div className="flex gap-2">
                                            {PRIORITIES.map(p => (
                                                <button type="button" key={p} onClick={() => updateRow(i, 'priority', p)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition capitalize ${row.priority === p ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status *</label>
                                        <select value={row.status} onChange={e => updateRow(i, 'status', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Due Date *</label>
                                        <input type="date" value={row.due_date} onChange={e => updateRow(i, 'due_date', e.target.value)}
                                            required
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Deadline Time <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input type="time" value={row.due_time} onChange={e => updateRow(i, 'due_time', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                    </div>
                                    {projects && projects.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Project *</label>
                                            <select value={row.project_id} onChange={e => updateRow(i, 'project_id', e.target.value)}
                                                required
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                                                <option value="">Select project</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {isAdmin && users && users.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign To *</label>
                                            <select value={row.assign_to} onChange={e => updateRow(i, 'assign_to', e.target.value)}
                                                required
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                                                <option value="">Select user</option>
                                                {(row.project_id && projectUsers ? (projectUsers[row.project_id] || []) : [])
                                                    .map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            {!row.project_id && (
                                                <p className="text-xs text-gray-400 mt-1">Select a project first to show folder members.</p>
                                            )}
                                            {row.project_id && projectUsers && projectUsers[row.project_id]?.length === 0 && (
                                                <p className="text-xs text-amber-500 mt-1">No users assigned to this project yet.</p>
                                            )}
                                        </div>
                                    )}
                                    {isAdmin && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                                                Max Submissions <span className="text-gray-400 font-normal">(optional — leave blank for unlimited)</span>
                                            </label>
                                            <input type="number" min="1" value={row.max_submissions}
                                                onChange={e => updateRow(i, 'max_submissions', e.target.value)}
                                                placeholder="e.g. 3"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                        </div>
                                    )}

                                    {/* File attachments */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Attachments <span className="text-gray-400 font-normal">(optional)</span></label>
                                        {(files[i] || []).length > 0 && (
                                            <div className="space-y-1.5 mb-2">
                                                {(files[i] || []).map((f, fi) => (
                                                    <div key={fi} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                                                        <span className="text-sm">📄</span>
                                                        <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
                                                        <span className="text-xs text-gray-400">{formatSize(f.size)}</span>
                                                        <button type="button" onClick={() => removeFile(i, fi)}
                                                            className="text-xs text-rose-400 hover:text-rose-600">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 cursor-pointer transition">
                                            + Add Files
                                            <input
                                                ref={el => fileInputRefs.current[i] = el}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={e => addFiles(i, e.target.files)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {errors && Object.values(errors).length > 0 && (
                        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                            {Object.values(errors).map((e, i) => <p key={i} className="text-rose-600 text-xs">{e}</p>)}
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-5">
                        <button type="button" onClick={addRow}
                            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-purple-200 text-purple-600 hover:bg-purple-50 transition">
                            + Add Another Task
                        </button>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                            {processing ? 'Saving…' : `Save ${rows.length > 1 ? `${rows.length} Tasks` : 'Task'}`}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
