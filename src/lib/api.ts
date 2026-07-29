import { apiFetch } from './http';
import { apiUrl } from './paths';

/** Legacy progress report templates (SWA/STEWA/PROGRESS HTML path). */
export function fetchTemplates(type: string) {
  return apiFetch<{
    config: { label: string; description: string; fields: Array<Record<string, unknown>> };
  }>(apiUrl('templates.php', `type=${encodeURIComponent(type)}`));
}

export function generateReport(payload: Record<string, unknown>) {
  return apiFetch<{ preview_url: string; id: number }>(apiUrl('generate_report.php'), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function uploadTemplate(type: string, file: File) {
  const form = new FormData();
  form.append('report_type', type);
  form.append('template_file', file);
  return apiFetch<{ message: string }>(apiUrl('templates.php'), {
    method: 'POST',
    body: form,
  });
}
