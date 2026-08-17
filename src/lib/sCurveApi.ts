import { apiFetch } from './http';
import { apiUrl } from './paths';
import type { ReportProgressEntry } from '../components/ReportProgressFeed';
import type { SCurvePoint } from '../types';

export interface SCurveActivity {
  number: string;
  name: string;
  duration: number;
  es: number;
  ef: number;
  finish_date: string;
  planned_pct: number;
  is_critical: boolean;
}

export function getSCurve(projectId = 1) {
  return apiFetch<{
    project_id: number;
    project_duration: number;
    critical_path: string[];
    points: SCurvePoint[];
    activities: SCurveActivity[];
    synced_from_pdm: boolean;
    report_feed: ReportProgressEntry[];
    latest_report_percent: number | null;
    latest_report_date: string | null;
  }>(apiUrl('s_curve.php', `project_id=${projectId}`));
}
