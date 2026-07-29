import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardHeader } from '../components/DashboardHeader';
import { KpiCards } from '../components/KpiCards';
import { ProgressChart } from '../components/ProgressChart';
import { ManagementAlerts } from '../components/ManagementAlerts';
import { RecentActivities } from '../components/RecentActivities';
import { getDashboardStats, type DashboardData } from '../lib/dashboardApi';

const isReviewerRole = (role: string) =>
  role === 'engineer_2' || role === 'engineer_3' || role === 'engineer_4';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const isContractor = user.role === 'contractor';
  const isReviewer = isReviewerRole(user.role);

  const scheduleSection = (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
      <div>
        <p className="font-medium text-text">
          {isContractor ? 'Construction schedule' : 'Project schedules'}
        </p>
        <p className="text-sm text-text-muted">
          {isContractor
            ? 'Enter PDM activities and bar chart tasks, then preview critical path and progress.'
            : 'View PDM network diagrams and bar charts from saved contractor schedules.'}
        </p>
      </div>
      <Link
        to={isContractor ? '/schedule' : '/pdm'}
        className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
      >
        {isContractor ? 'Prepare schedule' : 'Open PDM'}
      </Link>
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto">
      <DashboardHeader role={user.role} period={stats?.period} />
      <div className="space-y-6 px-8 pb-10">
        {isContractor && scheduleSection}
        <KpiCards
          kpis={stats?.kpis}
          loading={loading}
          cards={
            isContractor
              ? ['visibleProjects', 'delayedProjects']
              : isReviewer
                ? ['visibleProjects', 'pendingApprovals', 'delayedProjects']
                : undefined
          }
        />
        {isReviewer ? (
          <>
            <ManagementAlerts role={user.role} />
            <RecentActivities />
          </>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ProgressChart />
              </div>
              <ManagementAlerts role={user.role} />
            </div>
            {!isContractor && scheduleSection}
          </>
        )}
      </div>
    </main>
  );
}
