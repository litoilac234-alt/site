import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AGENCY_NAME, OFFICE_NAME } from '../lib/branding';
import { ROLE_LABELS, type Role } from '../types';
import { Logo } from './Logo';

/** Slim nav for Engineer II / III / IV — schedule & report tools live under Documents. */
const REVIEWER_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/reports', label: 'Documents', icon: '📄' },
  { to: '/workflow', label: 'For Approval', icon: '✓' },
];

const NAV_BY_ROLE: Record<Role, { to: string; label: string; icon: string }[]> = {
  engineer_1: [
    { to: '/dashboard', label: 'Dashboard', icon: '▦' },
    { to: '/projects', label: 'Projects', icon: '🏗' },
    { to: '/pdm', label: 'PDM Schedule', icon: '◇' },
    { to: '/bar-chart', label: 'Bar Chart', icon: '▬' },
    { to: '/s-curve', label: 'S-Curve', icon: '⌇' },
    { to: '/reports', label: 'Reports', icon: '📄' },
    { to: '/workflow', label: 'My Submissions', icon: '✎' },
  ],
  engineer_2: REVIEWER_NAV,
  engineer_3: REVIEWER_NAV,
  engineer_4: REVIEWER_NAV,
  contractor: [
    { to: '/dashboard', label: 'Dashboard', icon: '▦' },
    { to: '/schedule', label: 'Prepare Schedule', icon: '✎' },
    { to: '/bar-chart', label: 'Bar Chart', icon: '▬' },
    { to: '/s-curve', label: 'S-Curve', icon: '⌇' },
    { to: '/pdm', label: 'PDM Schedule', icon: '◇' },
    { to: '/swa-stewa', label: 'IAR', icon: '📋' },
    { to: '/reports', label: 'Reports', icon: '📄' },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const nav = NAV_BY_ROLE[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/80 bg-gradient-to-b from-primary-light/30 to-card p-5">
        <Logo size="sm" />
        <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
          {OFFICE_NAME}
          <br />
          <span className="text-text-muted/80">{AGENCY_NAME} · Progress monitoring</span>
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-text-muted hover:bg-surface-muted hover:text-text'
              }`
            }
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${'opacity-90'}`}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/80 bg-surface-muted/30 p-4">
        <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
          <p className="truncate text-sm font-medium text-text">{user.email}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition hover:bg-surface-muted hover:text-text"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
