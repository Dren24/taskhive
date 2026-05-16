/**
 * Example: How to use ThemedComponents in your pages
 * This file demonstrates proper usage of the themed component library
 */

import { useState } from 'react';
import { useTheme } from '../Context/ThemeContext';
import {
    ThemedConfirmModal,
    ThemedModal,
    ThemedFormGroup,
    ThemedInput,
    ThemedTextarea,
    ThemedSelect,
    ThemedButton,
} from '../Components/ThemedComponents';
import {
    priorityBadgeClass,
    statusBadgeClass,
    cardClass,
    inputClass,
    tableHeaderClass,
    tableRowClass,
    notificationClass,
} from '../Utils/theming';

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Using ThemedConfirmModal
// ═══════════════════════════════════════════════════════════════════════════
export function ConfirmDeleteExample() {
    const [showing, setShowing] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        // Do something async
        setTimeout(() => {
            setLoading(false);
            setShowing(false);
        }, 1000);
    };

    return (
        <>
            <button onClick={() => setShowing(true)}>Delete Item</button>

            {showing && (
                <ThemedConfirmModal
                    title="Delete Item?"
                    message="Are you sure you want to delete this item? This action cannot be undone."
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    confirmVariant="danger"
                    onConfirm={handleConfirm}
                    onCancel={() => setShowing(false)}
                    loading={loading}
                />
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Using ThemedModal with Form
// ═══════════════════════════════════════════════════════════════════════════
export function EditTaskModalExample() {
    const [showing, setShowing] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validate
            if (!form.title) {
                setErrors({ title: 'Title is required' });
                return;
            }
            // Save to API
            // router.patch(route('tasks.update', taskId), form, ...
            setTimeout(() => {
                setSaving(false);
                setShowing(false);
            }, 1000);
        } catch (err) {
            setSaving(false);
        }
    };

    return (
        <>
            <button onClick={() => setShowing(true)}>Edit Task</button>

            {showing && (
                <ThemedModal
                    title="Edit Task"
                    subtitle="Update task details and timeline"
                    onClose={() => setShowing(false)}
                    footer={
                        <>
                            <ThemedButton
                                variant="ghost"
                                onClick={() => setShowing(false)}
                                disabled={saving}
                            >
                                Cancel
                            </ThemedButton>
                            <ThemedButton
                                variant="primary"
                                onClick={handleSave}
                                loading={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </ThemedButton>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <ThemedFormGroup
                            label="Task Title"
                            error={errors.title}
                        >
                            <ThemedInput
                                value={form.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Enter task title"
                                error={!!errors.title}
                            />
                        </ThemedFormGroup>

                        <ThemedFormGroup label="Description">
                            <ThemedTextarea
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Optional task description"
                                rows={3}
                            />
                        </ThemedFormGroup>

                        <div className="grid grid-cols-2 gap-4">
                            <ThemedFormGroup label="Priority">
                                <ThemedSelect
                                    value={form.priority}
                                    onChange={(e) => handleChange('priority', e.target.value)}
                                    options={[
                                        { label: '🟢 Low', value: 'low' },
                                        { label: '🟡 Medium', value: 'medium' },
                                        { label: '🔴 High', value: 'high' },
                                    ]}
                                />
                            </ThemedFormGroup>

                            <ThemedFormGroup label="Status">
                                <ThemedSelect
                                    value={form.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    options={[
                                        { label: '⏳ Todo', value: 'todo' },
                                        { label: '🔄 In Progress', value: 'in_progress' },
                                        { label: '✅ Done', value: 'done' },
                                    ]}
                                />
                            </ThemedFormGroup>
                        </div>

                        <ThemedFormGroup label="Due Date">
                            <ThemedInput
                                type="date"
                                value={form.due_date}
                                onChange={(e) => handleChange('due_date', e.target.value)}
                            />
                        </ThemedFormGroup>
                    </div>
                </ThemedModal>
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Using Theming Utilities in a Table Component
// ═══════════════════════════════════════════════════════════════════════════
export function TaskTableExample({ tasks }) {
    const { isDark } = useTheme();

    return (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-dark-border' : 'border-light-border'
            }`}>
            <table className="w-full">
                <thead>
                    <tr className={tableHeaderClass(isDark)}>
                        <th className="px-4 py-3 text-left">Task</th>
                        <th className="px-4 py-3 text-left">Priority</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id} className={tableRowClass(isDark)}>
                            <td className={`px-4 py-3 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
                                <p className="font-medium">{task.title}</p>
                                <p className={isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}>
                                    {task.description}
                                </p>
                            </td>
                            <td className="px-4 py-3">
                                <span className={priorityBadgeClass(task.priority, isDark)}>
                                    {task.priority}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span className={statusBadgeClass(task.status, task.is_overdue, isDark)}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button className={`text-sm px-3 py-1.5 rounded-lg transition ${isDark
                                        ? 'text-accent-400 hover:bg-dark-bg-tertiary'
                                        : 'text-accent-600 hover:bg-light-bg-tertiary'
                                    }`}>
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Using Card Component with Theming
// ═══════════════════════════════════════════════════════════════════════════
export function StatsCardExample({ title, value, icon }) {
    const { isDark } = useTheme();

    return (
        <div className={cardClass(isDark, true)}>
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
                            }`}>
                            {title}
                        </p>
                        <p className="text-3xl font-bold mt-2">
                            {value}
                        </p>
                    </div>
                    <span className="text-4xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Using Notification Styles
// ═══════════════════════════════════════════════════════════════════════════
export function NotificationExample() {
    const { isDark } = useTheme();

    return (
        <div className="space-y-3">
            {['success', 'warning', 'error', 'info'].map(type => (
                <div key={type} className={notificationClass(type, isDark)}>
                    <span className="text-xl">
                        {type === 'success' ? '✅'
                            : type === 'warning' ? '⚠️'
                                : type === 'error' ? '❌'
                                    : 'ℹ️'}
                    </span>
                    <div>
                        <p className="font-semibold capitalize">{type} Message</p>
                        <p className="text-sm opacity-80">This is a {type} notification example.</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOW TO IMPORT AND USE IN YOUR PAGES
// ═══════════════════════════════════════════════════════════════════════════

/*

In your page component (e.g., Pages/Admin/Index.jsx):

import { useTheme } from '../../Context/ThemeContext';
import {
    ThemedConfirmModal,
    ThemedModal,
    ThemedFormGroup,
    ThemedInput,
    ThemedSelect,
    ThemedButton,
} from '../../Components/ThemedComponents';
import {
    priorityBadgeClass,
    statusBadgeClass,
    cardClass,
} from '../../Utils/theming';

export default function AdminIndex() {
    const { isDark } = useTheme();

    // Use in your JSX:
    return (
        <div>
            {/* Cards with proper theming */}
<div className={cardClass(isDark)}>
    <h2>My Card</h2>
</div>

{/* Badges */ }
            <span className={priorityBadgeClass('high', isDark)}>High</span>
            <span className={statusBadgeClass('done', false, isDark)}>Done</span>

{/* Forms with proper theming */ }
<ThemedInput
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Type something..."
/>

{/* Buttons */ }
<ThemedButton variant="primary" onClick={handleClick}>
    Click Me
</ThemedButton>

{/* Modals */ }
{
    showModal && (
        <ThemedModal
            title="Modal Title"
            onClose={() => setShowModal(false)}
            footer={
                <>
                    <ThemedButton onClick={() => setShowModal(false)}>Cancel</ThemedButton>
                    <ThemedButton variant="primary">Save</ThemedButton>
                </>
            }
        >
            Modal content goes here
        </ThemedModal>
    )
}
        </div >
    );
}

*/
