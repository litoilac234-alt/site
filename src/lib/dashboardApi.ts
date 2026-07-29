import { apiFetch } from './http';
import { apiUrl } from './paths';

export interface DashboardKpi {
  value: number;
  label: string;
}

export interface DashboardData {
  kpis: {
    visibleProjects: DashboardKpi;
    pendingApprovals: DashboardKpi;
    delayedProjects: DashboardKpi;
    inputWarnings: DashboardKpi;
  };
  counts: {
    drafts: number;
    my_drafts: number;
    my_rejected: number;
    approved: number;
  };
  period: string;
}

export function getDashboardStats() {
  return apiFetch<DashboardData>(apiUrl('dashboard.php'));
}
