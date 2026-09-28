'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { changePassword } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/client';
import {
  clearAuthSession,
  getPostPasswordChangePath,
  type StoredUser,
  updateStoredUser,
} from '@/lib/auth-session';
import Spinner from '@/components/ui/Spinner';
import { formatErrorMessage, showErrorToast, showSuccessToast } from '@/lib/toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const rawUser = localStorage.getItem('user');
    if (!token || !rawUser) {
      router.replace('/sign-in');
      return;
    }

    try {
      setUser(JSON.parse(rawUser) as StoredUser);
    } catch {
      void clearAuthSession();
      router.replace('/sign-in');
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (form.next.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (form.current === form.next) {
      setError('New password must be different from the current password.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/sign-in');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(
        {
          current_password: form.current,
          new_password: form.next,
          confirm_password: form.confirm,
        },
        token,
      );
      updateStoredUser({ must_change_password: false });
      showSuccessToast('Password changed successfully.');
      router.replace(getPostPasswordChangePath(user?.role));
    } catch (caught) {
      const message = caught instanceof ApiClientError
        ? formatErrorMessage(caught.message)
        : 'Unable to change your password. Please try again.';
      setError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="bg-linear-to-r from-[#1E40AF] to-[#059669] p-6 text-white">
          <div className="flex items-center gap-3">
            <KeyRound aria-hidden="true" className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold">Change your password</h1>
              <p className="mt-1 text-sm text-white/85">Set a private password before continuing.</p>
            </div>
          </div>
        </header>

        <form className="space-y-5 p-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Current password
            <input
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(event) => setForm((current) => ({ ...current, current: event.target.value }))}
              required
              type="password"
              value={form.current}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            New password
            <input
              autoComplete="new-password"
              className="mt-2 h-12 w-full rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              minLength={6}
              onChange={(event) => setForm((current) => ({ ...current, next: event.target.value }))}
              required
              type="password"
              value={form.next}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Confirm new password
            <input
              autoComplete="new-password"
              className="mt-2 h-12 w-full rounded-md border border-gray-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              minLength={6}
              onChange={(event) => setForm((current) => ({ ...current, confirm: event.target.value }))}
              required
              type="password"
              value={form.confirm}
            />
          </label>

          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Spinner size="sm" className="text-white" /> : null}
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </main>
  );
}
