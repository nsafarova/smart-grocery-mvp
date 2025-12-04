'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ email: string; name: string | null }>>([]);
  const { login, user } = useUser();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Load available users on mount
  useEffect(() => {
    api.getUsers()
      .then(users => {
        setAvailableUsers(users.map(u => ({ email: u.email, name: u.name })));
      })
      .catch(() => {
        // If API fails, use hardcoded demo users
        setAvailableUsers([
          { email: 'demo@smartgrocery.app', name: 'Demo User' },
          { email: 'sarah@smartgrocery.app', name: 'Sarah Johnson' },
          { email: 'mike@smartgrocery.app', name: 'Mike Chen' },
          { email: 'emily@smartgrocery.app', name: 'Emily Rodriguez' },
        ]);
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🥫</h1>
          <h2 className="text-2xl font-bold mb-2">SmartPantry</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to manage your pantry
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@smartgrocery.app"
                required
                className="input w-full"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(231, 111, 81, 0.1)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {availableUsers.length > 0 && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Quick Login (Demo Users):
              </p>
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleQuickLogin(user.email)}
                    className="w-full text-left p-3 rounded-lg hover:opacity-80 transition"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {user.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          For demo purposes, use any email from the list above
        </p>
      </div>
    </div>
  );
}

