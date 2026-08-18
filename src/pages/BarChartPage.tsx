import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { ProjectSelect } from '../components/ProjectSelect';
import { DocumentsBackLink } from '../components/DocumentsBackLink';
import { ReportProgressFeed, type ReportProgressEntry } from '../components/ReportProgressFeed';
import { getSchedule } from '../lib/scheduleApi';
import type { BarChartTask } from '../types';

function getScheduleStatus(
  plannedEnd: number,
  actualEnd: number | null | undefined,
  timeNow: number,
): 'ahead' | 'on' | 'behind' | 'planned' {
  // No reports yet → Target Plan only. Delay / ahead / on-schedule starts after
  // SWA, STEWA, or IAR actual % is recorded.
  if (timeNow < 1 || actualEnd == null) return 'planned';
  if (actualEnd < timeNow && plannedEnd >= timeNow) return 'behind';
  if (actualEnd > plannedEnd) return 'behind';
  if (actualEnd < plannedEnd) return 'ahead';
  if (actualEnd === timeNow || actualEnd === plannedEnd) return 'on';
  return 'on';
}

const STATUS_COLORS = {
  ahead: 'bg-primary',
  on: 'bg-amber-500',
  behind: 'bg-red-500',
  /** Target plan — used when schedule is first entered (no actual progress yet). */
  planned: 'bg-blue-600',
};

function buildWeeks(totalDays: number) {
  const weeks: { label: string; start: number; end: number }[] = [];
  let day = 1;
  let week = 1;
  while (day <= totalDays) {
    const end = Math.min(day + 4, totalDays);
    weeks.push({ label: `Week ${week}`, start: day, end });
    day = end + 1;
    week += 1;
  }
  return weeks;
}

export function BarChartPage() {
  const { user } = useAuth();
  const { projectId, setProjectId } = useSelectedProject();
  const [tasks, setTasks] = useState<BarChartTask[]>([]);
  const [totalDays, setTotalDays] = useState(24);
  const [timeNow, setTimeNow] = useState(10);
  const [reportFeed, setReportFeed] = useState<ReportProgressEntry[]>([]);
  const [latestReportPercent, setLatestReportPercent] = useState<number | null>(null);
  const [latestReportDate, setLatestReportDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getSchedule(Number(projectId));
        if (!cancelled) {
          setTasks(data.barChartTasks);
          setTotalDays(data.barChartTotalDays);
          setTimeNow(data.barChartTimeNow);
          setReportFeed(data.reportFeed ?? []);
          setLatestReportPercent(data.latestReportPercent ?? null);
          setLatestReportDate(data.latestReportDate ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load bar chart from database.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays],
  );
  const weeks = useMemo(() => buildWeeks(totalDays), [totalDays]);
  const hasReportActuals = timeNow >= 1 && latestReportPercent != null;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <DocumentsBackLink />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Bar Chart
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">Construction Schedule Bar Chart</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            When the contractor first enters the PDM, every bar is <strong>Target Plan</strong>{' '}
            (blue). There is no delayed or ahead status yet. After SWA, STEWA, or IAR reports
            record actual %, Time Now and delay colors appear against that target.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ProjectSelect value={projectId} onChange={setProjectId} className="min-w-[200px]" />
          {user?.role === 'contractor' && (
            <Link
              to="/schedule"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Edit schedule
            </Link>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-red-500" /> Behind schedule
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-amber-500" /> On schedule
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-primary" /> Ahead of schedule
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-blue-600" /> Target Plan (first input / no reports yet)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded border-2 border-red-600 bg-blue-600" /> Critical path
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-8 w-3 rounded bg-amber-200 ring-1 ring-amber-500" /> Time Now (latest report)
        </span>
      </div>

      <ReportProgressFeed
        reports={reportFeed}
        latestPercent={latestReportPercent}
        latestDate={latestReportDate}
      />

      {loading ? (
        <p className="text-sm text-text-muted">Loading bar chart…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="w-8 p-2 text-left">#</th>
                <th className="min-w-[200px] p-2 text-left">Task</th>
                {weeks.map((w) => (
                  <th
                    key={w.label}
                    colSpan={w.end - w.start + 1}
                    className="border-l border-border p-2 text-center"
                  >
                    {w.label}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-border bg-surface/80">
                <th colSpan={2} />
                {days.map((d) => (
                  <th
                    key={d}
                    className={`w-7 border-l border-border/50 p-1 text-center font-normal ${
                      hasReportActuals && d === timeNow
                        ? 'bg-amber-100 font-semibold text-amber-900 ring-1 ring-inset ring-amber-400'
                        : 'text-text-muted'
                    }`}
                  >
                    {d}
                    {hasReportActuals && d === timeNow ? (
                      <span className="block text-[8px] font-bold uppercase">Now</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const hasActual = hasReportActuals && task.actualEndDay != null;
                const status = getScheduleStatus(
                  task.endDay,
                  hasReportActuals ? task.actualEndDay : null,
                  timeNow,
                );
                const plannedSpan = Math.max(0, task.endDay - task.startDay + 1);
                const critical = !!task.isCritical;
                return (
                  <tr
                    key={task.id}
                    className={`border-b border-border/50 ${critical ? 'bg-red-50/60' : ''}`}
                  >
                    <td className="p-2 text-text-muted">{task.index}</td>
                    <td className={`p-2 font-medium ${critical ? 'text-red-700' : 'text-text'}`}>
                      {task.name}
                      {critical ? (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-red-600">
                          Critical
                        </span>
                      ) : null}
                    </td>
                    {days.map((d) => {
                      const inPlanned = d >= task.startDay && d <= task.endDay;
                      const isBarStart = d === task.startDay;

                      if (!inPlanned) {
                        return (
                          <td
                            key={d}
                            className={`h-10 min-w-[1.75rem] border-l border-border/30 bg-card ${
                              hasReportActuals && d === timeNow ? 'bg-amber-50/80' : ''
                            }`}
                          />
                        );
                      }

                      if (isBarStart && plannedSpan > 0) {
                        return (
                          <td
                            key={d}
                            colSpan={plannedSpan}
                            className={`relative h-10 border-l border-border/30 bg-card p-1 align-middle ${
                              hasReportActuals && timeNow >= task.startDay && timeNow <= task.endDay
                                ? 'bg-amber-50/40'
                                : ''
                            }`}
                          >
                            <div
                              className={`h-4 w-full rounded-sm ${
                                hasActual ? STATUS_COLORS[status] : STATUS_COLORS.planned
                              } ${critical ? 'ring-2 ring-red-600 ring-offset-1' : ''}`}
                              title={`Days ${task.startDay}–${task.endDay}${
                                hasActual ? ` · actual end ${task.actualEndDay}` : ' · Target Plan'
                              }${critical ? ' · Critical path' : ''}`}
                            />
                          </td>
                        );
                      }

                      return null;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
