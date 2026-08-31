import { apiFetch } from './http';
import { apiUrl } from './paths';

export interface ProjectRow {
  id: number;
  name: string;
  location: string | null;
  status: string;
  start_date?: string | null;
  planned_end_date?: string | null;
  contractor_id?: number | null;
  contractor_name?: string | null;
  contract_amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ContractorOption {
  id: number;
  full_name: string;
  email: string;
}

export interface ProjectAuditEntry {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_name?: string | null;
}

export interface ContractHistoryEntry {
  id: number;
  contract_amount: number;
  effective_date: string;
  vo_reference: string | null;
  notes: string | null;
  created_at: string;
  created_by_name?: string | null;
}

export interface ProjectReportDefaults {
  contractor: string;
  start_date: string | null;
  contract_amount: string | null;
  project_name: string;
  location: string | null;
}

export interface ProjectInput {
  name: string;
  location?: string;
  start_date?: string;
  planned_end_date?: string;
  status?: string;
  contractor_id?: number | null;
  contract_amount?: number | null;
}

export function listProjects() {
  return apiFetch<{ projects: ProjectRow[] }>(apiUrl('projects.php'));
}

export function listContractors() {
  return apiFetch<{ contractors: ContractorOption[] }>(apiUrl('projects.php?contractors=1'));
}

export function getProject(id: number) {
  return apiFetch<{
    project: ProjectRow;
    audit_log: ProjectAuditEntry[];
    contract_history: ContractHistoryEntry[];
    report_defaults: ProjectReportDefaults;
  }>(apiUrl(`projects.php?id=${id}`));
}

export function createProject(input: ProjectInput) {
  return apiFetch<{ project: ProjectRow }>(apiUrl('projects.php'), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProject(id: number, input: ProjectInput) {
  return apiFetch<{ project: ProjectRow }>(apiUrl('projects.php'), {
    method: 'PUT',
    body: JSON.stringify({ id, ...input }),
  });
}
