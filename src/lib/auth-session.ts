import { AUTH_SESSION_MARKER } from '@/lib/api/client';

export interface StoredUser {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  grade?: number;
  must_change_password?: boolean;
}

export function persistAuthSession(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', AUTH_SESSION_MARKER);
  localStorage.setItem('user', JSON.stringify(user));
}

export function updateStoredUser(updates: Partial<StoredUser>): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem('user');
  if (!raw) return;

  try {
    const current = JSON.parse(raw) as StoredUser;
    localStorage.setItem('user', JSON.stringify({ ...current, ...updates }));
  } catch {
    localStorage.removeItem('user');
  }
}

export function clearLocalAuthState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_grade');
  localStorage.removeItem('student_id');
}

export async function clearAuthSession(): Promise<void> {
  clearLocalAuthState();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true,
    });
  } catch {
    // Local state is already cleared; the session cookie will expire naturally.
  }
}

export function getPostPasswordChangePath(role?: string): string {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'CONTENTCREATOR':
    case 'CONTENTVALIDATOR':
      return '/content/dashboard';
    case 'TEACHER':
      return '/parent-teacher/dashboard/teacher';
    case 'HEADTEACHER':
      return '/parent-teacher/dashboard/headteacher';
    case 'PARENT':
      return '/parent-teacher/dashboard';
    case 'STUDENT':
      return '/dashboard';
    default:
      return '/sign-in';
  }
}
