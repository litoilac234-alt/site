import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SubmissionSuccessSign } from '../components/ui/SubmissionSuccessSign';
import { apiUrl } from '../lib/paths';

const API = apiUrl('swa_stewa.php');

interface TemplateInfo {
  report_type: 'SWA' | 'STEWA' | 'IAR';
  exists: boolean;
  filename: string | null;
  file_size_label: string | null;
  uploaded_at: string | null;
  download_url: string | null;
}

export function SwaStewaTemplatePage() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState('');

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API}?action=templates`, { credentials: 'same-origin' });
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const upload = async (type: 'SWA' | 'STEWA' | 'IAR', file: File | null) => {
    if (!file) return;
    setUploading(type);
    setError('');
    setMessage('');

    const form = new FormData();
    form.append('report_type', type);
    form.append('template_file', file);

    try {
      const res = await fetch(API, { method: 'POST', body: form, credentials: 'same-origin' });
      const text = await res.text();
      let data: { message?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server error. Check that Apache and MySQL are running.');
      }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setMessage(`${type}: ${data.message}`);
      setSuccessType(type);
      setShowSuccess(true);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
      setDragOver(null);
    }
  };

  const clearTemplate = async (type: 'SWA' | 'STEWA' | 'IAR') => {
    if (!window.confirm(`Clear the ${type} template? You can upload a new Excel file with formulas after.`)) {
      return;
    }
    setClearing(type);
    setError('');
    setMessage('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_template', report_type: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not clear template');
      if (data.templates) setTemplates(data.templates);
      else await loadTemplates();
      setMessage(data.message ?? `${type} template cleared.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear template');
    } finally {
      setClearing(null);
    }
  };

  const getInfo = (type: 'SWA' | 'STEWA' | 'IAR') =>
    templates.find((t) => t.report_type === type);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <Link to="/reports" className="text-sm text-text-muted hover:text-primary">
        ← Reports Hub
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-text">Upload Excel Templates</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-muted">
        Upload your official <strong>.xlsx</strong> files (formulas are kept). Clear an old template
        first if you are replacing it with a new file.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Currently stored templates
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(['STEWA', 'SWA', 'IAR'] as const).map((type) => {
            const info = getInfo(type);
            return (
              <div
                key={type}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  info?.exists
                    ? 'border-primary/40 bg-primary-light/40'
                    : 'border-border bg-surface-muted/50'
                }`}
              >
                <span className={`text-xl ${info?.exists ? 'text-primary' : 'text-text-muted'}`}>
                  {info?.exists ? '✓' : '○'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">{type}</p>
                  {info?.exists ? (
                    <>
                      <p className="truncate text-sm text-text">{info.filename}</p>
                      <p className="text-xs text-text-muted">
                        {info.file_size_label} · Uploaded {info.uploaded_at}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3">
                        {info.download_url && (
                          <a
                            href={info.download_url}
                            className="text-xs font-medium text-primary underline"
                            download
                          >
                            Download
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => clearTemplate(type)}
                          disabled={clearing === type}
                          className="text-xs font-medium text-red-600 underline disabled:opacity-50"
                        >
                          {clearing === type ? 'Clearing…' : 'Clear'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-text-muted">No template uploaded yet</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(['STEWA', 'SWA', 'IAR'] as const).map((type) => {
          const info = getInfo(type);
          const isDragging = dragOver === type;
          const isUploading = uploading === type;

          return (
            <div key={type} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-text">{type} Excel Template</p>
                {info?.exists && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Saves to templates/excel/{type}.xlsx — Excel formulas are preserved
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(type);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) upload(type, file);
                }}
                className={`mt-4 flex flex-col items-center rounded-xl border-2 border-dashed py-10 transition ${
                  isDragging
                    ? 'border-primary bg-primary-light/40'
                    : 'border-primary/30 bg-primary-light/10 hover:border-primary/50'
                }`}
              >
                {isUploading ? (
                  <span className="text-sm font-semibold text-primary">Uploading…</span>
                ) : (
                  <>
                    <span className="text-3xl">📄</span>
                    <span className="mt-2 text-sm font-semibold text-primary">
                      {isDragging ? 'Drop file here' : `Upload or drag ${type}.xlsx`}
                    </span>
                    <label className="mt-3 cursor-pointer rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark">
                      Choose file
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => upload(type, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </>
                )}
              </div>

              {info?.exists && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary-light/30 px-3 py-2 text-xs text-primary">
                  <span>
                    <strong>Stored:</strong> {info.filename} ({info.file_size_label})
                  </span>
                  <button
                    type="button"
                    onClick={() => clearTemplate(type)}
                    disabled={clearing === type}
                    className="font-semibold text-red-600 underline disabled:opacity-50"
                  >
                    {clearing === type ? 'Clearing…' : 'Clear template'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <div className="mt-6 rounded-xl bg-primary-light p-4 text-sm font-medium text-primary">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-sm">
        <h2 className="font-semibold text-text">How to replace a template with formulas</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-text-muted">
          <li>
            Click <strong>Clear template</strong> on STEWA, SWA, or IAR to remove the old file.
          </li>
          <li>Prepare your new Excel file with formulas and placeholders like{' '}
            <code>{'{{project_name}}'}</code>.</li>
          <li>Upload or drag the new <code>.xlsx</code> into the box — it becomes Active.</li>
        </ol>
      </div>

      <SubmissionSuccessSign
        open={showSuccess}
        title="Submission Successful"
        message={successType ? `${successType} template file uploaded.` : undefined}
        onClose={() => setShowSuccess(false)}
      />
    </main>
  );
}
