import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

export default function LoginPage() {
  const { login, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Autofill or log in with demo account
      await login('admin@crowdwatch.org', 'password123');
      navigate('/');
    } catch (err: any) {
      setError('Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/15">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access live regional safety reports
          </p>
        </div>

        {isDemoMode && (
          <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 p-4">
            <div className="flex gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-amber-800 font-display">Local Gateway Sandbox Active</h4>
                <p className="mt-1 text-[11px] text-amber-700 leading-relaxed">
                  No running microservice architecture detected on <code>/api</code>. Applet is executing in local storage simulation mode.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              One-Click Quick Sandbox Login
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-600 flex gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/10 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          New to Crowdwatch?{' '}
          <Link to="/signup" className="font-semibold text-rose-500 hover:text-rose-600 hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
