import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { ROLE_BADGES, ROLE_LABELS, type Role } from '../types';

const ROLES: { id: Role }[] = [
  { id: 'engineer_1' },
  { id: 'engineer_2' },
  { id: 'engineer_3' },
  { id: 'engineer_4' },
  { id: 'contractor' },
];

export function RoleSelectionPage() {
  const { setSelectedRole } = useAuth();
  const navigate = useNavigate();

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    navigate(`/login/${role}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8e8e6] via-surface to-surface-muted p-6">
      <div className="w-full max-w-5xl rounded-3xl border border-border/80 bg-card/70 p-8 shadow-xl backdrop-blur md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <Logo showText={false} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Access role
              </p>
              <h1 className="mt-1 text-2xl font-bold text-text">
                Choose your PEO workspace
              </h1>
              <p className="mt-2 max-w-xl text-sm text-text-muted">
                Select the role that matches your account. The system verifies
                credentials before opening the dashboard.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-text-muted transition hover:text-text"
          >
            Back
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => selectRole(role.id)}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card/90 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-primary-dark transition-transform duration-200 group-hover:scale-x-100" />
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-sm font-bold text-text-muted transition-colors group-hover:border-primary/30 group-hover:bg-primary-light group-hover:text-primary">
                {ROLE_BADGES[role.id]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-text-muted/70">
                  {role.id === 'contractor' ? 'Partner access' : 'PEO staff'}
                </span>
                <span className="mt-0.5 block text-base font-bold text-text">
                  {ROLE_LABELS[role.id]}
                </span>
              </span>
              <span className="shrink-0 text-lg text-text-muted/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
