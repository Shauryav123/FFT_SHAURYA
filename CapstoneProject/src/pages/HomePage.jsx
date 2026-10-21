import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swords, Users, ArrowRight, ShieldAlert, Lock, UserCheck, Sparkles, LogIn } from 'lucide-react';
import {
  createRoom,
  joinRoom,
  getCurrentUser,
  subscribeToAuth,
  loginWithGoogle,
} from '../services/realtimeStore';
import { DECISION_PRESETS } from '../services/presets';
import { getFirebaseDiagnostics } from '../services/firebase';
import UserAvatar from '../components/UserAvatar';

export default function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => getCurrentUser());
  const [hostName, setHostName] = useState(() => getCurrentUser()?.fullName || getCurrentUser()?.displayName || '');
  const [decisionTitle, setDecisionTitle] = useState('Where should we eat tonight?');
  const [selectedPreset, setSelectedPreset] = useState('friends_eat');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinNickname, setJoinNickname] = useState(() => getCurrentUser()?.fullName || getCurrentUser()?.displayName || '');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const firebaseDiag = getFirebaseDiagnostics();

  useEffect(() => {
    return subscribeToAuth((u) => {
      setUser(u);
      if (u) {
        const name = u.fullName || u.displayName || u.full_name || '';
        if (name && !hostName) setHostName(name);
        if (name && !joinNickname) setJoinNickname(name);
      }
    });
  }, []);

  const handlePresetClick = (preset) => {
    setSelectedPreset(preset.id);
    setDecisionTitle(preset.title);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!user) {
      navigate('/auth?redirect=/');
      return;
    }

    setIsCreating(true);
    try {
      const { roomCode } = await createRoom({
        hostName: hostName.trim() || user?.fullName || 'Host',
        decisionTitle: decisionTitle.trim() || 'Group Decision',
        presetId: selectedPreset === 'custom' ? null : selectedPreset,
      });
      navigate(`/room/${roomCode}`);
    } catch (err) {
      setCreateError(err.message || 'Could not create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoinError('');
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError('Enter a room code.');
      return;
    }

    if (!user) {
      navigate(`/auth?redirect=/room/${code}`);
      return;
    }

    setIsJoining(true);
    try {
      await joinRoom({
        roomCode: code,
        nickname: joinNickname.trim() || user?.fullName || 'Guest',
      });
      navigate(`/room/${code}`);
    } catch (err) {
      setJoinError(err.message || 'Room not found.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoogleQuickSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      alert(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-black uppercase tracking-widest shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span>Stop Arguing • Start Dueling</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
          Can’t decide? <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            Duel it out.
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Put your group's choices in a single-elimination tournament, battle in live mini-games, and let the arcade crown a winner in 2 minutes.
        </p>
      </div>

      {/* Account / Authentication Banner */}
      {user ? (
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden shadow-xl shadow-emerald-500/5">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar user={user} size="lg" className="ring-2 ring-emerald-500/40" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white truncate">
                  {user.fullName || user.displayName || user.full_name || 'Player'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <UserCheck className="w-3 h-3 text-emerald-400" /> Verified Duelist
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user.email || 'Logged In'}</p>
            </div>
          </div>
          <Link
            to="/auth"
            className="text-xs font-black uppercase tracking-wider text-violet-300 hover:text-white px-4 py-2.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 transition self-start sm:self-auto shrink-0 active:scale-95 flex items-center gap-1.5"
          >
            <span>Account &amp; History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-violet-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-violet-300 tracking-wider flex items-center gap-1.5">
                <span>Sign In to Arena</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Host multiplayer rooms, battle in live mini-games, and track your decision victories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleQuickSignIn}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-md flex items-center gap-2 transition active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? 'Connecting...' : 'Google Sign-In'}</span>
            </button>
            <Link
              to="/auth?redirect=/"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-md shadow-violet-600/30 transition active:scale-95"
            >
              Email Sign-In
            </Link>
          </div>
        </div>
      )}

      {/* Two Action Cards: Host Duel vs Enter Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* 1. Host a Duel Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-violet-500/30 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Host a New Duel</h2>
                <p className="text-xs text-slate-400 mt-0.5">Create a room and invite your friends</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} id="create-form" className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Host Nickname
                </label>
                <input
                  type="text"
                  required
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Shaurya"
                  className="w-full px-4 py-3 rounded-2xl bg-[#131627] border border-white/15 text-white font-bold text-sm placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:bg-[#181C32] transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  What Are You Deciding?
                </label>
                <input
                  type="text"
                  required
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  placeholder="e.g. Where should we eat tonight?"
                  className="w-full px-4 py-3 rounded-2xl bg-[#131627] border border-white/15 text-white font-bold text-sm placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:bg-[#181C32] transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  Quick Category Presets
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {DECISION_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handlePresetClick(preset)}
                      className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-black flex items-center gap-2 transition active:scale-95 ${
                        selectedPreset === preset.id
                          ? 'bg-violet-600/30 border-violet-400 text-white shadow-lg shadow-violet-600/25 ring-1 ring-violet-400/50'
                          : 'bg-[#141829] border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <span className="truncate">{preset.group}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom');
                      setDecisionTitle('');
                    }}
                    className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-black flex items-center gap-2 transition active:scale-95 ${
                      selectedPreset === 'custom'
                        ? 'bg-violet-600/30 border-violet-400 text-white shadow-lg shadow-violet-600/25 ring-1 ring-violet-400/50'
                        : 'bg-[#141829] border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-lg">✏️</span>
                    <span>Custom List</span>
                  </button>
                </div>
              </div>

              {createError && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20">
                  {createError}
                </p>
              )}
            </form>
          </div>

          <button
            type="submit"
            form="create-form"
            disabled={isCreating}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 hover:brightness-110 active:scale-98 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-violet-600/35 flex items-center justify-center gap-2 transition mt-2"
          >
            <span>{isCreating ? 'Creating Duel Arena...' : '🔥 Launch Duel Room →'}</span>
          </button>
        </div>

        {/* 2. Join a Room Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Join with Room Code</h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter a 6-letter room code shared by your friend</p>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} id="join-form" className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  6-Letter Room Code
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K9N4X"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#131627] border border-cyan-500/30 text-cyan-300 font-mono font-black tracking-[0.3em] text-center text-xl uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:bg-[#181C32] transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Nickname
                </label>
                <input
                  type="text"
                  required
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  placeholder="e.g. Priya"
                  className="w-full px-4 py-3 rounded-2xl bg-[#131627] border border-white/15 text-white font-bold text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-[#181C32] transition shadow-inner"
                />
              </div>

              {joinError && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20">
                  {joinError}
                </p>
              )}
            </form>
          </div>

          <button
            type="submit"
            form="join-form"
            disabled={isJoining}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 active:scale-98 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/35 flex items-center justify-center gap-2 transition mt-2"
          >
            <span>{isJoining ? 'Joining Arena...' : '⚡ Enter Arena →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
