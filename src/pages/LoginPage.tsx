import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OFFICE_NAME, PEO_LOGO } from '../lib/branding';
import { DEMO_ACCOUNTS_BY_ROLE, ROLE_LABELS, type Role } from '../types';

const VALID_ROLES: Role[] = [
  'engineer_1',
  'engineer_2',
  'engineer_3',
  'engineer_4',
  'contractor',
];

export function LoginPage() {
  const { role: roleParam } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login, setSelectedRole, selectedRole } = useAuth();

  const role = VALID_ROLES.includes(roleParam as Role)
    ? (roleParam as Role)
    : selectedRole;

  const accounts = role ? DEMO_ACCOUNTS_BY_ROLE[role] : [];
  const [email, setEmail] = useState(accounts[0]?.email ?? '');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-muted">
          No role selected.{' '}
          <Link to="/roles" className="text-primary underline">
            Choose a role
          </Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await login(email, password, role);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password for this role.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8e8e6] via-surface to-surface-muted p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <img
            src={PEO_LOGO}
            alt={OFFICE_NAME}
            className="h-20 w-20 object-contain"
          />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Secure sign in
          </p>
          <h1 className="mt-1 text-xl font-bold text-text">PEO Monitoring access</h1>
          <p className="mt-1 text-sm text-text-muted">{ROLE_LABELS[role]} workspace</p>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-primary-light px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Selected role
            </p>
            <p className="font-semibold text-text">{ROLE_LABELS[role]}</p>
          </div>
          <Link
            to="/roles"
            onClick={() => setSelectedRole(null)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-muted transition hover:text-text"
          >
            Change role
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {accounts.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-text">Account</label>
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {accounts.map((acc) => (
                  <option key={acc.email} value={acc.email}>
                    {acc.name} — {acc.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-text">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Open dashboard
          </button>
        </form>

        <div className="mt-6 flex justify-between text-xs text-text-muted">
          <Link to="/" className="hover:text-text">
            Back to landing
          </Link>
          <span>Permissions are verified after sign in.</span>
        </div>

        <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-center text-xs text-text-muted">
          Demo password: <strong>demo123</strong>
        </p>
      </div>
    </div>
  );
}
