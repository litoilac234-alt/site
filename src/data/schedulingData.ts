import type { BarChartTask, PdmActivity, PdmDependency, SCurvePoint } from '../types';

/** Sample PDM network matching contract reference diagram (A–F) */
export const SAMPLE_PDM_ACTIVITIES: PdmActivity[] = [
  { id: 'a', number: 'A', name: 'Activity A', duration: 3 },
  { id: 'b', number: 'B', name: 'Activity B', duration: 4 },
  { id: 'c', number: 'C', name: 'Activity C', duration: 5 },
  { id: 'd', number: 'D', name: 'Activity D', duration: 2 },
  { id: 'e', number: 'E', name: 'Activity E', duration: 6 },
  { id: 'f', number: 'F', name: 'Activity F', duration: 3 },
];

export const SAMPLE_PDM_DEPENDENCIES: PdmDependency[] = [
  { id: 'd1', fromId: 'a', toId: 'b', type: 'FS' },
  { id: 'd2', fromId: 'b', toId: 'c', type: 'FS' },
  { id: 'd3', fromId: 'd', toId: 'e', type: 'FS' },
  { id: 'd4', fromId: 'e', toId: 'f', type: 'FS' },
  { id: 'd5', fromId: 'd', toId: 'c', type: 'FS' },
];

/** Node positions for network diagram rendering */
export const PDM_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  a: { x: 120, y: 80 },
  b: { x: 280, y: 80 },
  c: { x: 440, y: 80 },
  d: { x: 120, y: 220 },
  e: { x: 280, y: 220 },
  f: { x: 440, y: 220 },
};

export const SAMPLE_BAR_CHART_TASKS: BarChartTask[] = [
  { id: 't1', index: 2, name: 'SITE PREPARATION', startDay: 1, endDay: 5, actualEndDay: 5 },
  { id: 't2', index: 3, name: 'FOOTINGS', startDay: 6, endDay: 10, actualEndDay: 11 },
  { id: 't3', index: 4, name: 'FOUNDATIONS', startDay: 11, endDay: 15, actualEndDay: 15 },
  { id: 't4', index: 5, name: 'TEMPORARY ELECTRIC SERVICE', startDay: 1, endDay: 1, actualEndDay: 1 },
  { id: 't5', index: 6, name: 'WATER AND SEWER TAP', startDay: 6, endDay: 8, actualEndDay: 8 },
  { id: 't6', index: 7, name: 'SOIL TREATMENT', startDay: 11, endDay: 11, actualEndDay: 12 },
  { id: 't7', index: 8, name: 'FRAMING', startDay: 16, endDay: 20, actualEndDay: 18 },
  { id: 't8', index: 10, name: 'ROOF, WINDOWS, EXTERIOR DOORS', startDay: 23, endDay: 24 },
];

export const BAR_CHART_TOTAL_DAYS = 24;
export const BAR_CHART_TIME_NOW = 10;

export const SAMPLE_S_CURVE: SCurvePoint[] = [
  { date: '9-Sep', originalPlan: 0, currentPlan: null, actual: 0 },
  { date: '30-Sep', originalPlan: 5, currentPlan: null, actual: 1 },
  { date: '14-Oct', originalPlan: 13, currentPlan: null, actual: 5 },
  { date: '28-Oct', originalPlan: 21, currentPlan: null, actual: 9 },
  { date: '11-Nov', originalPlan: 30, currentPlan: null, actual: 16 },
  { date: '25-Nov', originalPlan: 39, currentPlan: null, actual: 23 },
  { date: '9-Dec', originalPlan: 49, currentPlan: null, actual: 30 },
  { date: '23-Dec', originalPlan: 58, currentPlan: 42, actual: 43 },
  { date: '13-Jan', originalPlan: 67, currentPlan: 54, actual: 50 },
  { date: '27-Jan', originalPlan: 76, currentPlan: 65, actual: null },
  { date: '10-Feb', originalPlan: 84, currentPlan: 74, actual: null },
  { date: '24-Feb', originalPlan: 91, currentPlan: 82, actual: null },
  { date: '10-Mar', originalPlan: 97, currentPlan: 90, actual: null },
  { date: '31-Mar', originalPlan: 100, currentPlan: 95, actual: null },
  { date: '14-Apr', originalPlan: 100, currentPlan: 98, actual: null },
  { date: '28-Apr', originalPlan: 100, currentPlan: 100, actual: null },
];
