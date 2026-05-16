import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';

const COLORS = [
    { hex: '#8B5CF6', name: 'Violet' },
    { hex: '#7C3AED', name: 'Purple' },
    { hex: '#6366F1', name: 'Indigo' },
    { hex: '#2563EB', name: 'Blue' },
    { hex: '#0891B2', name: 'Cyan' },
    { hex: '#059669', name: 'Emerald' },
    { hex: '#D97706', name: 'Amber' },
    { hex: '#DC2626', name: 'Red' },
    { hex: '#DB2777', name: 'Pink' },
    { hex: '#64748B', name: 'Slate' },
];

function FolderIcon({ color = '#8B5CF6', size = 'w-10 h-10' }) {
    return (
        <div className={`${size} rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}
            style={{ backgroundColor: color + '20' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
        </div>
    );
}

function Modal({ show, onClose, children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        if (show) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [show]);

    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.15s ease' }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-gray-100`}
                style={{ animation: 'scaleIn 0.18s ease' }}>
                {children}
            </div>
        </div>
    );
}

function ColorPicker({ value, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
                <button type="button" key={c.hex} onClick={() => onChange(c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${value === c.hex ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`}
                    style={{ backgroundColor: c.hex }} />
            ))}
        </div>
    );
}

function initials(name) {
    return (name || '?').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

const ACCESS_LABELS = {
    viewer: 'Viewer',
    editor: 'Editor',
    manager: 'Manager',
};

/* ── 3-dot dropdown per card ──────────────────────────────────────── */
function CardMenu({ onEdit, onDelete, onManageMembers, onAddUser }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Options"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20"
                    style={{ animation: 'scaleIn 0.12s ease' }}>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onEdit(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Folder
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onManageMembers(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage Members
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onAddUser(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3M12 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0" />
                        </svg>
                        Add User
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Folder
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function ProjectsIndex({ projects, users = [], isAdmin }) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('latest');
    const [showCreate, setShowCreate] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [deleteProject, setDeleteProject] = useState(null);
    const [memberProject, setMemberProject] = useState(null);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    /* Create form */
    const createForm = useForm({ name: '', color: '#8B5CF6', user_ids: [] });

    /* Edit form */
    const editForm = useForm({ name: '', color: '#8B5CF6' });

    const memberForm = useForm({ user_id: '', access_level: 'editor' });

    const toggleUser = (userId) => {
        const id = String(userId);
        const next = selectedUserIds.includes(id)
            ? selectedUserIds.filter(x => x !== id)
            : [...selectedUserIds, id];
        setSelectedUserIds(next);
        createForm.setData('user_ids', next);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        if (createForm.data.user_ids.length === 0) return;
        createForm.post(route('projects.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setSelectedUserIds([]);
                setShowCreate(false);
            },
        });
    };

    const openEdit = (p) => {
        setEditProject(p);
        editForm.setData({ name: p.name, color: p.color || '#8B5CF6' });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.patch(route('projects.update', editProject.id), {
            preserveScroll: true,
            onSuccess: () => setEditProject(null),
        });
    };

    const confirmDelete = () => {
        setDeleting(true);
        router.delete(route('projects.destroy', deleteProject.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setDeleteProject(null); },
        });
    };

    const openMembers = (project, startAdd = false) => {
        setMemberProject(project);
        setAddUserOpen(startAdd);
        memberForm.setData({ user_id: '', access_level: 'editor' });
        memberForm.clearErrors();
    };

    const availableUsers = useMemo(() => {
        if (!memberProject) return [];
        const memberIds = new Set((memberProject.members || []).map(m => Number(m.id)));
        return users.filter(u => !memberIds.has(Number(u.id)));
    }, [memberProject, users]);

    const addMember = (e) => {
        e.preventDefault();
        if (!memberProject || !memberForm.data.user_id) return;
        memberForm.post(route('projects.members.store', memberProject.id), {
            preserveScroll: true,
            onSuccess: () => {
                memberForm.setData({ user_id: '', access_level: 'editor' });
                setAddUserOpen(false);
                setMemberProject(null);
            },
        });
    };

    const updateMemberAccess = (member, accessLevel) => {
        if (!memberProject) return;
        router.patch(route('projects.members.update', [memberProject.id, member.id]), {
            access_level: accessLevel,
        }, { preserveScroll: true });
    };

    const removeMember = (member) => {
        if (!memberProject || !confirm(`Remove ${member.name} from "${memberProject.name}"?`)) return;
        router.delete(route('projects.members.destroy', [memberProject.id, member.id]), {
            preserveScroll: true,
            onSuccess: () => setMemberProject(null),
        });
    };

    /* Filter + sort */
    const filtered = useMemo(() => {
        let list = [...projects];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q));
        }
        if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sort === 'tasks') list.sort((a, b) => b.tasks_count - a.tasks_count);
        // 'latest' = server order (already latest)
        return list;
    }, [projects, search, sort]);

    return (
        <AppLayout>
            <Head title="Projects" />

            {/* Keyframe styles */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
                .card-hover { transition: box-shadow 0.2s ease, transform 0.2s ease; }
                .card-hover:hover { box-shadow: 0 8px 30px rgba(139,92,246,0.12); transform: translateY(-2px); }
                .glow-btn:hover { box-shadow: 0 0 20px rgba(139,92,246,0.4); }
            `}</style>

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {projects.length} project folder{projects.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="glow-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
                        </button>
                    )}
                </div>

                {/* ── Search + Sort ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search projects…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                        />
                    </div>
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition cursor-pointer"
                    >
                        <option value="latest">Sort: Latest</option>
                        <option value="name">Sort: Name A–Z</option>
                        <option value="tasks">Sort: Most Tasks</option>
                    </select>
                </div>

                {/* ── Grid ── */}
                {filtered.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>
                            <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mb-1">
                            {search ? 'No projects match your search' : 'No projects yet'}
                        </h3>
                        <p className="text-sm text-gray-400 max-w-xs">
                            {search ? 'Try a different search term.' : isAdmin ? 'Create your first project to get started.' : 'No projects have been assigned to you yet.'}
                        </p>
                        {isAdmin && !search && (
                            <button onClick={() => setShowCreate(true)}
                                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow transition glow-btn"
                                style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                                + Create Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(p => (
                            <Link key={p.id} href={route('projects.show', p.id)}
                                className="group relative bg-white rounded-2xl border border-gray-100 p-5 card-hover block">

                                {/* 3-dot menu — top right */}
                                {isAdmin && (
                                    <div className="absolute top-4 right-4">
                                        <CardMenu
                                            onEdit={() => openEdit(p)}
                                            onManageMembers={() => openMembers(p)}
                                            onAddUser={() => openMembers(p, true)}
                                            onDelete={() => setDeleteProject(p)}
                                        />
                                    </div>
                                )}

                                {/* Folder icon + title */}
                                <div className="flex items-start gap-3 mb-4 pr-6">
                                    <FolderIcon color={p.color || '#8B5CF6'} />
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition truncate leading-snug">
                                            {p.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {p.tasks_count} task{p.tasks_count !== 1 ? 's' : ''} · {(p.members || []).length} member{(p.members || []).length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[11px] text-gray-400 font-medium">Progress</span>
                                        <span className="text-[11px] font-semibold" style={{ color: p.color || '#8B5CF6' }}>
                                            {p.tasks_count === 0 ? '—' : `${p.tasks_count} task${p.tasks_count !== 1 ? 's' : ''}`}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all"
                                            style={{
                                                width: p.tasks_count > 0 ? '40%' : '0%',
                                                background: `linear-gradient(90deg, ${p.color || '#8B5CF6'}, ${p.color || '#8B5CF6'}80)`
                                            }} />
                                    </div>
                                </div>

                                {/* Member avatars */}
                                {p.members && p.members.length > 0 && (
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                        <div className="flex -space-x-1.5">
                                            {p.members.slice(0, 5).map(m => (
                                                <div key={m.id} title={m.name}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
                                                    style={{ backgroundColor: (p.color || '#8B5CF6') + '30', color: p.color || '#8B5CF6' }}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </div>
                                            ))}
                                            {p.members.length > 5 && (
                                                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                                                    +{p.members.length - 5}
                                                </div>
                                            )}
                                        </div>
                                        {p.members.length > 1 && (
                                            <span className="text-[11px] text-gray-400 font-medium">👥 Group</span>
                                        )}
                                    </div>
                                )}

                                {/* Bottom color accent bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: `linear-gradient(90deg, ${p.color || '#8B5CF6'}, transparent)` }} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            <Modal show={showCreate} onClose={() => !createForm.processing && setShowCreate(false)}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Create Project</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Set up a new project folder</p>
                    </div>
                    <button onClick={() => setShowCreate(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={submitCreate} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Project Name *</label>
                        <input type="text" value={createForm.data.name}
                            onChange={e => createForm.setData('name', e.target.value)}
                            required placeholder="e.g. Website Redesign"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition" />
                        {createForm.errors.name && <p className="text-red-500 text-xs mt-1">{createForm.errors.name}</p>}
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">Color</label>
                        <ColorPicker value={createForm.data.color} onChange={v => createForm.setData('color', v)} />
                    </div>

                    {/* Members */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            Assign Members *
                            <span className="font-normal text-gray-400 ml-1">(select one or more)</span>
                        </label>
                        {users.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No users available.</p>
                        ) : (
                            <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-44 overflow-y-auto">
                                {users.map(u => {
                                    const checked = selectedUserIds.includes(String(u.id));
                                    return (
                                        <label key={u.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${checked ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                                            <input type="checkbox" checked={checked} onChange={() => toggleUser(u.id)}
                                                className="w-4 h-4 accent-purple-600 rounded" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                            </div>
                                            {checked && <span className="text-purple-500 text-xs font-bold">✓</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        {selectedUserIds.length > 0 && (
                            <p className="text-xs text-purple-600 mt-1.5 font-medium">
                                {selectedUserIds.length} member{selectedUserIds.length !== 1 ? 's' : ''} selected
                            </p>
                        )}
                        {createForm.errors.user_ids && <p className="text-red-500 text-xs mt-1">{createForm.errors.user_ids}</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setShowCreate(false)}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit"
                            disabled={createForm.processing || selectedUserIds.length === 0}
                            className="px-5 py-2 text-sm font-semibold text-white rounded-xl shadow transition hover:opacity-90 disabled:opacity-50 glow-btn"
                            style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                            {createForm.processing ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal show={!!editProject} onClose={() => !editForm.processing && setEditProject(null)}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Edit Project</h2>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{editProject?.name}</p>
                    </div>
                    <button onClick={() => setEditProject(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={submitEdit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Project Name *</label>
                        <input type="text" value={editForm.data.name}
                            onChange={e => editForm.setData('name', e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition" />
                        {editForm.errors.name && <p className="text-red-500 text-xs mt-1">{editForm.errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">Color</label>
                        <ColorPicker value={editForm.data.color} onChange={v => editForm.setData('color', v)} />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setEditProject(null)}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={editForm.processing}
                            className="px-5 py-2 text-sm font-semibold text-white rounded-xl shadow transition hover:opacity-90 disabled:opacity-50 glow-btn"
                            style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                            {editForm.processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Member Management Modal ── */}
            <Modal show={!!memberProject} onClose={() => setMemberProject(null)} maxWidth="max-w-3xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Manage Members</h2>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{memberProject?.name}</p>
                    </div>
                    <button onClick={() => setMemberProject(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {(memberProject?.members || []).length} folder member{(memberProject?.members || []).length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-400">Only these users appear in task assignment for this folder.</p>
                        </div>
                        <button type="button" onClick={() => setAddUserOpen(v => !v)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl text-white shadow transition hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                            + Add User
                        </button>
                    </div>

                    {addUserOpen && (
                        <form onSubmit={addMember} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
                            <select
                                value={memberForm.data.user_id}
                                onChange={e => memberForm.setData('user_id', e.target.value)}
                                required
                                className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                                <option value="">{availableUsers.length ? 'Select workspace user' : 'No users available'}</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} · {u.email}</option>
                                ))}
                            </select>
                            <select
                                value={memberForm.data.access_level}
                                onChange={e => memberForm.setData('access_level', e.target.value)}
                                className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                                {Object.entries(ACCESS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <button type="submit" disabled={memberForm.processing || !memberForm.data.user_id}
                                className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition disabled:opacity-50">
                                Add
                            </button>
                            {memberForm.errors.user_id && <p className="text-xs text-rose-600 sm:col-span-3">{memberForm.errors.user_id}</p>}
                        </form>
                    )}

                    <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                        {(memberProject?.members || []).length === 0 ? (
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 py-10 text-center">
                                <p className="text-sm font-semibold text-gray-700">No members yet</p>
                                <p className="text-xs text-gray-400 mt-1">Add users before assigning tasks in this folder.</p>
                            </div>
                        ) : (
                            memberProject.members.map(member => (
                                <div key={member.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center text-xs font-bold">
                                                {initials(member.name)}
                                            </div>
                                            <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-white ${member.online ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold capitalize">{member.role}</span>
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${member.online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {member.online ? 'Online' : member.last_active}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                            <p className="text-[11px] text-purple-600 mt-1">
                                                {(member.permissions || []).map(p => p.replace('_', ' ')).join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <select
                                            value={member.access_level || 'editor'}
                                            onChange={e => updateMemberAccess(member, e.target.value)}
                                            className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                                            {Object.entries(ACCESS_LABELS).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => removeMember(member)}
                                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal show={!!deleteProject} onClose={() => !deleting && setDeleteProject(null)} maxWidth="max-w-sm">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 mb-1">Delete Project?</h2>
                    <p className="text-sm text-gray-500 mb-1">
                        Are you sure you want to delete <span className="font-semibold text-gray-800">"{deleteProject?.name}"</span>?
                    </p>
                    <p className="text-xs text-gray-400 mb-6">Tasks will be moved to Backlog. This action cannot be undone.</p>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => setDeleteProject(null)} disabled={deleting}
                            className="px-5 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={confirmDelete} disabled={deleting}
                            className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 shadow transition disabled:opacity-50">
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
