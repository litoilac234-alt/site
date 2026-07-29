import { calculatePdmSchedule, getCriticalPath } from './pdm';
import type { BarChartTask, PdmActivity, PdmDependency } from '../types';

export function deriveBarChartFromPdm(
  activities: PdmActivity[],
  dependencies: PdmDependency[],
  existingTasks: BarChartTask[] = [],
): {
  activities: PdmActivity[];
  barChartTasks: BarChartTask[];
  projectDuration: number;
  criticalPath: string[];
  pdmError: string | null;
} {
  if (activities.length === 0) {
    return {
      activities: [],
      barChartTasks: [],
      projectDuration: 0,
      criticalPath: [],
      pdmError: null,
    };
  }

  const scheduled = calculatePdmSchedule(activities, dependencies);
  if (scheduled.length !== activities.length) {
    return {
      activities,
      barChartTasks: existingTasks,
      projectDuration: 0,
      criticalPath: [],
      pdmError: 'Circular dependency detected',
    };
  }

  const actualByName = new Map(
    existingTasks.filter((t) => t.actualEndDay != null).map((t) => [t.name, t.actualEndDay]),
  );

  const barChartTasks: BarChartTask[] = scheduled.map((a, i) => ({
    id: existingTasks.find((t) => t.name === a.name)?.id ?? `derived-${a.id}`,
    index: i + 1,
    name: a.name,
    startDay: (a.es ?? 0) + 1,
    endDay: Math.max((a.es ?? 0) + 1, a.ef ?? a.duration),
    actualEndDay: actualByName.get(a.name),
  }));

  const projectDuration = Math.max(...scheduled.map((a) => a.ef ?? 0), 0);

  return {
    activities: scheduled,
    barChartTasks,
    projectDuration,
    criticalPath: getCriticalPath(scheduled).map((a) => a.number),
    pdmError: null,
  };
}

export function applyPdmDerivatives<T extends {
  activities: PdmActivity[];
  dependencies: PdmDependency[];
  barChartTasks: BarChartTask[];
  barChartTotalDays: number;
  projectDuration: number;
  criticalPath: string[];
  pdmError?: string | null;
}>(schedule: T): T {
  const derived = deriveBarChartFromPdm(
    schedule.activities,
    schedule.dependencies,
    schedule.barChartTasks,
  );
  return {
    ...schedule,
    activities: derived.activities,
    barChartTasks: derived.barChartTasks,
    barChartTotalDays: Math.max(1, derived.projectDuration),
    projectDuration: derived.projectDuration,
    criticalPath: derived.criticalPath,
    pdmError: derived.pdmError,
  };
}
