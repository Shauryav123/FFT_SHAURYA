import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  LogIn,
  UserPlus,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  getCurrentUser,
  subscribeToAuth,
  loginUser,
  registerUser,
  loginWithGoogle,
  loginDemoUser,
} from '../services/realtimeStore';

export default function AuthGate({ children, roomCode }) {
  const location = useLocation();
  const [user, setUser] = useState(() => getCurrentUser());
  const [authMode, setAuthMode] = useState('google'); // 'google' | 'email_login' | 'email_signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToAuth((u) => setUser(u));
  }, []);

  if (user) {
    return <>{children}</>;
  }

  const redirectPath = roomCode ? `/room/${roomCode}` : location.pathname;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authMode === 'email_signup') {
        await registerUser({ fullName, email, password });
      } else {
        await loginUser({ email, password });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemoUser();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Player Sign-In Required
          </span>
          <h2 className="font-display text-2xl font-black text-white">
            Join the Arena
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {roomCode
              ? `Sign in to enter Room ${roomCode}, cast your duel vote, and compete in mini-games.`
              : 'Sign in with your account to participate, cast votes, and battle in live mini-games.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 text-left">
            {error}
          </div>
        )}

        {/* 1. Primary: 1-Click Google Sign In */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-md flex items-center justify-center gap-3 transition transform active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center gap-3 my-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              OR EMAIL
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
        </div>

        {/* 2. Email Auth Options */}
        {authMode === 'google' ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setAuthMode('email_login')}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Sign In with Email & Password</span>
            </button>

            <Link
              to={`/auth?redirect=${encodeURIComponent(redirectPath)}`}
              className="block text-xs font-bold text-violet-600 hover:text-violet-800 py-1"
            >
              Open Full Auth Page & Sign Up →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
            {authMode === 'email_signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name / Nickname
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition"
            >
              {loading
                ? 'Processing...'
                : authMode === 'email_signup'
                ? 'Create Account & Join'
                : 'Sign In & Join'}
            </button>

            <div className="flex items-center justify-between text-[11px] font-bold pt-1">
              {authMode === 'email_signup' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('email_login')}
                  className="text-violet-600 hover:underline"
                >
                  Already have an account? Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthMode('email_signup')}
                  className="text-violet-600 hover:underline"
                >
                  Need an account? Sign Up
                </button>
              )}

              <button
                type="button"
                onClick={() => setAuthMode('google')}
                className="text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Evaluation Demo Login */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="text-[11px] text-slate-400 hover:text-violet-600 font-bold transition flex items-center justify-center gap-1 mx-auto"
          >
            <Sparkles className="w-3 h-3" />
            <span>Or quick-join with Demo Profile</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
