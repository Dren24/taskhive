import { useEffect, useMemo, useRef, useState } from 'react';

export const ACCEPTED_ATTACHMENT_TYPES = [
    'image/*',
    'application/pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.csv',
    '.ppt',
    '.pptx',
    '.zip',
    '.rar',
    '.7z',
    '.txt',
].join(',');

export function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeIcon(file) {
    const name = typeof file === 'string' ? file : file?.name || file?.original_name || '';
    const mime = file?.type || file?.mime_type || '';
    const ext = name.split('.').pop()?.toLowerCase();

    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'IMG';
    if (mime.includes('pdf') || ext === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'DOC';
    if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) return 'XLS';
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) return 'ZIP';
    return 'FILE';
}

function isImageFile(file) {
    return file?.type?.startsWith('image/');
}

function fileKey(file) {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

function FileCard({ file, previewUrl, progress, uploading, onRemove }) {
    const icon = fileTypeIcon(file);

    return (
        <div className="group overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm transition hover:border-purple-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-500">
            <div className="flex gap-3 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-purple-100 bg-purple-50 text-[10px] font-black text-purple-700 flex items-center justify-center dark:border-slate-700 dark:bg-slate-800 dark:text-purple-200">
                    {previewUrl ? (
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        icon
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{file.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                {icon} · {formatFileSize(file.size)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                            aria-label={`Remove ${file.name}`}
                        >
                            ×
                        </button>
                    </div>
                    <div className="mt-2">
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-300"
                                style={{ width: `${uploading ? Math.max(progress || 8, 8) : 100}%` }}
                            />
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                            {uploading ? `Uploading ${progress || 0}%` : 'Ready to attach'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AttachmentUploader({
    files,
    onAdd,
    onRemove,
    progress = 0,
    uploading = false,
    multiple = true,
    maxSizeMb = 50,
    title = 'Attachments',
    optionalLabel = '(optional)',
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);
    const [previews, setPreviews] = useState({});

    useEffect(() => {
        const next = {};
        const urlsToRevoke = [];

        files.forEach((file) => {
            if (isImageFile(file)) {
                const key = fileKey(file);
                next[key] = previews[key] || URL.createObjectURL(file);
            }
        });

        Object.entries(previews).forEach(([key, url]) => {
            if (!next[key]) urlsToRevoke.push(url);
        });

        setPreviews(next);
        urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));

        return () => {};
    }, [files]);

    useEffect(() => () => {
        Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const acceptText = useMemo(() => 'Images, PDF, Word, Excel, ZIP, text and common files', []);

    const addSelectedFiles = (selectedFiles) => {
        const accepted = Array.from(selectedFiles || []).filter((file) => {
            if (file.size <= maxSizeMb * 1024 * 1024) return true;
            alert(`${file.name} is larger than ${maxSizeMb} MB.`);
            return false;
        });

        if (accepted.length > 0) {
            onAdd(multiple ? accepted : [accepted[0]]);
        }

        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {title} <span className="font-normal normal-case text-gray-400 dark:text-slate-500">{optionalLabel}</span>
                </label>
                {files.length > 0 && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-200">
                        {files.length} selected
                    </span>
                )}
            </div>

            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addSelectedFiles(event.dataTransfer.files);
                }}
                className={`rounded-2xl border-2 border-dashed p-4 transition ${
                    dragging
                        ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950/30'
                        : 'border-purple-200 bg-purple-50/40 hover:border-purple-400 hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-purple-500 dark:hover:bg-purple-950/20'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple={multiple}
                    accept={ACCEPTED_ATTACHMENT_TYPES}
                    className="hidden"
                    onChange={(event) => addSelectedFiles(event.target.files)}
                />

                <div className="flex flex-col items-center justify-center px-3 py-5 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-purple-100 dark:bg-slate-800 dark:ring-slate-700">
                        +
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-slate-100">
                        {dragging ? 'Drop files here' : 'Drag and drop files here'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{acceptText} · max {maxSizeMb} MB each</p>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                    >
                        + Add Files
                    </button>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {files.map((file, index) => (
                        <FileCard
                            key={fileKey(file)}
                            file={file}
                            previewUrl={previews[fileKey(file)]}
                            progress={progress}
                            uploading={uploading}
                            onRemove={() => onRemove(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
