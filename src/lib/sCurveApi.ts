import { apiFetch } from './http';
import { apiUrl } from './paths';
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
  }>(apiUrl('s_curve.php', `project_id=${projectId}`));
}
