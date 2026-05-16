/**
 * COMPREHENSIVE THEMING IMPLEMENTATION GUIDE
 * ============================================
 * 
 * This guide explains how to update ALL pages in TaskHive with the new
 * comprehensive light/dark mode theming system.
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ QUICK START: Import Pattern (Used in Every Page)                          ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/*
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
    useThemedClasses,
    priorityBadgeClass,
    statusBadgeClass,
    cardClass,
} from '../Utils/theming';

export default function PageName() {
    const { isDark } = useTheme();
    const classes = useThemedClasses();
    // Now use: classes.card, classes.button, classes.input, etc.
}
*/

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ PRIORITY PAGES FOR THEMING                                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * PRIORITY 1: Admin/Index.jsx (HIGHEST - Most Complex)
 * ─────────────────────────────────────────────────────
 * Location: resources/js/Pages/Admin/Index.jsx
 * 
 * Components to Update:
 * ✓ ConfirmModal → Replace with ThemedConfirmModal
 * ✓ EditTaskModal → Replace with ThemedModal + form components
 * ✓ Task table → Apply tableHeaderClass, tableRowClass
 * ✓ All badges → Use priorityBadgeClass, statusBadgeClass
 * ✓ Form inputs → Replace with ThemedInput, ThemedSelect
 * ✓ All buttons → Replace with ThemedButton
 * 
 * Key Changes:
 * 1. Import themed components
 * 2. Replace hardcoded color classes with utility functions
 * 3. Add isDark prop where needed
 * 4. Use CSS variables for colors (--bg-primary, etc.)
 * 
 * Example:
 * Before: className="bg-white text-gray-900"
 * After:  className={isDark ? "bg-dark-bg-primary text-dark-text" : "bg-white text-light-text"}
 * Or use: className={cardClass(isDark)}
 */

/**
 * PRIORITY 2: Dashboard.jsx (HIGH - Core Page)
 * ────────────────────────────────────────────
 * Location: resources/js/Pages/Dashboard.jsx
 * 
 * Components to Update:
 * ✓ Stats cards → Use cardClass utility
 * ✓ Calendar widget → Apply proper theming to cells
 * ✓ Task list → Use priorityBadgeClass, statusBadgeClass
 * ✓ Activity feed → Color-code activity types
 * ✓ All text colors → Use CSS variables
 * ✓ Modal popups → Use ThemedModal
 * 
 * Key Changes:
 * 1. Calendar cells: Add isDark context
 * 2. Stats cards: Wrap in cardClass
 * 3. Badges: Use badge utilities with isDark
 * 4. Text colors: Replace hardcoded grays with variables
 * 
 * Search & Replace Examples:
 * "bg-white" → `${cardClass(isDark)}`
 * "text-gray-900" → `${isDark ? 'text-dark-text' : 'text-light-text'}`
 * "bg-gray-100" → `${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'}`
 */

/**
 * PRIORITY 3: Pages/Tasks/ (HIGH - Common Pages)
 * ──────────────────────────────────────────────
 * Location: resources/js/Pages/Tasks/
 * 
 * Files:
 * - Index.jsx (Task list with filters)
 * - Create.jsx (New task form)
 * - Edit.jsx (Edit task form)
 * - Show.jsx (Task detail view)
 * 
 * Components to Update:
 * ✓ Task filter panel → Input, Select components
 * ✓ Task list cards → cardClass wrapper
 * ✓ Status badges → statusBadgeClass
 * ✓ Priority badges → priorityBadgeClass
 * ✓ Forms → ThemedInput, ThemedSelect, ThemedTextarea
 * ✓ Buttons → ThemedButton
 * ✓ Task detail section → cardClass with proper spacing
 * 
 * Pattern Example:
 * ```jsx
 * import { useThemedClasses } from '../../Utils/theming';
 * 
 * function TaskCard({ task }) {
 *     const classes = useThemedClasses();
 *     return (
 *         <div className={classes.card}>
 *             <h3 className={`text-lg font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
 *                 {task.title}
 *             </h3>
 *             <span className={classes.priorityBadge(task.priority)}>
 *                 {task.priority}
 *             </span>
 *         </div>
 *     );
 * }
 * ```
 */

/**
 * PRIORITY 4: Pages/Projects/ (MEDIUM)
 * ──────────────────────────────────
 * Location: resources/js/Pages/Projects/
 * 
 * Files:
 * - Index.jsx (Project list)
 * - Show.jsx (Project detail)
 * - Create.jsx (Create project form)
 * 
 * Components to Update:
 * ✓ Project cards → cardClass
 * ✓ Member avatars → Use getAvatarBg for colors
 * ✓ Project tabs → Proper border and text colors
 * ✓ Task list within project → Apply task theming
 * ✓ Forms → Themed form components
 * ✓ Activity logs → notificationClass styling
 * 
 * Key Focus:
 * - Project folder appearance should be distinctive
 * - Member cards should have consistent avatar styling
 * - Tabs should clearly indicate active state
 */

/**
 * PRIORITY 5: Pages/Auth/ (MEDIUM)
 * ────────────────────────────────
 * Location: resources/js/Pages/Auth/
 * 
 * Files:
 * - Login.jsx
 * - Register.jsx
 * - ForgotPassword.jsx
 * - ResetPassword.jsx
 * 
 * Components to Update:
 * ✓ Form container → cardClass wrapper
 * ✓ All inputs → ThemedInput
 * ✓ Buttons → ThemedButton
 * ✓ Error messages → errorClass styling
 * ✓ Links → Proper hover states with colors
 * ✓ Background → Full viewport theming
 * 
 * Special Considerations:
 * - Auth pages often have full-width designs
 * - Consider subtle background patterns/gradients
 * - Error states need good contrast for accessibility
 */

/**
 * PRIORITY 6: Pages/Profile/ (MEDIUM)
 * ──────────────────────────────────
 * Location: resources/js/Pages/Profile/
 * 
 * Files:
 * - Index.jsx (User profile info)
 * - Edit.jsx (Edit profile)
 * - Settings.jsx (User preferences)
 * 
 * Components to Update:
 * ✓ Profile card → cardClass
 * ✓ Avatar section → Themed styling
 * ✓ Form inputs → ThemedInput components
 * ✓ Toggle switches → Theme-aware toggle styling
 * ✓ Preference buttons → ThemedButton variants
 * ✓ Settings categories → Section headers with proper colors
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ THEMING UTILITY REFERENCE                                                  ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * Available Utilities from `/Utils/theming.js`
 * 
 * Class Generators:
 * ─────────────────
 * cardClass(isDark, hoverable) → Complete card styling
 * buttonClass(variant, isDark, size) → All button styles
 * inputClass(isDark) → Form input styling
 * tableHeaderClass(isDark) → Table header styling
 * tableRowClass(isDark) → Table row with hover
 * modalOverlayClass(isDark) → Modal backdrop
 * modalContentClass(isDark) → Modal container
 * labelClass(isDark) → Form label styling
 * helperClass(isDark) → Small helper text
 * 
 * Badge/Status Utilities:
 * ──────────────────────
 * priorityBadgeClass(priority, isDark) → High/Medium/Low badges
 * statusBadgeClass(status, isOverdue, isDark) → Done/In Progress/Todo badges
 * notificationClass(type, isDark) → Success/Warning/Error/Info alerts
 * 
 * Helper Functions:
 * ────────────────
 * getAvatarBg(name) → Consistent avatar background color
 * getContrastTextColor(isDark) → Proper text color
 * getSectionBg(isDark) → Section background color
 * getBorderColor(isDark) → Border color
 * 
 * Custom Hook:
 * ───────────
 * useThemedClasses() → Returns all utilities + isDark flag
 * Returns object with: {
 *     isDark,
 *     card, button, input, tableHeader, tableRow,
 *     modalOverlay, modalContent, label, error, helper,
 *     notification(type), priorityBadge(priority), statusBadge(status, isOverdue)
 * }
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ COMPONENT-SPECIFIC THEMING PATTERNS                                        ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * PATTERN 1: Card Component
 * ─────────────────────────
 * Use cardClass() for any container that should look like a card
 * 
 * <div className={cardClass(isDark)}>
 *     {content}
 * </div>
 * 
 * Features: Border, rounded corners, shadow, hover lift effect
 */

/**
 * PATTERN 2: Form Field with Label & Error
 * ──────────────────────────────────────────
 * Use ThemedFormGroup for complete form field structure
 * 
 * <ThemedFormGroup
 *     label="Email"
 *     error={errors.email}
 *     helperText="We'll never share your email"
 * >
 *     <ThemedInput
 *         type="email"
 *         value={email}
 *         onChange={(e) => setEmail(e.target.value)}
 *         placeholder="your@email.com"
 *     />
 * </ThemedFormGroup>
 * 
 * Features: Proper spacing, error styling, helper text
 */

/**
 * PATTERN 3: Modal Dialog
 * ──────────────────────
 * Use ThemedModal for any dialog/popup
 * 
 * {showModal && (
 *     <ThemedModal
 *         title="Delete Item"
 *         subtitle="This action cannot be undone"
 *         onClose={() => setShowModal(false)}
 *         footer={
 *             <>
 *                 <ThemedButton onClick={() => setShowModal(false)}>Cancel</ThemedButton>
 *                 <ThemedButton variant="danger">Delete</ThemedButton>
 *             </>
 *         }
 *     >
 *         Are you sure?
 *     </ThemedModal>
 * )}
 * 
 * Features: Backdrop blur, proper centering, close button
 */

/**
 * PATTERN 4: Table Display
 * ────────────────────────
 * Use tableHeaderClass and tableRowClass for tables
 * 
 * <table className="w-full">
 *     <thead className={tableHeaderClass(isDark)}>
 *         <tr>
 *             <th className="px-4 py-3">Name</th>
 *             <th className="px-4 py-3">Status</th>
 *         </tr>
 *     </thead>
 *     <tbody>
 *         {items.map(item => (
 *             <tr key={item.id} className={tableRowClass(isDark)}>
 *                 <td className="px-4 py-3">{item.name}</td>
 *                 <td className="px-4 py-3">
 *                     <span className={statusBadgeClass(item.status, false, isDark)}>
 *                         {item.status}
 *                     </span>
 *                 </td>
 *             </tr>
 *         ))}
 *     </tbody>
 * </table>
 * 
 * Features: Proper header styling, row hover effects, badge integration
 */

/**
 * PATTERN 5: Status/Priority Badges
 * ──────────────────────────────────
 * Use badge utilities for consistent badge styling
 * 
 * <div className="flex gap-2">
 *     <span className={priorityBadgeClass(task.priority, isDark)}>
 *         {task.priority}
 *     </span>
 *     <span className={statusBadgeClass(task.status, task.is_overdue, isDark)}>
 *         {task.status}
 *     </span>
 * </div>
 * 
 * Priority: high, medium, low
 * Status: done, in_progress, todo
 * Supports overdue highlighting
 */

/**
 * PATTERN 6: Notification/Alert
 * ──────────────────────────────
 * Use notificationClass for alerts
 * 
 * {showNotification && (
 *     <div className={notificationClass('success', isDark)}>
 *         <span>✅</span>
 *         <div>
 *             <p className="font-semibold">Success!</p>
 *             <p>Your changes have been saved.</p>
 *         </div>
 *     </div>
 * )}
 * 
 * Types: success, warning, error, info
 * Features: Color-coded, icon ready, dismissible design
 */

/**
 * PATTERN 7: Avatar with Color
 * ────────────────────────────
 * Use getAvatarBg for consistent avatar colors
 * 
 * <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
 *     getAvatarBg(user.name)
 * }`}>
 *     {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
 * </div>
 * 
 * Features: 6 gradient backgrounds, deterministic (same name = same color)
 */

/**
 * PATTERN 8: Text Color Based on Theme
 * ────────────────────────────────────
 * Use isDark to apply conditional text colors
 * 
 * <p className={isDark ? 'text-dark-text' : 'text-light-text'}>
 *     Primary text
 * </p>
 * <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
 *     Secondary text
 * </p>
 * <p className={isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}>
 *     Tertiary text (lowest contrast)
 * </p>
 * 
 * Or use helper: getContrastTextColor(isDark)
 */

/**
 * PATTERN 9: Background Colors
 * ────────────────────────────
 * Use CSS variables or helper functions
 * 
 * <div className={getSectionBg(isDark)}>
 *     Section background
 * </div>
 * 
 * Backgrounds: primary, secondary, tertiary (for layering)
 * Borders: primary, light
 */

/**
 * PATTERN 10: Icon Colors and Contrast
 * ─────────────────────────────────────
 * Icons should match text colors
 * 
 * <svg className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
 *     {/* Icon SVG */}
 * </svg>
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ ACCESSIBILITY CHECKLIST FOR THEMING                                        ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * ✓ Color Contrast
 * ─────────────────
 * All text must meet WCAG AA standards:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+): 3:1 contrast ratio
 * 
 * ✓ Readable Text
 * ────────────────
 * No gray-on-black or low-contrast combinations in dark mode
 * Primary text: #F9FAFB (very bright white)
 * Secondary text: #D1D5DB (light gray)
 * Tertiary text: #9CA3AF (medium gray - labels only)
 * 
 * ✓ Focus States
 * ───────────────
 * All interactive elements must have visible focus states
 * Use focus:ring-2 focus:ring-accent-500 on buttons/inputs
 * 
 * ✓ Color Independence
 * ─────────────────────
 * Don't rely on color alone to convey meaning
 * Use icons, text labels, or patterns
 * Example: "✅ Done" not just green background
 * 
 * ✓ Form Labels
 * ──────────────
 * All inputs must have associated labels
 * Use <label htmlFor="input-id"> or aria-label
 * 
 * ✓ Error Messages
 * ────────────────
 * Show error text, not just red color
 * Include error icon/symbol
 * Associate with form field via aria-describedby
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ TESTING YOUR THEMING IMPLEMENTATION                                        ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * Steps to Test a Themed Page:
 * 
 * 1. Build Verification
 *    npm run build  (verify no errors)
 * 
 * 2. Visual Testing
 *    npm run dev    (start dev server)
 *    - Toggle theme toggle (Sun/Moon icon in navbar)
 *    - Verify instant theme switch
 *    - Check for visible text in both modes
 *    - Verify no white-on-white or black-on-black
 * 
 * 3. Component Coverage
 *    ✓ Cards/containers - proper background colors
 *    ✓ Forms - input fields, labels, errors visible
 *    ✓ Buttons - all variants readable
 *    ✓ Tables - header/row contrast, badge visibility
 *    ✓ Modals - backdrop, content, close button visible
 *    ✓ Badges/chips - text readable with background
 *    ✓ Links - hover states visible
 *    ✓ Icons - proper color contrast
 * 
 * 4. Accessibility Check
 *    ✓ Use browser DevTools color picker to check contrast
 *    ✓ Tab through form to verify focus states
 *    ✓ Reduce motion: verify animations respect prefers-reduced-motion
 *    ✓ Check text sizing: zoom to 200% to verify readability
 * 
 * 5. Responsive Testing
 *    ✓ Test on mobile (375px)
 *    ✓ Test on tablet (768px)
 *    ✓ Test on desktop (1024px+)
 *    ✓ Verify touch targets are 44x44px minimum
 * 
 * 6. Browser Testing
 *    ✓ Chrome/Edge
 *    ✓ Firefox
 *    ✓ Safari
 *    ✓ Mobile browsers (iOS Safari, Chrome Android)
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ EXAMPLE: Complete Themed Page                                              ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/*
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '../../Context/ThemeContext';
import {
    ThemedModal,
    ThemedFormGroup,
    ThemedInput,
    ThemedSelect,
    ThemedButton,
} from '../../Components/ThemedComponents';
import {
    cardClass,
    tableHeaderClass,
    tableRowClass,
    statusBadgeClass,
    priorityBadgeClass,
} from '../../Utils/theming';

export default function TaskIndex({ tasks }) {
    const { isDark } = useTheme();
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [form, setForm] = useState({ title: '', priority: 'medium' });

    const handleCreate = () => {
        setEditingTask(null);
        setForm({ title: '', priority: 'medium' });
        setShowModal(true);
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setForm({ title: task.title, priority: task.priority });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editingTask) {
            router.patch(route('tasks.update', editingTask.id), form);
        } else {
            router.post(route('tasks.store'), form);
        }
        setShowModal(false);
    };

    return (
        <AppLayout>
            <Head title="Tasks" />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className={`text-3xl font-bold ${
                        isDark ? 'text-dark-text' : 'text-light-text'
                    }`}>
                        Tasks
                    </h1>
                    <ThemedButton onClick={handleCreate}>
                        New Task
                    </ThemedButton>
                </div>

                {/* Card wrapper */}
                <div className={cardClass(isDark)}>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={tableHeaderClass(isDark)}>
                                <tr>
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Priority</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className={tableRowClass(isDark)}>
                                        <td className={`px-4 py-3 ${
                                            isDark ? 'text-dark-text' : 'text-light-text'
                                        }`}>
                                            {task.title}
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
                                            <button
                                                onClick={() => handleEdit(task)}
                                                className={`text-sm px-3 py-1.5 rounded transition ${
                                                    isDark
                                                        ? 'text-accent-400 hover:bg-dark-bg-secondary'
                                                        : 'text-accent-600 hover:bg-light-bg-secondary'
                                                }`}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <ThemedModal
                        title={editingTask ? 'Edit Task' : 'New Task'}
                        onClose={() => setShowModal(false)}
                        footer={
                            <>
                                <ThemedButton onClick={() => setShowModal(false)}>
                                    Cancel
                                </ThemedButton>
                                <ThemedButton variant="primary" onClick={handleSave}>
                                    {editingTask ? 'Save Changes' : 'Create Task'}
                                </ThemedButton>
                            </>
                        }
                    >
                        <div className="space-y-4">
                            <ThemedFormGroup label="Title">
                                <ThemedInput
                                    value={form.title}
                                    onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Task title"
                                />
                            </ThemedFormGroup>

                            <ThemedFormGroup label="Priority">
                                <ThemedSelect
                                    value={form.priority}
                                    onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}
                                    options={[
                                        { label: '🟢 Low', value: 'low' },
                                        { label: '🟡 Medium', value: 'medium' },
                                        { label: '🔴 High', value: 'high' },
                                    ]}
                                />
                            </ThemedFormGroup>
                        </div>
                    </ThemedModal>
                )}
            </div>
        </AppLayout>
    );
}
*/

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ NEXT STEPS                                                                  ║
// ╚════════════════════════════════════════════════════════════════════════════╝

/**
 * 1. Start with Admin/Index.jsx (most complex, good practice)
 * 2. Move to Dashboard.jsx (common components, good for learning)
 * 3. Theme Task pages (Index, Create, Edit, Show)
 * 4. Theme Project pages (Index, Show, Create)
 * 5. Theme Auth pages (Login, Register, etc.)
 * 6. Theme Profile page (User settings)
 * 7. Test all pages in light and dark mode
 * 8. Deploy to Render
 * 
 * Each page should:
 * ✓ Import useTheme and theme utilities
 * ✓ Replace hardcoded colors with theme-aware classes
 * ✓ Use ThemedComponents for forms and modals
 * ✓ Apply proper contrast checking
 * ✓ Test in both light and dark modes
 * ✓ Verify accessibility
 */

export const IMPLEMENTATION_GUIDE = {
    title: 'TaskHive Comprehensive Theming Implementation Guide',
    version: '1.0',
    createdDate: new Date().toISOString(),
};
