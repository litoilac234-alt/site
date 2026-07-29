import { apiFetch } from './http';
import { apiUrl } from './paths';

export interface ProjectRow {
  id: number;
  name: string;
  location: string | null;
  status: string;
}

export function listProjects() {
  return apiFetch<{ projects: ProjectRow[] }>(apiUrl('projects.php'));
}

export interface CreateProjectInput {
  name: string;
  location?: string;
  start_date?: string;
  planned_end_date?: string;
}

export function createProject(input: CreateProjectInput) {
  return apiFetch<{ project: ProjectRow }>(apiUrl('projects.php'), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
