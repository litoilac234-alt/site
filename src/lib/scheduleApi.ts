import type { BarChartTask, PdmActivity, PdmDependency } from '../types';
import type { ReportProgressEntry } from '../components/ReportProgressFeed';
import { apiFetch } from './http';
import { apiUrl } from './paths';

const API = apiUrl('schedule.php');

export interface ProjectSchedule {
  project_id: number;
  activities: PdmActivity[];
  dependencies: PdmDependency[];
  barChartTasks: BarChartTask[];
  barChartTotalDays: number;
  barChartTimeNow: number;
  projectDuration: number;
  criticalPath: string[];
  pdmError?: string | null;
  reportFeed?: ReportProgressEntry[];
  latestReportPercent?: number | null;
  latestReportDate?: string | null;
}

async function request(url: string, options?: RequestInit) {
  return apiFetch(url, options);
}

export function getSchedule(projectId = 1) {
  return request(`${API}?action=get&project_id=${projectId}`) as Promise<ProjectSchedule>;
}

export function saveSchedule(payload: {
  project_id: number;
  activities: PdmActivity[];
  dependencies: PdmDependency[];
  barChartTimeNow?: number;
  barChartTasks?: BarChartTask[];
  barChartTotalDays?: number;
}) {
  return request(`${API}?action=save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }) as Promise<ProjectSchedule>;
}

export function clearSchedule(projectId: number) {
  return request(`${API}?action=clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  }) as Promise<ProjectSchedule>;
}

export function loadReferenceSchedule(projectId: number) {
  return request(`${API}?action=load-reference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  }) as Promise<ProjectSchedule>;
}
