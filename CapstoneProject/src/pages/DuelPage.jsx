import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Trophy, Swords, Sparkles, ArrowRight, LogOut } from 'lucide-react';
import {
  getRoomSnapshot,
  subscribeToRoom,
  getLocalPlayer,
  advanceDuelWinner,
  leaveRoom,
} from '../services/realtimeStore';
import { getRoundLabel } from '../services/bracketEngine';
import InteractiveDuelGames from '../components/InteractiveDuelGames';
import AuthGate from '../components/AuthGate';

export default function DuelPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const roomCode = (code || '').toUpperCase();

  const [snapshot, setSnapshot] = useState(() => getRoomSnapshot(roomCode));
  const [localPlayer, setLocalPlayerState] = useState(() => getLocalPlayer(roomCode));
  const [pointsA, setPointsA] = useState(0);
  const [pointsB, setPointsB] = useState(0);
  const [userSideChoice, setUserSideChoice] = useState('A');

  useEffect(() => {
    return subscribeToRoom(roomCode, (data) => {
      setSnapshot(data);
      const p = getLocalPlayer(roomCode);
      if (p) setLocalPlayerState(p);

      if (data?.room?.status === 'finished') {
        navigate(`/room/${roomCode}/result`);
      } else if (data?.room?.status === 'lobby') {
        navigate(`/room/${roomCode}`);
      }
    });
  }, [roomCode, navigate]);

  if (!snapshot) {
    return (
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
    );
  }

  if (!localPlayer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-4">
          <h2 className="text-xl font-extrabold text-white">Please Join First</h2>
          <p className="text-xs text-slate-400">You need a participant nickname to battle in this duel.</p>
          <button
            onClick={() => navigate(`/room/${roomCode}`)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition"
          >
            Go to Lobby
          </button>
        </div>
      </div>
    );
  }

  const { room, options = [], duels = [] } = snapshot;
  const optionMap = Object.fromEntries(options.map((o) => [o.option_id, o]));

  const currentRoundDuels = duels.filter((d) => d.round_no === room.current_round);
  const playableDuels = currentRoundDuels.filter((d) => !d.is_bye);

  const activeDuel =
    duels.find((d) => d.duel_id === room.current_duel_id) ||
    playableDuels.find((d) => !d.winner_id) ||
    currentRoundDuels[0];

  if (!activeDuel) return null;

  const optA = optionMap[activeDuel.option_a_id];
  const optB = activeDuel.option_b_id ? optionMap[activeDuel.option_b_id] : null;

  const roundLabel = getRoundLabel(
    room.current_round,
    room.total_rounds || 1,
    currentRoundDuels.length
  );

  const chosenSide = userSideChoice;
  const isHost = Boolean(localPlayer?.is_host);
  const [hostForceTimer, setHostForceTimer] = useState(null);

  // Reset points and timers when match/duelId changes
  useEffect(() => {
    setPointsA(0);
    setPointsB(0);
    setHostForceTimer(null);
  }, [activeDuel.duel_id]);

  const handleTriggerHostForceAdvance = () => {
    if (!isHost) return;
    setHostForceTimer(10);
  };

  useEffect(() => {
    if (hostForceTimer === null) return;
    if (hostForceTimer <= 0) {
      handleFinishDuelViaMiniGame('Host Stall Override');
      setHostForceTimer(null);
      return;
    }
    const interval = setInterval(() => {
      setHostForceTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [hostForceTimer]);

  const handleAwardPoints = (side, pts) => {
    if (side === 'A') {
      setPointsA((prev) => prev + pts);
    } else {
      setPointsB((prev) => prev + pts);
    }
  };

  const handleFinishDuelViaMiniGame = async (gameName) => {
    let finalA = pointsA;
    let finalB = pointsB;
    // Tiebreaker: If points are tied, award golden point to decide winner
    if (finalA === finalB) {
      if (Math.random() < 0.5) finalA += 1;
      else finalB += 1;
    }

    const winnerId = finalA >= finalB ? activeDuel.option_a_id : activeDuel.option_b_id;
    const winnerOpt = optionMap[winnerId];

    try {
      await advanceDuelWinner(
        roomCode,
        activeDuel.duel_id,
        winnerId,
        true,
        gameName || 'Fall Guys Arena',
        `Mini-Game Victor: ${winnerOpt?.label || 'Winner'} (${Math.max(finalA, finalB)} pts)`
      );
    } catch (err) {
      alert(err.message || 'Error advancing duel');
    }
  };

  const handleLeaveDuel = async () => {
    if (window.confirm('Are you sure you want to leave this duel midgame? The match rounds will adjust for remaining players.')) {
      try {
        if (localPlayer) {
          await leaveRoom(roomCode, localPlayer.player_id);
        }
      } catch (err) {
        console.error(err);
      }
      navigate('/');
    }
  };

  return (
    <AuthGate roomCode={roomCode}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Duel Header */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-violet-600/30">
                👑 {roundLabel} • MATCH {activeDuel.duel_index} OF {playableDuels.length}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Room {roomCode}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white">
              {room.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hostForceTimer !== null ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black animate-pulse flex items-center gap-2">
                <span>⚠️ Auto-resolving in {hostForceTimer}s...</span>
                {isHost && (
                  <button
                    type="button"
                    onClick={() => handleFinishDuelViaMiniGame('Host Immediate Advance')}
                    className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[10px] uppercase font-black transition"
                  >
                    Skip Wait
                  </button>
                )}
              </div>
            ) : isHost ? (
              <button
                type="button"
                onClick={handleTriggerHostForceAdvance}
                title="Host Power: If players are AFK or stalling, start a 10s countdown to resolve this match"
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
              >
                <span>⚡ Force Advance (10s)</span>
              </button>
            ) : null}

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-black shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Mini-Game Decides Winner</span>
            </div>

            <button
              type="button"
              onClick={handleLeaveDuel}
              title="Leave match midgame"
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Leave Match</span>
            </button>
          </div>
        </div>

        {/* Midgame Player Adjustment Notice */}
        {snapshot.players?.length === 1 && (
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <span>A player left the duel midgame. Match rounds have been dynamically adjusted so you can crown your champion without waiting!</span>
          </div>
        )}

        {/* Head-to-Head Contenders Clash & Live Match Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contender A Card */}
          <div
            className={`rounded-3xl p-6 border-2 transition flex items-center justify-between gap-4 relative overflow-hidden ${
              chosenSide === 'A'
                ? 'bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border-violet-400 shadow-xl shadow-violet-600/25 ring-2 ring-violet-400/50'
                : 'glass-card border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-4xl sm:text-5xl shrink-0 drop-shadow-md">{optA?.emoji || '🍕'}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-400">
                  Contender A
                </div>
                <div className="font-black text-white text-lg sm:text-xl truncate">
                  {optA?.label}
                </div>
                <button
                  type="button"
                  onClick={() => setUserSideChoice('A')}
                  className={`mt-1.5 px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                    chosenSide === 'A'
                      ? 'bg-violet-500 text-white shadow-md'
                      : 'bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {chosenSide === 'A' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Backing A</span>
                    </>
                  ) : (
                    <span>Tap to Back A</span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-3xl sm:text-4xl font-black text-violet-300 font-mono">
                {pointsA}
              </div>
              <div className="text-[10px] font-black uppercase text-slate-500">POINTS</div>
            </div>
          </div>

          {/* Contender B Card */}
          <div
            className={`rounded-3xl p-6 border-2 transition flex items-center justify-between gap-4 relative overflow-hidden ${
              chosenSide === 'B'
                ? 'bg-gradient-to-br from-pink-900/60 to-rose-900/60 border-pink-400 shadow-xl shadow-pink-600/25 ring-2 ring-pink-400/50'
                : 'glass-card border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-4xl sm:text-5xl shrink-0 drop-shadow-md">{optB?.emoji || '🎬'}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                  Contender B
                </div>
                <div className="font-black text-white text-lg sm:text-xl truncate">
                  {optB?.label}
                </div>
                <button
                  type="button"
                  onClick={() => setUserSideChoice('B')}
                  className={`mt-1.5 px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                    chosenSide === 'B'
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {chosenSide === 'B' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Backing B</span>
                    </>
                  ) : (
                    <span>Tap to Back B</span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-3xl sm:text-4xl font-black text-pink-300 font-mono">
                {pointsB}
              </div>
              <div className="text-[10px] font-black uppercase text-slate-500">POINTS</div>
            </div>
          </div>
        </div>

        {/* Live Fall Guys Mini-Game Arena (Automatically generated for this duel) */}
        <InteractiveDuelGames
          duelId={activeDuel.duel_id}
          optA={optA}
          optB={optB}
          chosenSide={chosenSide}
          pointsA={pointsA}
          pointsB={pointsB}
          onAwardPoints={handleAwardPoints}
          onFinishDuel={handleFinishDuelViaMiniGame}
        />
      </div>
    </AuthGate>
  );
}
