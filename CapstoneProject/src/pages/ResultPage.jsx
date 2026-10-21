import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  Swords,
  Sparkles,
} from 'lucide-react';
import {
  getRoomSnapshot,
  subscribeToRoom,
  getLocalPlayer,
  resetRoomToLobby,
} from '../services/realtimeStore';
import AuthGate from '../components/AuthGate';

export default function ResultPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const roomCode = (code || '').toUpperCase();

  const [snapshot, setSnapshot] = useState(() => getRoomSnapshot(roomCode));

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'],
      });
    } catch {}

    return subscribeToRoom(roomCode, (data) => {
      setSnapshot(data);
      if (data?.room?.status === 'lobby') {
        navigate(`/room/${roomCode}`);
      } else if (data?.room?.status === 'dueling') {
        navigate(`/room/${roomCode}/duel`);
      }
    });
  }, [roomCode, navigate]);

  if (!snapshot) {
    return (
      <AuthGate roomCode={roomCode}>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-4">
            <h2 className="text-xl font-extrabold text-white">Room "{roomCode}" Not Found</h2>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </AuthGate>
    );
  }

  const { room, options = [], duels = [], votes = [] } = snapshot;
  const optionMap = Object.fromEntries(options.map((o) => [o.option_id, o]));
  const champion =
    optionMap[room.champion_option_id] ||
    optionMap[duels[duels.length - 1]?.winner_id] ||
    options[0];

  const localPlayer = getLocalPlayer(roomCode);
  const isHost = Boolean(localPlayer?.is_host);

  const handlePlayAgain = async () => {
    if (!isHost) return;
    if (window.confirm('Reset this tournament room to the lobby for another round?')) {
      await resetRoomToLobby(roomCode, localPlayer.player_id);
      navigate(`/room/${roomCode}`);
    }
  };

  return (
    <AuthGate roomCode={roomCode}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Winner Podium Card */}
        <div className="relative rounded-3xl p-8 sm:p-12 border-2 border-amber-400/40 bg-gradient-to-b from-amber-500/10 via-[#0E101E]/90 to-[#0A0B14] text-center shadow-2xl shadow-amber-500/10 space-y-6 overflow-hidden">
          {/* Glowing background halo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest shadow-md">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Tournament Champion Crowned!</span>
            </div>

            <div className="text-7xl sm:text-8xl drop-shadow-2xl animate-bounce">
              {champion?.emoji || '🏆'}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Decision: {room.title}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
                {champion?.label || 'Winner'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {isHost ? (
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-violet-600/30 transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again (Host Reset)</span>
                </button>
              ) : (
                <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Waiting for Host ({room.host_name}) to replay...</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>New Decision</span>
              </button>
            </div>
          </div>
        </div>

        {/* Complete Tournament History & Vote Breakdown */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-violet-400" />
              Tournament Match History &amp; Vote Breakdown
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {duels.length} Total Matches
            </span>
          </div>

          <div className="space-y-2.5">
            {duels.map((d) => {
              const optA = optionMap[d.option_a_id];
              const optB = d.option_b_id ? optionMap[d.option_b_id] : null;
              const winOpt = optionMap[d.winner_id];

              const duelVotes = votes.filter((v) => v.duel_id === d.duel_id);
              const countA = duelVotes.filter((v) => v.option_id === d.option_a_id).length;
              const countB = duelVotes.filter((v) => v.option_id === d.option_b_id).length;

              return (
                <div
                  key={d.duel_id}
                  className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-violet-300 bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded-lg text-[10px] uppercase">
                        R{d.round_no} • Match {d.duel_index}
                      </span>
                      {d.is_bye ? (
                        <span className="text-slate-400 italic">
                          {optA?.emoji} <strong className="text-white">{optA?.label}</strong> (Automatic Bye)
                        </span>
                      ) : (
                        <span className="text-slate-200">
                          {optA?.emoji} <strong className="text-white">{optA?.label}</strong> ({countA}v)
                          {' '}vs{' '}
                          {optB?.emoji} <strong className="text-white">{optB?.label}</strong> ({countB}v)
                        </span>
                      )}
                    </div>

                    {d.tiebreak_detail && (
                      <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                        <span>⚡ Sudden Death:</span>
                        <span>{d.tiebreak_detail}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Winner: {winOpt?.label || 'Advanced'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
