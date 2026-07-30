import { apiFetch } from './http';
import { apiUrl } from './paths';

export interface ProjectRow {
  id: number;
  name: string;
  location: string | null;
  status: string;
  start_date?: string | null;
  planned_end_date?: string | null;
}

export function listProjects() {
  return apiFetch<{ projects: ProjectRow[] }>(apiUrl('projects.php'));
}

export interface ProjectInput {
  name: string;
  location?: string;
  start_date?: string;
  planned_end_date?: string;
  status?: string;
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
