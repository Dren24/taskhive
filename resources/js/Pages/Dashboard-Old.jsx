import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '../Layouts/AppLayout';

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
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-500'}`;
}

function priorityIcon(p) {
    if (p === 'high') return '🔴';
    if (p === 'medium') return '🟡';
    return '🟢';
}

function statusBadge(t) {
    if (t.is_overdue) return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-600';
    const map = { done: 'bg-emerald-100 text-emerald-700', in_progress: 'bg-purple-100 text-purple-700', todo: 'bg-gray-100 text-gray-500' };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[t.status] || 'bg-gray-100 text-gray-500'}`;
}

function statusLabel(t) {
    if (t.is_overdue) return 'Overdue';
    return { done: 'Done', in_progress: 'In Progress', todo: 'Todo' }[t.status] || t.status;
}

function statusIcon(t) {
    if (t.is_overdue) return '⚠️';
    return { done: '✅', in_progress: '🔄', todo: '⏳' }[t.status] || '📌';
}

function buildCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

function heatClass(count) {
    if (!count) return '';
    if (count <= 1) return 'bg-purple-50';
    if (count <= 3) return 'bg-purple-100';
    if (count <= 6) return 'bg-purple-200';
    return 'bg-purple-300';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Task popup for calendar cell ─────────────────────────────────── */
function TaskPopup({ tasks, onClose, anchorRef }) {
    const popupRef = useRef(null);

    useEffect(() => {
        function handle(e) {
            if (popupRef.current && !popupRef.current.contains(e.target) &&
                anchorRef.current && !anchorRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handle);
        document.addEventListener('touchstart', handle);
        return () => {
            document.removeEventListener('mousedown', handle);
            document.removeEventListener('touchstart', handle);
        };
    }, [onClose, anchorRef]);

    return (
        <div ref={popupRef}
            className="absolute z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 animate-popup"
            style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
                <div className="w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 mx-auto mt-1"></div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {tasks.length} Task{tasks.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
                {tasks.map(t => (
                    <Link key={t.id} href={route('tasks.edit', t.id)} onClick={onClose}
                        className="block p-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition group">
                        <div className="flex items-start gap-2">
                            <span className="text-base mt-0.5 shrink-0">{statusIcon(t)}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate group-hover:text-purple-700 ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {t.title}
                                </p>
                                {t.description && <p className="text-xs text-gray-400 truncate mt-0.5">{t.description}</p>}
                                {t.project_name && <p className="text-xs text-gray-400 mt-0.5">📁 {t.project_name}</p>}
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className={priorityBadge(t.priority)}>{priorityIcon(t.priority)} {t.priority}</span>
                                    <span className={statusBadge(t)}>{statusLabel(t)}</span>
                                </div>
                                {t.due_date && (
                                    <p className={`text-xs font-semibold mt-1.5 ${t.is_overdue ? 'text-rose-500' : 'text-purple-500'}`}>
                                        📅 {formatDate(t.due_date)}{t.due_time ? ` – ${formatTime(t.due_time)}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ── Calendar day cell ─────────────────────────────────────────────── */
function CalendarCell({ day, isToday, tasks, selected, onSelect, activityCount }) {
    const cellRef = useRef(null);
    const hasTasks = tasks && tasks.length > 0;
    const isSelectable = hasTasks || (activityCount && activityCount > 0);
    const heat = heatClass(activityCount);

    return (
        <div ref={cellRef} className="relative">
            <button
                onClick={() => isSelectable && onSelect(day, cellRef)}
                className={`w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs transition
                    ${!day ? '' : isSelectable ? 'hover:bg-purple-50 cursor-pointer' : 'cursor-default'}
                    ${heat}
                    ${selected ? 'ring-2 ring-purple-300 bg-purple-50' : ''}`}
            >
                {day && (
                    <>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${isToday ? 'text-white font-bold' : 'text-gray-700'}`}
                            style={isToday ? { background: 'linear-gradient(135deg,#7c3aed,#9333ea)' } : {}}>
                            {day}
                        </span>
                        {hasTasks && (
                            <div className="flex gap-0.5 mt-0.5 justify-center">
                                {tasks.slice(0, 3).map((t, i) => (
                                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${
                                        t.is_overdue ? 'bg-rose-500' :
                                        t.priority === 'high' ? 'bg-rose-400' :
                                        t.priority === 'medium' ? 'bg-amber-400' : 'bg-purple-400'
                                    }`}></span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </button>
            {selected && hasTasks && (
                <TaskPopup tasks={tasks} onClose={() => onSelect(null)} anchorRef={cellRef} />
            )}
        </div>
    );
}

/* ── Calendar panel (shared for both admin and regular users) ─────── */
function CalendarPanel({ calendarTasks, activityLogs = [] }) {
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(null);

    const cells = buildCalendar(calYear, calMonth);

    const tasksByDay = {};
    (calendarTasks || []).forEach(t => {
        if (!t.due_date) return;
        const d = new Date(t.due_date + 'T00:00:00');
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
            const day = d.getDate();
            if (!tasksByDay[day]) tasksByDay[day] = [];
            tasksByDay[day].push(t);
        }
    });

    const activityByDay = {};
    (activityLogs || []).forEach(log => {
        if (!log?.date) return;
        const d = new Date(log.date + 'T00:00:00');
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
            const day = d.getDate();
            activityByDay[day] = (activityByDay[day] || 0) + 1;
        }
    });

    const prevMonth = () => {
        setSelectedDay(null);
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        setSelectedDay(null);
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };
    const handleDaySelect = (day) => setSelectedDay(prev => prev === day ? null : day);

    const selectedDate = selectedDay
        ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;
    const dayLogs = selectedDate
        ? (activityLogs || []).filter(l => l.date === selectedDate)
        : [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-bold text-gray-800">{MONTHS[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="flex items-center gap-3 mb-3 px-1">
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>High</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Medium</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>Low</span>
            </div>
            <div className="grid grid-cols-7 text-center mb-2">
                {DAYS.map(d => <span key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    const isToday = day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
                    return (
                        <CalendarCell key={i} day={day} isToday={isToday}
                            tasks={day ? (tasksByDay[day] || null) : null}
                            selected={selectedDay === day}
                            activityCount={day ? (activityByDay[day] || 0) : 0}
                            onSelect={handleDaySelect} />
                    );
                })}
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Daily Activity Logs</h3>
                    {selectedDate && (
                        <span className="text-xs text-gray-400">{selectedDate}</span>
                    )}
                </div>
                {!selectedDate ? (
                    <p className="text-xs text-gray-400">Select a date to review system activity.</p>
                ) : dayLogs.length === 0 ? (
                    <p className="text-xs text-gray-400">No activity recorded for this day.</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {dayLogs.map(log => (
                            <div key={log.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                    {log.type?.includes('project') ? '📁'
                                        : log.type?.includes('submission') ? '📤'
                                            : log.type?.includes('file') ? '📎'
                                                : log.type?.includes('comment') ? '💬'
                                                    : '✅'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-700">
                                        <span className="font-semibold text-gray-900">{log.user_name}</span>{' '}
                                        <span className="text-gray-500">· {log.time}</span>
                                    </p>
                                    <p className="text-xs text-gray-800 font-medium truncate">{log.title}</p>
                                    {log.meta && <p className="text-[11px] text-gray-400 truncate">{log.meta}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Recent tasks panel (regular user right column) ────────────────── */
function RecentTasksPanel({ tasks }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Recent Tasks</h2>
            {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.slice(0, 8).map(t => {
                        const now = new Date();
                        const due = t.due_date ? new Date(t.due_date + 'T' + (t.due_time || '23:59') + ':00') : null;
                        const hoursLeft = due ? (due - now) / 36e5 : null;
                        const dueSoon = !t.is_overdue && hoursLeft !== null && hoursLeft >= 0 && hoursLeft <= 48;

                        return (
                            <Link key={t.id} href={route('tasks.edit', t.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition hover:shadow-sm
                                    ${t.is_overdue ? 'border-rose-200 bg-rose-50 hover:border-rose-300' :
                                      dueSoon ? 'border-amber-200 bg-amber-50 hover:border-amber-300' :
                                      t.status === 'done' ? 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-200' :
                                      'border-gray-100 bg-gray-50 hover:border-purple-200'}`}>
                                <div className={`w-1 self-stretch rounded-full shrink-0
                                    ${t.is_overdue ? 'bg-rose-400' : dueSoon ? 'bg-amber-400' : t.status === 'done' ? 'bg-emerald-400' : t.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${t.status === 'done' ? 'line-through text-gray-400' : t.is_overdue ? 'text-rose-700' : 'text-gray-800'}`}>
                                        {t.status === 'done' && '✅ '}{t.is_overdue && '⚠️ '}{dueSoon && !t.is_overdue && '⏰ '}{t.title}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        <span className={priorityBadge(t.priority)}>{t.priority}</span>
                                        <span className={statusBadge(t)}>{statusLabel(t)}</span>
                                        {dueSoon && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Due soon</span>}
                                    </div>
                                    {t.due_date && (
                                        <p className={`text-xs mt-1 font-medium ${t.is_overdue ? 'text-rose-500 font-semibold' : dueSoon ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                                            {formatDate(t.due_date)}{t.due_time ? ` • ${formatTime(t.due_time)}` : ''}
                                        </p>
                                    )}
                                </div>
                                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-gray-400 text-center py-8">No tasks yet.</p>
            )}
        </div>
    );
}

/* ── Admin: activity feed + user intelligence right panel ───────────── */
const ACTION_STYLES = {
    task_created:   { label: 'Task Created', cls: 'bg-emerald-100 text-emerald-700' },
    task_updated:   { label: 'Task Updated', cls: 'bg-purple-100 text-purple-700' },
    task_completed: { label: 'Task Completed', cls: 'bg-blue-100 text-blue-700' },
    submission:     { label: 'Submission', cls: 'bg-sky-100 text-sky-700' },
    file_upload:    { label: 'File Upload', cls: 'bg-amber-100 text-amber-700' },
    task_comment:   { label: 'Task Comment', cls: 'bg-indigo-100 text-indigo-700' },
    project_comment:{ label: 'Project Comment', cls: 'bg-violet-100 text-violet-700' },
    project_created:{ label: 'Project Created', cls: 'bg-emerald-100 text-emerald-700' },
    project_updated:{ label: 'Project Updated', cls: 'bg-purple-100 text-purple-700' },
};

function Avatar({ name, size = 'w-7 h-7', textSize = 'text-xs' }) {
    const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
    return (
        <div className={`${size} rounded-full flex items-center justify-center font-bold ${textSize} text-purple-700 shrink-0`}
            style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>
            {initials}
        </div>
    );
}

function ActivityFeed({ feed }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">System Activity</h2>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                    Live
                </span>
            </div>
            {feed && feed.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {feed.map((item, i) => {
                        const style = ACTION_STYLES[item.type] || ACTION_STYLES.task_updated;
                        return (
                            <div key={i} className="flex items-start gap-3">
                                <Avatar name={item.user_name} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-700 leading-snug">
                                        <span className="font-semibold text-gray-900">{item.user_name}</span>
                                        {' '}
                                        <span className="text-gray-500">{style.label.toLowerCase()}</span>{' '}
                                        <span className="font-medium text-purple-700 truncate">{item.title}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${style.cls}`}>{style.label}</span>
                                        <span className="text-[11px] text-gray-400">{item.occurred_at}</span>
                                    </div>
                                    {item.meta && (
                                        <p className="text-[11px] text-gray-400 mt-1 truncate">{item.meta}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-gray-400 text-center py-6">No recent activity.</p>
            )}
        </div>
    );
}

function UserIntelligence({ users }) {
    const [expanded, setExpanded] = useState(null);

    const toggle = (id) => setExpanded(prev => prev === id ? null : id);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">User Task Intelligence</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100">
                            <th className="text-left pb-2 pl-1">User</th>
                            <th className="text-center pb-2">Total</th>
                            <th className="text-center pb-2">Done</th>
                            <th className="text-center pb-2">Pending</th>
                            <th className="text-center pb-2">Projects</th>
                            <th className="text-right pb-2 pr-1">Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users && users.length > 0 ? users.map(u => (
                            <>
                                <tr key={u.id}
                                    onClick={() => toggle(u.id)}
                                    className={`border-b border-gray-50 cursor-pointer transition group ${expanded === u.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                                    <td className="py-2 pl-1">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={u.name} size="w-6 h-6" textSize="text-[10px]" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 truncate group-hover:text-purple-700 transition">{u.name}</p>
                                                <p className="text-gray-400 truncate max-w-[100px]">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2 text-center font-bold text-gray-700">{u.total}</td>
                                    <td className="py-2 text-center font-semibold text-emerald-600">{u.done}</td>
                                    <td className="py-2 text-center font-semibold text-amber-600">{u.pending}</td>
                                    <td className="py-2 text-center text-gray-500 text-[11px]">
                                        {u.projects?.length ? u.projects.slice(0, 2).map(p => p.name).join(', ') : '—'}
                                        {u.projects?.length > 2 && <span className="text-gray-400"> +{u.projects.length - 2}</span>}
                                    </td>
                                    <td className="py-2 text-right pr-1 text-gray-400">{u.last_active}</td>
                                </tr>
                                {expanded === u.id && (
                                    <tr key={`${u.id}-exp`} className="bg-purple-50">
                                        <td colSpan={6} className="px-3 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex-1 min-w-[120px] bg-white rounded-xl p-3 border border-purple-100 text-center">
                                                    <p className="text-lg font-bold text-gray-900">{u.total}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Total Tasks</p>
                                                    <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                                                        <div className="h-full rounded-full bg-purple-400" style={{ width: u.total > 0 ? '100%' : '0%' }} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-[120px] bg-white rounded-xl p-3 border border-emerald-100 text-center">
                                                    <p className="text-lg font-bold text-emerald-600">{u.done}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Completed</p>
                                                    <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                                                        <div className="h-full rounded-full bg-emerald-400"
                                                            style={{ width: u.total > 0 ? `${Math.round((u.done / u.total) * 100)}%` : '0%' }} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-[120px] bg-white rounded-xl p-3 border border-amber-100 text-center">
                                                    <p className="text-lg font-bold text-amber-600">{u.pending}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Pending</p>
                                                    <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                                                        <div className="h-full rounded-full bg-amber-400"
                                                            style={{ width: u.total > 0 ? `${Math.round((u.pending / u.total) * 100)}%` : '0%' }} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-[120px] bg-white rounded-xl p-3 border border-gray-100 text-center">
                                                    <p className="text-[11px] font-semibold text-gray-700 mt-1">{u.last_active}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Last Active</p>
                                                    <p className="text-[10px] text-gray-300 mt-1 capitalize">{u.role}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Recent Task History</p>
                                                {u.recent_tasks?.length ? (
                                                    <div className="space-y-1">
                                                        {u.recent_tasks.map(t => (
                                                            <div key={t.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                                                                <span className="text-xs font-medium text-gray-800 truncate">{t.title}</span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                                                    t.status === 'done'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : t.status === 'in_progress'
                                                                            ? 'bg-purple-100 text-purple-700'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {t.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400">No recent tasks.</p>
                                                )}
                                            </div>
                                            <Link href={route('tasks.index')}
                                                className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-800 font-medium transition">
                                                View all tasks →
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </>
                        )) : (
                            <tr><td colSpan={5} className="py-6 text-center text-gray-400">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── Main dashboard component ─────────────────────────────────────── */
export default function Dashboard({ tasks, stats, calendarTasks, isAdmin, adminStats, activityFeed, userIntelligence, activityLogs = [] }) {
    const { auth } = usePage().props;

    const trendBadge = (trend) => {
        if (!trend) return null;
        const up = trend.direction === 'up';
        const flat = trend.direction === 'flat';
        const cls = flat ? 'bg-gray-100 text-gray-500' : up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
        const icon = flat ? '■' : up ? '▲' : '▼';
        return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>
                {icon} {trend.value}%
            </span>
        );
    };

    const adminMetrics = [
        {
            label: 'Total Users',
            value: adminStats?.total_users ?? 0,
            icon: '👥',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            trend: adminStats?.trends?.users,
        },
        {
            label: 'Total Projects',
            value: adminStats?.total_projects ?? 0,
            icon: '📁',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            trend: adminStats?.trends?.projects,
            sub: `${adminStats?.active_projects ?? 0} active`,
        },
        {
            label: 'Completed Tasks',
            value: adminStats?.completed_tasks ?? 0,
            icon: '✅',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            trend: adminStats?.trends?.completed,
        },
        {
            label: 'Pending / Overdue',
            value: adminStats?.pending_tasks ?? 0,
            icon: '⚠️',
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            trend: adminStats?.trends?.pending,
            sub: `${adminStats?.overdue_tasks ?? 0} overdue`,
        },
    ];

    const userMetrics = [
        { label: 'Total Tasks',  value: stats?.total ?? 0,       icon: '📋', color: 'text-purple-600',  bg: 'bg-purple-50' },
        { label: 'Todo',         value: stats?.todo ?? 0,         icon: '⏳', color: 'text-amber-600',   bg: 'bg-amber-50' },
        { label: 'In Progress',  value: stats?.in_progress ?? 0, icon: '🔄', color: 'text-blue-600',    bg: 'bg-blue-50' },
        { label: 'Done',         value: stats?.done ?? 0,         icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <style>{`
                @keyframes popupIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
                }
                .animate-popup { animation: popupIn 0.18s ease-out forwards; }
            `}</style>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

                {/* ── Banner ── */}
                {isAdmin ? (
                    <div className="rounded-2xl p-6 text-white relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#5b21b6,#7c3aed,#9333ea)' }}>
                        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'white' }} />
                        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full opacity-10" style={{ background: 'white' }} />

                        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full tracking-wide uppercase">
                                        🛡️ Admin Overview
                                    </span>
                                </div>
                                <h1 className="text-xl font-bold">System-wide Dashboard</h1>
                                <p className="text-purple-200 text-sm mt-1">Enterprise visibility across users, projects, and tasks.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-white/90">
                                <div>
                                    <p className="text-2xl font-bold text-white">{adminStats?.total_users ?? 0}</p>
                                    <p className="text-xs text-purple-200 mt-0.5">Total Users</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{adminStats?.active_projects ?? 0}</p>
                                    <p className="text-xs text-purple-200 mt-0.5">Active Projects</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{adminStats?.total_tasks ?? 0}</p>
                                    <p className="text-xs text-purple-200 mt-0.5">Total Tasks</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-300 mt-1">● Active</p>
                                    <p className="text-xs text-purple-200 mt-0.5">System Status</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                        <h1 className="text-xl font-bold">Welcome back{auth?.user?.name ? `, ${auth.user.name}` : ''}!</h1>
                        <p className="text-purple-200 text-sm mt-1">Here's your task overview.</p>
                    </div>
                )}

                {/* ── Metric cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(isAdmin ? adminMetrics : userMetrics).map(c => (
                        <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>{c.icon}</span>
                                {isAdmin && c.trend && trendBadge(c.trend)}
                            </div>
                            <span className="text-2xl font-bold text-gray-900 mt-2">{c.value}</span>
                            <span className="text-xs text-gray-500">{c.label}</span>
                            {c.sub && <span className="text-[11px] text-gray-400 mt-0.5">{c.sub}</span>}
                        </div>
                    ))}
                </div>

                {/* ── Main 2-col layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Calendar (shared) */}
                    <CalendarPanel calendarTasks={calendarTasks} activityLogs={activityLogs} />

                    {/* Right: admin feed OR user recent tasks */}
                    {isAdmin ? (
                        <div className="flex flex-col gap-0">
                            <ActivityFeed feed={activityFeed} />
                            <UserIntelligence users={userIntelligence} />
                        </div>
                    ) : (
                        <RecentTasksPanel tasks={tasks} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
