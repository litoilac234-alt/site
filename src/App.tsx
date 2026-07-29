import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PdmPage } from './pages/PdmPage';
import { BarChartPage } from './pages/BarChartPage';
import { SCurvePage } from './pages/SCurvePage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportCreatePage } from './pages/ReportCreatePage';
import { TemplateManagePage } from './pages/TemplateManagePage';
import { WorkflowPage } from './pages/WorkflowPage';
import { VerifyPage } from './pages/VerifyPage';
import { SwaStewaHubPage } from './pages/SwaStewaHubPage';
import { SwaStewaEditorPage } from './pages/SwaStewaEditorPage';
import { SwaStewaTemplatePage } from './pages/SwaStewaTemplatePage';
import { PublicReportViewPage } from './pages/PublicReportViewPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ScheduleEditorPage } from './pages/ScheduleEditorPage';
import type { Role } from './types';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-muted">
        Loading session…
      </div>
    );
  }
  if (!user) return <Navigate to="/roles" replace />;
  return <>{children}</>;
}

function RoleRoute({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/roles" element={<RoleSelectionPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/reports/view/:reportNumber" element={<PublicReportViewPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/projects"
          element={
            <RoleRoute roles={['engineer_1']}>
              <ProjectsPage />
            </RoleRoute>
          }
        />
        <Route path="/pdm" element={<PdmPage />} />
        <Route path="/bar-chart" element={<BarChartPage />} />
        <Route
          path="/schedule"
          element={
            <RoleRoute roles={['contractor']}>
              <ScheduleEditorPage />
            </RoleRoute>
          }
        />
        <Route path="/s-curve" element={<SCurvePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/create/:type" element={<ReportCreatePage />} />
        <Route
          path="/reports/templates"
          element={
            <RoleRoute roles={['engineer_4']}>
              <TemplateManagePage />
            </RoleRoute>
          }
        />
        <Route
          path="/workflow"
          element={
            <RoleRoute roles={['engineer_1', 'engineer_2', 'engineer_3', 'engineer_4']}>
              <WorkflowPage />
            </RoleRoute>
          }
        />
        <Route path="/swa-stewa" element={<SwaStewaHubPage />} />
        <Route path="/swa-stewa/new/:type" element={<SwaStewaEditorPage />} />
        <Route path="/swa-stewa/edit/:id" element={<SwaStewaEditorPage />} />
        <Route
          path="/swa-stewa/templates"
          element={
            <RoleRoute roles={['engineer_4']}>
              <SwaStewaTemplatePage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
