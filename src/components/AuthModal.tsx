import { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { User } from '../types/index.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  onNotify,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        onNotify('success', 'Welcome back!', `Signed in as ${res.user.fullName}`);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({ email, username, fullName, password });
        onNotify('success', 'Account created!', `Welcome to FullStack Hub, ${res.user.fullName}`);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      onNotify('error', 'Auth Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.login({ email: userEmail, password: userPass });
      onNotify('success', 'Quick Sign-in Successful', `Logged in as ${res.user.fullName} (${res.user.role})`);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-indigo-600/30 via-emerald-600/20 to-indigo-600/30 p-6 pb-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {mode === 'login' ? 'Sign in to FullStack Hub' : 'Create New Account'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {mode === 'login'
              ? 'Enter your credentials or choose a pre-seeded account for instant access.'
              : 'Sign up to manage tasks, explore endpoints, and inspect logs.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/60 p-1 rounded-xl mt-4 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="px-6 pt-4 pb-1">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant One-Click Demo Access:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin@example.com', 'admin123')}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-left transition-all text-xs group"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300">Admin Account</div>
                  <div className="text-[10px] text-slate-400">admin@example.com</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 shrink-0" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('demo@example.com', 'demo123')}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-left transition-all text-xs group"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-300">Demo User</div>
                  <div className="text-[10px] text-slate-400">demo@example.com</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Username</label>
                <div className="relative">
                  <span className="text-slate-500 font-mono absolute left-3 top-2 text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sarah_c"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              'Sign In with Token'
            ) : (
              'Create Account & Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
