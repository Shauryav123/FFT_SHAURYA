import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCheck,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  History,
  Swords,
  ShieldCheck,
} from 'lucide-react';
import {
  getCurrentUser,
  subscribeToAuth,
  loginUser,
  registerUser,
  loginWithGoogle,
  loginDemoUser,
  logoutUser,
  getAllDatabaseSnapshots,
} from '../services/realtimeStore';
import UserAvatar from '../components/UserAvatar';

const AVATARS = ['⚡', '🦊', '🐼', '🦁', '🚀', '🍕', '🎬', '👑'];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/';

  const [user, setUser] = useState(() => getCurrentUser());
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    setRooms(getAllDatabaseSnapshots());
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await registerUser({ fullName, email, password, avatar });
      } else {
        await loginUser({ email, password });
      }
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemoUser();
    navigate(redirectUrl);
  };

  if (user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Logged-in Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5 min-w-0">
            <UserAvatar user={user} size="xl" className="ring-2 ring-violet-500/40" />
            <div className="space-y-1.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5" /> Verified Duelist
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white truncate">
                {user.fullName || user.displayName || user.full_name || 'Player'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {redirectUrl && redirectUrl !== '/' && (
              <button
                onClick={() => navigate(redirectUrl)}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <span>Return to Duel →</span>
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-violet-600/30 active:scale-95"
            >
              <Swords className="w-4 h-4" />
              <span>Create / Join Duel</span>
            </button>
            <button
              onClick={() => logoutUser()}
              className="px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Saved Decision Rooms History */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-black text-white">
                Your Decision Rooms ({rooms.length})
              </h2>
            </div>
          </div>

          {rooms.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-400 py-8 text-center">
              You haven't created any decision rooms yet. Head to Home to start your first tournament!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((snap) => (
                <Link
                  key={snap.room.room_id}
                  to={`/room/${snap.room.room_code}`}
                  className="p-4 rounded-2xl border border-white/10 hover:border-violet-500/40 glass-card hover:bg-white/[0.08] transition flex items-center justify-between group active:scale-98"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono text-[11px] font-black">
                        {snap.room.room_code}
                      </span>
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        {snap.room.status}
                      </span>
                    </div>
                    <div className="font-black text-white truncate text-sm">{snap.room.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {snap.players?.length || 1} players • {snap.options?.length || 0} options
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Player Account &amp; History
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white leading-tight">
            Sign in to track your tournaments &amp; decisions.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Create multi-player rooms, battle friends in real-time mini-games, and save your group decisions.
          </p>

          <div className="p-5 rounded-2xl glass-card border border-white/10 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Quick Evaluation Demo
            </div>
            <p className="text-xs text-slate-400">
              Testing the application? Click below to instantly log in with a pre-configured demo account:
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
            >
              <span>⚡ 1-Click Demo Login (Shaurya Venkta)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6"
        >
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                mode === 'login'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                mode === 'signup'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          {/* 1-Click Google Sign In */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-3 transition transform active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-black uppercase text-slate-500">or with email</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500 text-sm font-medium outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Choose Your Avatar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition border ${
                          avatar === av
                            ? 'bg-violet-600 border-violet-400 shadow-lg shadow-violet-600/30 scale-105'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500 text-sm font-medium outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500 text-sm font-medium outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-violet-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create My Account →'
                : 'Sign In to Arena →'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
