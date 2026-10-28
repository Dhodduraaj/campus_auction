import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Lock, AlertCircle, Gavel, Tag, Check } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'JUNIOR' | 'SENIOR'>('JUNIOR');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      // Redirect to appropriate dashboard based on registered role
      if (user.role === 'SENIOR') {
        onNavigate('my-listings');
      } else {
        onNavigate('marketplace');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. College email may already be registered.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-4">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-7 shadow-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded bg-orange-600 text-white font-display font-black text-xl flex items-center justify-center mx-auto mb-2">
            C
          </div>
          <h1 className="font-display font-black text-2xl text-slate-900 dark:text-white">
            Register
          </h1>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Junior Role Card */}
              <button
                type="button"
                onClick={() => setRole('JUNIOR')}
                className={`relative p-3.5 rounded-lg border text-left transition-all ${
                  role === 'JUNIOR'
                    ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/30 text-slate-900 dark:text-white ring-2 ring-orange-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center ${
                      role === 'JUNIOR'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Gavel className="w-4 h-4" />
                  </div>
                  {role === 'JUNIOR' && (
                    <div className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Junior</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Bid on items
                </div>
              </button>

              {/* Senior Role Card */}
              <button
                type="button"
                onClick={() => setRole('SENIOR')}
                className={`relative p-3.5 rounded-lg border text-left transition-all ${
                  role === 'SENIOR'
                    ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/30 text-slate-900 dark:text-white ring-2 ring-orange-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center ${
                      role === 'SENIOR'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  {role === 'SENIOR' && (
                    <div className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">Senior</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Sell items
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              College Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="College email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-display font-bold text-sm uppercase tracking-wider py-2.5 rounded shadow-sm transition-colors disabled:opacity-50 mt-2"
          >
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
