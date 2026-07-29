import type { Role, User } from '../types';
import { apiFetch } from './http';
import { apiUrl } from './paths';

const AUTH = apiUrl('auth.php');

export function authMe() {
  return apiFetch<{ user: User | null }>(`${AUTH}?action=me`);
}

export function authLogin(email: string, password: string, role: Role) {
  return apiFetch<{ user: User }>(AUTH, {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
}

export function authLogout() {
  return apiFetch<{ ok: boolean }>(`${AUTH}?action=logout`, { method: 'POST', body: '{}' });
}
