import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Swords, Trophy, LogIn, UserCheck } from 'lucide-react';
import {
  getRoomSnapshot,
  subscribeToRoom,
  getCurrentUser,
  subscribeToAuth,
} from '../services/realtimeStore';
import BracketModal from './BracketModal';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const location = useLocation();
  const [roomCode, setRoomCode] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [showBracket, setShowBracket] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    return subscribeToAuth((u) => setUser(u));
  }, []);

  useEffect(() => {
    const match = location.pathname.match(/^\/room\/([^/]+)/i);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      setRoomCode(code);
      setSnapshot(getRoomSnapshot(code));
      return subscribeToRoom(code, (data) => setSnapshot(data));
    } else {
      setRoomCode(null);
      setSnapshot(null);
    }
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0C0E1A]/85 backdrop-blur-xl shadow-lg shadow-black/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30 group-hover:scale-105 transition">
              <Swords className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-lg bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent">
              Decision Duel
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {roomCode && (
              <button
                onClick={() => setShowBracket(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Bracket</span>
              </button>
            )}

            <Link
              to="/auth"
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition active:scale-95"
            >
              {user ? (
                <>
                  <UserAvatar user={user} size="sm" className="w-5 h-5 !rounded-md text-[9px]" />
                  <span className="truncate max-w-[95px] font-black text-white">
                    {(user.fullName || user.displayName || user.full_name || user.email?.split('@')[0] || 'Player').split(' ')[0]}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sign In</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </header>

      <BracketModal
        isOpen={showBracket}
        onClose={() => setShowBracket(false)}
        snapshot={snapshot}
      />
    </>
  );
}
