import { useEffect, useState, type ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import type { Role, User } from '../types';
import { DEMO_ACCOUNTS } from '../types';
import { authLogin, authLogout, authMe } from '../lib/authApi';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  selectedRole: Role | null;
  setSelectedRole: (role: Role | null) => void;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRoleState] = useState<Role | null>(() => {
    const stored = sessionStorage.getItem('sitetrack_role');
    return stored ? (stored as Role) : null;
  });

  useEffect(() => {
    authMe()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          sessionStorage.setItem('sitetrack_user', JSON.stringify(res.user));
        }
      })
      .catch(() => {
        const stored = sessionStorage.getItem('sitetrack_user');
        if (stored) setUser(JSON.parse(stored) as User);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSelectedRole = useCallback((role: Role | null) => {
    setSelectedRoleState(role);
    if (role) sessionStorage.setItem('sitetrack_role', role);
    else sessionStorage.removeItem('sitetrack_role');
  }, []);

  const login = useCallback(async (email: string, password: string, role: Role) => {
    try {
      const res = await authLogin(email, password, role);
      setUser(res.user);
      sessionStorage.setItem('sitetrack_user', JSON.stringify(res.user));
      return true;
    } catch {
      const account = DEMO_ACCOUNTS[role];
      if (email === account.email && password === account.password) {
        const fallback: User = { id: 0, email, role, name: account.name };
        setUser(fallback);
        sessionStorage.setItem('sitetrack_user', JSON.stringify(fallback));
        return true;
      }
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      /* ignore */
    }
    setUser(null);
    sessionStorage.removeItem('sitetrack_user');
  }, []);

  const value = useMemo(
    () => ({ user, loading, selectedRole, setSelectedRole, login, logout }),
    [user, loading, selectedRole, setSelectedRole, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
