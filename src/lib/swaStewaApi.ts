import { apiFetch } from './http';
import { apiUrl } from './paths';

const API = apiUrl('swa_stewa.php');

export type SwaStewaStatus =
  | 'draft'
  | 'pending_review'
  | 'with_engineer_3'
  | 'with_engineer_4'
  | 'approved'
  | 'rejected'
  | 'generated';

export interface SwaStewaReport {
  id: number;
  report_number: string;
  project_id: number;
  report_type: 'SWA' | 'STEWA' | 'IAR';
  report_data: Record<string, unknown>;
  line_items: import('./workItems').WorkItem[];
  pdf_file?: string;
  qr_code?: string;
  public_url?: string;
  status: SwaStewaStatus;
  project_name?: string;
  rejection_reason?: string;
  created_at: string;
  generated_at?: string;
}

async function request(url: string, options?: RequestInit) {
  return apiFetch(url, options);
}

export function verifyReportQr(qr: string) {
  return request(`${API}?action=verify&qr=${encodeURIComponent(qr)}`) as Promise<{
    valid: boolean;
    verified?: boolean;
    report?: SwaStewaReport;
    message?: string;
  }>;
}

export function listReports(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`${API}${qs}`) as Promise<{ reports: SwaStewaReport[] }>;
}

export function getReport(idOrNumber: string) {
  return request(
    `${API}?${idOrNumber.includes('-') ? 'report_number' : 'id'}=${encodeURIComponent(idOrNumber)}`,
  ) as Promise<{ report: SwaStewaReport; valid?: boolean; verified?: boolean; pdf_url?: string }>;
}

export function saveReport(payload: {
  id?: number;
  report_type: 'SWA' | 'STEWA' | 'IAR';
  project_id: number;
  report_data: Record<string, unknown>;
  line_items?: import('./workItems').WorkItem[];
  created_by?: number;
}) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', ...payload }),
  }) as Promise<{ report: SwaStewaReport }>;
}

export function previewReport(payload: Parameters<typeof saveReport>[0]) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'preview', ...payload }),
  }) as Promise<{ report: SwaStewaReport; preview_html: string }>;
}

export function submitReport(reportId: number, actorId?: number) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'submit', report_id: reportId, actor_id: actorId }),
  });
}

export function approveReport(
  reportId: number,
  actorId?: number,
  actorRole?: string,
  generate?: { s_curve?: boolean; pdm?: boolean; bar_chart?: boolean },
) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve',
      report_id: reportId,
      actor_id: actorId,
      actor_role: actorRole,
      generate,
    }),
  }) as Promise<{ status: string; message?: string; pdf_url?: string; public_url?: string }>;
}

export function rejectReport(reportId: number, reason: string, actorId?: number) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reject', report_id: reportId, reason, actor_id: actorId }),
  });
}

export function emailApproveFromLink(reportId: number, token: string) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'email_approve', report_id: reportId, token }),
  }) as Promise<{ status: string; message: string }>;
}

export function emailReviseFromLink(reportId: number, token: string, reason: string) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'email_revise', report_id: reportId, token, reason }),
  }) as Promise<{ status: string; message: string }>;
}

export function regeneratePdf(reportIdOrNumber: number | string, actorId?: number) {
  const body: Record<string, unknown> = {
    action: 'regenerate_pdf',
    actor_id: actorId,
  };
  if (typeof reportIdOrNumber === 'number') {
    body.report_id = reportIdOrNumber;
  } else {
    body.report_number = reportIdOrNumber;
  }
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Promise<{ pdf_url: string; xlsx_url?: string }>;
}

export function deleteReport(reportId: number) {
  return request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', report_id: reportId }),
  });
}
