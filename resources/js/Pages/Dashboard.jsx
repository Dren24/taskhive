import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../Layouts/AppLayout';

function priorityBadge(p) {
    const map = { high: 'bg-rose-100 text-rose-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-gray-100 text-gray-500' };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[p] || 'bg-gray-100 text-gray-500'}`;
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

function buildCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard({ tasks, stats, calendarTasks }) {
    const { auth } = usePage().props;
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());

    const cells = buildCalendar(calYear, calMonth);

    // Index calendarTasks by day (assume due_date is "YYYY-MM-DD")
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

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };

    const statCards = [
        { label: 'Total Tasks', value: stats?.total ?? 0, icon: '📋', color: 'bg-purple-50 text-purple-600' },
        { label: 'Todo', value: stats?.todo ?? 0, icon: '⏳', color: 'bg-amber-50 text-amber-600' },
        { label: 'In Progress', value: stats?.in_progress ?? 0, icon: '🔄', color: 'bg-blue-50 text-blue-600' },
        { label: 'Done', value: stats?.done ?? 0, icon: '✅', color: 'bg-emerald-50 text-emerald-600' },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                    <h1 className="text-xl font-bold">Welcome back{auth?.user?.name ? `, ${auth.user.name}` : ''}!</h1>
                    <p className="text-purple-200 text-sm mt-1">Here's your task overview.</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {statCards.map(c => (
                        <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-1">
                            <span className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</span>
                            <span className="text-2xl font-bold text-gray-900 mt-2">{c.value}</span>
                            <span className="text-xs text-gray-500">{c.label}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
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
                        <div className="grid grid-cols-7 text-center mb-2">
                            {DAYS.map(d => <span key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((day, i) => {
                                const isToday = day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
                                const hasTasks = day && tasksByDay[day];
                                return (
                                    <div key={i} className={`relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-xs ${day ? 'hover:bg-purple-50 cursor-default' : ''} ${isToday ? 'font-bold' : ''}`}>
                                        {day && (
                                            <>
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-gray-700'}`}
                                                    style={isToday ? { background: 'linear-gradient(135deg,#7c3aed,#9333ea)' } : {}}>
                                                    {day}
                                                </span>
                                                {hasTasks && (
                                                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-purple-500 block"></span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent tasks */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-sm font-bold text-gray-800 mb-4">Recent Tasks</h2>
                        {tasks && tasks.length > 0 ? (
                            <div className="space-y-3">
                                {tasks.slice(0, 8).map(t => (
                                    <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border ${t.is_overdue ? 'border-rose-200 bg-rose-50' : 'border-gray-100 bg-gray-50'}`}>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className={priorityBadge(t.priority)}>{t.priority}</span>
                                                <span className={statusBadge(t)}>{statusLabel(t)}</span>
                                            </div>
                                        </div>
                                        {t.due_date && <span className="text-xs text-gray-400 shrink-0">{t.due_date}</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No tasks yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
