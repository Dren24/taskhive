import { Head, usePage, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '../Layouts/AppLayout';
import { useTheme } from '../Context/ThemeContext';
import { priorityBadgeClass, statusBadgeClass } from '../Utils/theming';

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

function priorityIcon(p) {
    if (p === 'high') return '🔴';
    if (p === 'medium') return '🟡';
    return '🟢';
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

function heatClass(count, isDark) {
    if (!count) return '';
    if (isDark) {
        if (count <= 1) return 'bg-accent-500/10';
        if (count <= 3) return 'bg-accent-500/20';
        if (count <= 6) return 'bg-accent-500/30';
        return 'bg-accent-500/40';
    }
    if (count <= 1) return 'bg-purple-50';
    if (count <= 3) return 'bg-purple-100';
    if (count <= 6) return 'bg-purple-200';
    return 'bg-purple-300';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Task popup for calendar cell ─────────────────────────────────── */
function TaskPopup({ tasks, onClose, anchorRef, isDark }) {
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
            className={`absolute z-50 w-64 rounded-2xl shadow-xl border p-3 animate-popup ${isDark
                    ? 'bg-dark-bg-secondary border-dark-border'
                    : 'bg-white border-gray-100'
                }`}
            style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
                <div className={`w-3 h-3 border-l border-t rotate-45 mx-auto mt-1 ${isDark ? 'bg-dark-bg-secondary border-dark-border' : 'bg-white border-gray-100'
                    }`}></div>
            </div>
            <p className={`text-xs font-bold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-500'}`}>
                {tasks.length} Task{tasks.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
                {tasks.map(t => (
                    <Link key={t.id} href={route('tasks.edit', t.id)} onClick={onClose}
                        className={`block p-2.5 rounded-xl border transition group ${isDark
                                ? 'border-dark-border bg-dark-bg-tertiary hover:bg-dark-bg-tertiary/80'
                                : 'border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200'
                            }`}>
                        <div className="flex items-start gap-2">
                            <span className="text-base mt-0.5 shrink-0">{statusIcon(t)}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${t.status === 'done'
                                        ? isDark ? 'line-through text-dark-text-tertiary' : 'line-through text-gray-400'
                                        : isDark ? 'text-dark-text group-hover:text-accent-400' : 'text-gray-800 group-hover:text-purple-700'
                                    }`}>
                                    {t.title}
                                </p>
                                {t.description && <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{t.description}</p>}
                                {t.project_name && <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>📁 {t.project_name}</p>}
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className={priorityBadgeClass(t.priority, isDark)}>{priorityIcon(t.priority)} {t.priority}</span>
                                    <span className={statusBadgeClass(t.status, t.is_overdue, isDark)}>{statusLabel(t)}</span>
                                </div>
                                {t.due_date && (
                                    <p className={`text-xs font-semibold mt-1.5 ${t.is_overdue ? 'text-rose-500' : isDark ? 'text-accent-400' : 'text-purple-500'}`}>
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
function CalendarCell({ day, isToday, tasks, selected, onSelect, activityCount, isDark }) {
    const cellRef = useRef(null);
    const hasTasks = tasks && tasks.length > 0;
    const isSelectable = hasTasks || (activityCount && activityCount > 0);
    const heat = heatClass(activityCount, isDark);

    return (
        <div ref={cellRef} className="relative">
            <button
                onClick={() => isSelectable && onSelect(day, cellRef)}
                className={`w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs transition ${!day ? '' : isSelectable ? isDark ? 'hover:bg-dark-bg-tertiary cursor-pointer' : 'hover:bg-purple-50 cursor-pointer' : 'cursor-default'
                    } ${heat} ${selected ? isDark ? 'ring-2 ring-accent-500 bg-dark-bg-tertiary' : 'ring-2 ring-purple-300 bg-purple-50' : ''
                    }`}
            >
                {day && (
                    <>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isToday ? 'text-white' : isDark ? 'text-dark-text' : 'text-gray-700'
                            }`}
                            style={isToday ? { background: 'linear-gradient(135deg,#7c3aed,#9333ea)' } : {}}>
                            {day}
                        </span>
                        {hasTasks && (
                            <div className="flex gap-0.5 mt-0.5 justify-center">
                                {tasks.slice(0, 3).map((t, i) => (
                                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${t.is_overdue ? 'bg-rose-500' :
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
                <TaskPopup tasks={tasks} onClose={() => onSelect(null)} anchorRef={cellRef} isDark={isDark} />
            )}
        </div>
    );
}

/* ── Calendar panel (shared for both admin and regular users) ─────── */
function CalendarPanel({ calendarTasks, activityLogs = [], isDark, onInspectActivity }) {
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
        <div className={`rounded-2xl shadow-sm border p-5 ${isDark
                ? 'bg-dark-bg-secondary border-dark-border'
                : 'bg-white border-gray-100'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className={`p-1.5 rounded-lg transition ${isDark
                        ? 'hover:bg-dark-bg-tertiary text-dark-text-secondary'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className={`text-sm font-bold ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>{MONTHS[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className={`p-1.5 rounded-lg transition ${isDark
                        ? 'hover:bg-dark-bg-tertiary text-dark-text-secondary'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="flex items-center gap-3 mb-3 px-1">
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>High</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Medium</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>Low</span>
            </div>
            <div className="grid grid-cols-7 text-center mb-2">
                {DAYS.map(d => <span key={d} className={`text-xs font-semibold py-1 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    const isToday = day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
                    return (
                        <CalendarCell key={i} day={day} isToday={isToday} isDark={isDark}
                            tasks={day ? (tasksByDay[day] || null) : null}
                            selected={selectedDay === day}
                            activityCount={day ? (activityByDay[day] || 0) : 0}
                            onSelect={handleDaySelect} />
                    );
                })}
            </div>

            <div className={`mt-5 border-t pt-4 ${isDark ? 'border-dark-border' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>Daily Activity Logs</h3>
                    {selectedDate && (
                        <span className={`text-xs ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{selectedDate}</span>
                    )}
                </div>
                {!selectedDate ? (
                    <p className={`text-xs ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>Select a date to review system activity.</p>
                ) : dayLogs.length === 0 ? (
                    <p className={`text-xs ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>No activity recorded for this day.</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {dayLogs.map(log => (
                            <button key={log.id} type="button" onClick={() => onInspectActivity?.(log)}
                                className={`w-full flex items-start gap-3 border rounded-xl px-3 py-2 text-left transition ${isDark
                                    ? 'bg-dark-bg-tertiary border-dark-border'
                                    : 'bg-gray-50 border-gray-100 hover:border-purple-200 hover:bg-purple-50'
                                }`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark
                                        ? 'bg-accent-500/20 text-accent-300'
                                        : 'bg-purple-100 text-purple-600'
                                    }`}>
                                    {log.type?.includes('project') ? '📁'
                                        : log.type?.includes('submission') ? '📤'
                                            : log.type?.includes('file') ? '📎'
                                                : log.type?.includes('comment') ? '💬'
                                                    : '✅'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-gray-700'}`}>
                                        <span className={`font-semibold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{log.user_name}</span>{' '}
                                        <span className={isDark ? 'text-dark-text-tertiary' : 'text-gray-500'}>· {log.time}</span>
                                    </p>
                                    <p className={`text-xs font-medium truncate ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>{log.title}</p>
                                    {log.meta && <p className={`text-[11px] truncate ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{log.meta}</p>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Recent tasks panel (regular user right column) ────────────────── */
function RecentTasksPanel({ tasks, isDark }) {
    return (
        <div className={`rounded-2xl shadow-sm border p-5 ${isDark
                ? 'bg-dark-bg-secondary border-dark-border'
                : 'bg-white border-gray-100'
            }`}>
            <h2 className={`text-sm font-bold mb-4 ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>Recent Tasks</h2>
            {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.slice(0, 8).map(t => {
                        const now = new Date();
                        const due = t.due_date ? new Date(t.due_date + 'T' + (t.due_time || '23:59') + ':00') : null;
                        const hoursLeft = due ? (due - now) / 36e5 : null;
                        const dueSoon = !t.is_overdue && hoursLeft !== null && hoursLeft >= 0 && hoursLeft <= 48;

                        return (
                            <Link key={t.id} href={route('tasks.edit', t.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition hover:shadow-sm ${isDark
                                        ? t.is_overdue ? 'border-red-500/30 bg-red-500/10 hover:border-red-500/50'
                                            : dueSoon ? 'border-yellow-500/30 bg-yellow-500/10 hover:border-yellow-500/50'
                                                : t.status === 'done' ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50'
                                                    : 'border-dark-border bg-dark-bg-tertiary hover:border-dark-border'
                                        : t.is_overdue ? 'border-rose-200 bg-rose-50 hover:border-rose-300'
                                            : dueSoon ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                                                : t.status === 'done' ? 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-200'
                                                    : 'border-gray-100 bg-gray-50 hover:border-purple-200'
                                    }`}>
                                <div className={`w-1 self-stretch rounded-full shrink-0
                                    ${t.is_overdue ? 'bg-red-500' : dueSoon ? 'bg-yellow-500' : t.status === 'done' ? 'bg-emerald-500' : t.status === 'in_progress' ? 'bg-accent-500' : isDark ? 'bg-dark-text-tertiary' : 'bg-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${t.status === 'done'
                                            ? isDark ? 'line-through text-dark-text-tertiary' : 'line-through text-gray-400'
                                            : t.is_overdue ? isDark ? 'text-red-400' : 'text-rose-700' : isDark ? 'text-dark-text' : 'text-gray-800'
                                        }`}>
                                        {t.status === 'done' && '✅ '}{t.is_overdue && '⚠️ '}{dueSoon && !t.is_overdue && '⏰ '}{t.title}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        <span className={priorityBadgeClass(t.priority, isDark)}>{t.priority}</span>
                                        <span className={statusBadgeClass(t.status, t.is_overdue, isDark)}>{statusLabel(t)}</span>
                                        {dueSoon && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Due soon</span>}
                                    </div>
                                    {t.due_date && (
                                        <p className={`text-xs mt-1 font-medium ${t.is_overdue ? isDark ? 'text-red-400 font-semibold' : 'text-rose-500 font-semibold'
                                                : dueSoon ? isDark ? 'text-yellow-400 font-semibold' : 'text-amber-600 font-semibold'
                                                    : isDark ? 'text-dark-text-tertiary' : 'text-gray-400'
                                            }`}>
                                            {formatDate(t.due_date)}{t.due_time ? ` • ${formatTime(t.due_time)}` : ''}
                                        </p>
                                    )}
                                </div>
                                <svg className={`w-4 h-4 shrink-0 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <p className={`text-sm text-center py-8 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>No tasks yet.</p>
            )}
        </div>
    );
}

function Avatar({ name, size = 'w-7 h-7', textSize = 'text-xs', isDark = false }) {
    const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
    const bgColor = name ? ['#7c3aed', '#6d28d9', '#9333ea', '#a21caf', '#d946ef', '#ec4899'][(name.charCodeAt(0) || 0) % 6] : '#7c3aed';
    return (
        <div className={`${size} rounded-full flex items-center justify-center font-bold ${textSize} ${isDark ? 'text-accent-200' : 'text-purple-700'
            } shrink-0`}
            style={{ background: isDark ? bgColor + '40' : 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>
            {initials}
        </div>
    );
}

const ACTION_STYLES = {
    task_created: { label: 'Task Created', cls: 'bg-emerald-100 text-emerald-700' },
    task_updated: { label: 'Task Updated', cls: 'bg-purple-100 text-purple-700' },
    task_completed: { label: 'Task Completed', cls: 'bg-blue-100 text-blue-700' },
    submission: { label: 'Submission', cls: 'bg-sky-100 text-sky-700' },
    file_upload: { label: 'File Upload', cls: 'bg-amber-100 text-amber-700' },
    task_comment: { label: 'Task Comment', cls: 'bg-indigo-100 text-indigo-700' },
    project_comment: { label: 'Project Comment', cls: 'bg-violet-100 text-violet-700' },
    project_created: { label: 'Project Created', cls: 'bg-emerald-100 text-emerald-700' },
    project_updated: { label: 'Project Updated', cls: 'bg-purple-100 text-purple-700' },
};

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function fileIcon(file) {
    const mime = file?.mime_type || '';
    const name = (file?.name || '').toLowerCase();
    if (mime.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'DOC';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'XLS';
    if (name.endsWith('.zip') || name.endsWith('.rar')) return 'ZIP';
    return 'FILE';
}

function ActivityDetailModal({ activity, isDark, onClose }) {
    if (!activity) return null;

    const style = ACTION_STYLES[activity.type] || ACTION_STYLES.task_updated;
    const task = activity.task;
    const comments = activity.comments?.length ? activity.comments : (activity.comment ? [activity.comment] : []);
    const files = activity.files?.length ? activity.files : [];
    const submissions = activity.submission ? [activity.submission] : (task?.submissions || []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button type="button" aria-label="Close activity details" onClick={onClose}
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
            <div className={`relative w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl border shadow-2xl animate-popup ${isDark
                    ? 'bg-dark-bg-secondary border-dark-border'
                    : 'bg-white border-purple-100'
                }`}>
                <div className={`px-5 py-4 border-b ${isDark ? 'border-dark-border bg-dark-bg-tertiary' : 'border-purple-100 bg-purple-50/70'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                            <Avatar name={activity.user?.name || activity.user_name} size="w-11 h-11" textSize="text-sm" isDark={isDark} />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className={`text-base font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{style.label}</h2>
                                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${style.cls}`}>{style.label}</span>
                                </div>
                                <p className={`text-sm mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>
                                    <span className="font-semibold">{activity.user?.name || activity.user_name}</span>
                                    <span className="capitalize"> · {activity.user?.role || 'user'}</span>
                                    <span> · {activity.occurred_at_display || activity.occurred_at}</span>
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${isDark ? 'hover:bg-dark-bg-secondary text-dark-text-secondary' : 'hover:bg-white text-gray-500'}`}>
                            ×
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(88vh-86px)] overflow-y-auto p-5 space-y-4">
                    <section className={`rounded-2xl border p-4 ${isDark ? 'border-dark-border bg-dark-bg-tertiary' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>Activity Reference</p>
                                <h3 className={`text-lg font-bold mt-1 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{activity.title}</h3>
                                {activity.meta && <p className={`text-sm mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-gray-500'}`}>{activity.meta}</p>}
                            </div>
                            {activity.reference?.url && (
                                <Link href={activity.reference.url}
                                    className={`inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold transition ${isDark ? 'bg-accent-500/20 text-accent-200 hover:bg-accent-500/30' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                                    Open {activity.reference.type}
                                </Link>
                            )}
                        </div>
                    </section>

                    {task && (
                        <section className={`rounded-2xl border p-4 ${isDark ? 'border-dark-border' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h3 className={`text-sm font-bold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Task Snapshot</h3>
                                <div className="flex gap-2">
                                    <span className={priorityBadgeClass(task.priority, isDark)}>{task.priority}</span>
                                    <span className={statusBadgeClass(task.status, false, isDark)}>{statusLabel({ status: task.status })}</span>
                                </div>
                            </div>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>
                                <p><span className="font-semibold">Assignee:</span> {task.assignee?.name || 'Unassigned'}</p>
                                <p><span className="font-semibold">Due:</span> {task.due_date || 'No date'}{task.due_time ? ` · ${formatTime(task.due_time)}` : ''}</p>
                                {task.project && <p><span className="font-semibold">Project:</span> {task.project.name}</p>}
                            </div>
                            {task.description && (
                                <div className={`mt-3 rounded-xl p-3 text-sm whitespace-pre-wrap ${isDark ? 'bg-dark-bg-tertiary text-dark-text-secondary' : 'bg-gray-50 text-gray-600'}`}>
                                    {task.description}
                                </div>
                            )}
                        </section>
                    )}

                    {submissions.length > 0 && (
                        <section className={`rounded-2xl border p-4 ${isDark ? 'border-dark-border' : 'border-gray-100'}`}>
                            <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Submission Details</h3>
                            <div className="space-y-3">
                                {submissions.map(submission => (
                                    <div key={submission.id} className={`rounded-xl p-3 ${isDark ? 'bg-dark-bg-tertiary' : 'bg-purple-50/60'}`}>
                                        <p className={`text-xs font-semibold ${isDark ? 'text-dark-text-tertiary' : 'text-gray-500'}`}>
                                            Attempt {submission.attempt || 1} · {submission.user?.name || 'Unknown'} · {submission.created_at}
                                        </p>
                                        {submission.comment ? (
                                            <p className={`mt-2 text-sm whitespace-pre-wrap ${isDark ? 'text-dark-text-secondary' : 'text-gray-700'}`}>{submission.comment}</p>
                                        ) : (
                                            <p className={`mt-2 text-sm ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>No submitted text.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {files.length > 0 && (
                        <section className={`rounded-2xl border p-4 ${isDark ? 'border-dark-border' : 'border-gray-100'}`}>
                            <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Uploaded Files</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {files.map(file => (
                                    <div key={`${file.id}-${file.name}`} className={`rounded-xl border p-3 ${isDark ? 'border-dark-border bg-dark-bg-tertiary' : 'border-gray-100 bg-white'}`}>
                                        <div className="flex gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? 'bg-accent-500/20 text-accent-200' : 'bg-purple-100 text-purple-700'}`}>
                                                {fileIcon(file)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{file.name}</p>
                                                <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{formatBytes(file.size)} · {file.created_at || 'Uploaded'}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {file.preview_url && (
                                                        <a href={file.preview_url} target="_blank" rel="noreferrer"
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-dark-bg-secondary text-accent-300' : 'bg-purple-50 text-purple-700'}`}>
                                                            Preview
                                                        </a>
                                                    )}
                                                    {file.download_url && (
                                                        <a href={file.download_url}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-accent-500/20 text-accent-200' : 'bg-purple-600 text-white'}`}>
                                                            Download
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {comments.length > 0 && (
                        <section className={`rounded-2xl border p-4 ${isDark ? 'border-dark-border' : 'border-gray-100'}`}>
                            <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>Comment Thread</h3>
                            <div className="space-y-3">
                                {comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar name={comment.user?.name} size="w-8 h-8" textSize="text-[11px]" isDark={isDark} />
                                        <div className={`flex-1 rounded-xl p-3 ${isDark ? 'bg-dark-bg-tertiary' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-semibold ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>{comment.user?.name || 'Unknown'} <span className={isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}>· {comment.created_at}</span></p>
                                            <p className={`text-sm mt-1 whitespace-pre-wrap ${isDark ? 'text-dark-text-secondary' : 'text-gray-600'}`}>{comment.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function ActivityFeed({ feed, isDark, onInspectActivity }) {
    return (
        <div className={`rounded-2xl shadow-sm border p-5 ${isDark
                ? 'bg-dark-bg-secondary border-dark-border'
                : 'bg-white border-gray-100'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className={`text-sm font-bold ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>System Activity</h2>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                    Live
                </span>
            </div>
            {feed && feed.length > 0 ? (
                <div className={`space-y-2.5 max-h-64 overflow-y-auto pr-1`}>
                    {feed.map((item, i) => {
                        const style = ACTION_STYLES[item.type] || ACTION_STYLES.task_updated;
                        return (
                            <button key={i} type="button" onClick={() => onInspectActivity?.(item)}
                                className={`w-full flex items-start gap-3 rounded-xl p-2 text-left transition ${isDark ? 'hover:bg-dark-bg-tertiary' : 'hover:bg-purple-50'}`}>
                                <Avatar name={item.user_name} isDark={isDark} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs leading-snug ${isDark ? 'text-dark-text-secondary' : 'text-gray-700'}`}>
                                        <span className={`font-semibold ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{item.user_name}</span>
                                        {' '}
                                        <span className={isDark ? 'text-dark-text-tertiary' : 'text-gray-500'}>{style.label.toLowerCase()}</span>{' '}
                                        <span className={`font-medium truncate ${isDark ? 'text-accent-400' : 'text-purple-700'}`}>{item.title}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${style.cls}`}>{style.label}</span>
                                        <span className={`text-[11px] ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{item.occurred_at}</span>
                                    </div>
                                    {item.meta && (
                                        <p className={`text-[11px] mt-1 truncate ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{item.meta}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className={`text-sm text-center py-6 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>No recent activity.</p>
            )}
        </div>
    );
}

function UserIntelligence({ users, isDark }) {
    const [expanded, setExpanded] = useState(null);
    const toggle = (id) => setExpanded(prev => prev === id ? null : id);

    return (
        <div className={`rounded-2xl shadow-sm border p-5 mt-4 ${isDark
                ? 'bg-dark-bg-secondary border-dark-border'
                : 'bg-white border-gray-100'
            }`}>
            <h2 className={`text-sm font-bold mb-3 ${isDark ? 'text-dark-text' : 'text-gray-800'}`}>User Task Intelligence</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className={`font-semibold uppercase tracking-wide border-b ${isDark
                                ? 'text-dark-text-tertiary border-dark-border'
                                : 'text-gray-400 border-gray-100'
                            }`}>
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
                            <tr key={u.id}
                                onClick={() => toggle(u.id)}
                                className={`border-b cursor-pointer transition group ${isDark
                                        ? `border-dark-border ${expanded === u.id ? 'bg-dark-bg-tertiary' : 'hover:bg-dark-bg-tertiary/50'}`
                                        : `border-gray-50 ${expanded === u.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`
                                    }`}>
                                <td className="py-2 pl-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar name={u.name} size="w-6 h-6" textSize="text-[10px]" isDark={isDark} />
                                        <div className="min-w-0">
                                            <p className={`font-semibold truncate transition ${isDark
                                                    ? 'text-dark-text group-hover:text-accent-400'
                                                    : 'text-gray-800 group-hover:text-purple-700'
                                                }`}>{u.name}</p>
                                            <p className={`truncate max-w-[100px] ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className={`py-2 text-center font-bold ${isDark ? 'text-dark-text' : 'text-gray-700'}`}>{u.total}</td>
                                <td className="py-2 text-center font-semibold text-emerald-600">{u.done}</td>
                                <td className="py-2 text-center font-semibold text-amber-600">{u.pending}</td>
                                <td className={`py-2 text-center text-[11px] ${isDark ? 'text-dark-text-tertiary' : 'text-gray-500'}`}>
                                    {u.projects?.length ? u.projects.slice(0, 2).map(p => p.name).join(', ') : '—'}
                                    {u.projects?.length > 2 && <span className={isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}> +{u.projects.length - 2}</span>}
                                </td>
                                <td className={`py-2 text-right pr-1 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{u.last_active}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className={`py-6 text-center ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>No users found.</td></tr>
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
    const { isDark } = useTheme();
    const [selectedActivity, setSelectedActivity] = useState(null);

    const trendBadge = (trend) => {
        if (!trend) return null;
        const up = trend.direction === 'up';
        const flat = trend.direction === 'flat';
        const cls = isDark
            ? flat ? 'bg-dark-bg-tertiary text-dark-text-secondary' : up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            : flat ? 'bg-gray-100 text-gray-500' : up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
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
        { label: 'Total Tasks', value: stats?.total ?? 0, icon: '📋', color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Todo', value: stats?.todo ?? 0, icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'In Progress', value: stats?.in_progress ?? 0, icon: '🔄', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Done', value: stats?.done ?? 0, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
                        <div key={c.label} className={`rounded-2xl shadow-sm border p-4 flex flex-col gap-1 ${isDark
                                ? 'bg-dark-bg-secondary border-dark-border'
                                : 'bg-white border-gray-100'
                            }`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>{c.icon}</span>
                                {isAdmin && c.trend && trendBadge(c.trend)}
                            </div>
                            <span className={`text-2xl font-bold mt-2 ${isDark ? 'text-dark-text' : 'text-gray-900'}`}>{c.value}</span>
                            <span className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-gray-500'}`}>{c.label}</span>
                            {c.sub && <span className={`text-[11px] mt-0.5 ${isDark ? 'text-dark-text-tertiary' : 'text-gray-400'}`}>{c.sub}</span>}
                        </div>
                    ))}
                </div>

                {/* ── Main 2-col layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Calendar (shared) */}
                    <CalendarPanel calendarTasks={calendarTasks} activityLogs={activityLogs} isDark={isDark} onInspectActivity={setSelectedActivity} />

                    {/* Right: admin feed OR user recent tasks */}
                    {isAdmin ? (
                        <div className="flex flex-col gap-0">
                            <ActivityFeed feed={activityFeed} isDark={isDark} onInspectActivity={setSelectedActivity} />
                            <UserIntelligence users={userIntelligence} isDark={isDark} />
                        </div>
                    ) : (
                        <RecentTasksPanel tasks={tasks} isDark={isDark} />
                    )}
                </div>
            </div>
            <ActivityDetailModal activity={selectedActivity} isDark={isDark} onClose={() => setSelectedActivity(null)} />
        </AppLayout>
    );
}
