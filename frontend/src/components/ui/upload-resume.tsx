'use client';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
}

interface UploadResumeProps {
  files: UploadFile[];
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadResume({ files, onRetry, onCancel, onPause, onResume }: UploadResumeProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Upload queue">
      {files.map((file) => (
        <div
          key={file.id}
          className={`p-3 rounded-lg border ${
            file.status === 'failed'
              ? 'border-red-200 bg-red-50'
              : file.status === 'completed'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs text-gray-500 shrink-0">{formatSize(file.size)}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(file.status === 'pending' || file.status === 'paused') && (
                <button
                  onClick={() => onResume(file.id)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  aria-label={`Resume upload ${file.name}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
              )}
              {file.status === 'uploading' && (
                <button
                  onClick={() => onPause(file.id)}
                  className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                  aria-label={`Pause upload ${file.name}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 3A1.5 1.5 0 004 4.5v11A1.5 1.5 0 005.5 17h1a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 006.5 3h-1zm8 0A1.5 1.5 0 0012 4.5v11a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0014.5 3h-1z" />
                  </svg>
                </button>
              )}
              {file.status === 'failed' && (
                <button
                  onClick={() => onRetry(file.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  aria-label={`Retry upload ${file.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onCancel(file.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                aria-label={`Cancel upload ${file.name}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                file.status === 'completed'
                  ? 'bg-green-500'
                  : file.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${file.progress}%` }}
            />
          </div>
          {file.error && (
            <p className="mt-1 text-xs text-red-600">{file.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
