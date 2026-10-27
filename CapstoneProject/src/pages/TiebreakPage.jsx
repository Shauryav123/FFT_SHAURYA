import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Timer,
  Zap,
  Hand,
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Spade,
  Flame,
  RefreshCw,
  Swords,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import {
  getRoomSnapshot,
  subscribeToRoom,
  updateTiebreakState,
  completeTiebreakAndAdvance,
  getLocalPlayer,
  leaveRoom,
} from '../services/realtimeStore';
import {
  fetchTriviaQuestion,
  fetchHighCardDuel,
  fetchMascotClash,
  fetchTiebreakChallengePrompt,
} from '../services/minigameApi';
import AuthGate from '../components/AuthGate';

export default function TiebreakPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const roomCode = (code || '').toUpperCase();

  const [snapshot, setSnapshot] = useState(() => getRoomSnapshot(roomCode));
  const [localPlayer] = useState(() => getLocalPlayer(roomCode));
  const [apiLoading, setApiLoading] = useState(false);
  const [triviaSide, setTriviaSide] = useState('A'); // Which contender the player answers for
  const [selectedTriviaAnswer, setSelectedTriviaAnswer] = useState(null);
  const [challengeFact, setChallengeFact] = useState(null);

  const handleLeaveTiebreak = async () => {
    if (window.confirm('Are you sure you want to leave this tiebreaker? The rounds will adjust for remaining players.')) {
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

  // Auto-advance countdown once a tiebreaker has a winner
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(null);

  // Tap Race Local Timer State
  const [tapRaceRunning, setTapRaceRunning] = useState(false);
  const [tapTimeLeft, setTapTimeLeft] = useState(5.0);
  const tapIntervalRef = useRef(null);

  // Reaction Test State
  const [reactionPhase, setReactionPhase] = useState('idle');
  const greenTimestampRef = useRef(0);
  const reactionTimeoutRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToRoom(roomCode, (data) => {
      setSnapshot(data);
      if (data?.room?.status === 'dueling') {
        navigate(`/room/${roomCode}/duel`);
      } else if (data?.room?.status === 'finished') {
        navigate(`/room/${roomCode}/result`);
      }
    });
    return () => {
      unsub();
      if (tapIntervalRef.current) clearInterval(tapIntervalRef.current);
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    };
  }, [roomCode, navigate]);

  const gameType = snapshot?.tiebreak_state?.game_type || 'api_trivia';

  // Auto-load data when entering a tiebreak mini-game
  useEffect(() => {
    if (!snapshot?.tiebreak_state) return;
    if (gameType === 'api_trivia' && !snapshot.tiebreak_state.api_payload) {
      loadTriviaChallenge();
    } else if (
      (gameType === 'tap_race' || gameType === 'reaction_test') &&
      !challengeFact
    ) {
      fetchTiebreakChallengePrompt().then(setChallengeFact);
    }
  }, [gameType]);

  // Auto-advance countdown when tiebreak winner is decided
  useEffect(() => {
    const winnerId = snapshot?.tiebreak_state?.winner_option_id;
    if (!winnerId) {
      setAutoAdvanceSeconds(null);
      return;
    }

    setAutoAdvanceSeconds(3);
    const interval = setInterval(() => {
      setAutoAdvanceSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleConfirmTiebreakWinner();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [snapshot?.tiebreak_state?.winner_option_id]);

  if (!snapshot || !snapshot.tiebreak_state) {
    return (
      <AuthGate roomCode={roomCode}>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-4">
            <h2 className="text-xl font-extrabold text-white">No Active Tiebreak</h2>
            <p className="text-xs text-slate-400">Returning to tournament match arena...</p>
            <button
              onClick={() => navigate(`/room/${roomCode}/duel`)}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition"
            >
              Back to Duel
            </button>
          </div>
        </div>
      </AuthGate>
    );
  }

  const { room, options = [], tiebreak_state: tb } = snapshot;
  const optA = options.find((o) => o.option_id === tb.option_a_id);
  const optB = options.find((o) => o.option_id === tb.option_b_id);

  const switchGameType = (type) => {
    if (tapIntervalRef.current) clearInterval(tapIntervalRef.current);
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    setTapRaceRunning(false);
    setTapTimeLeft(5.0);
    setReactionPhase('idle');
    setSelectedTriviaAnswer(null);

    updateTiebreakState(roomCode, {
      game_type: type,
      status: 'ready',
      score_a: 0,
      score_b: 0,
      rps_rounds: [],
      reaction_ms_a: null,
      reaction_ms_b: null,
      api_payload: null,
      winner_option_id: null,
    });

    if (type === 'api_trivia') {
      setTimeout(() => loadTriviaChallenge(), 50);
    }
  };

  // MINI-GAME 1: TRIVIA POP QUIZ
  const loadTriviaChallenge = async () => {
    setApiLoading(true);
    setSelectedTriviaAnswer(null);
    const trivia = await fetchTriviaQuestion(room?.title);
    setApiLoading(false);
    updateTiebreakState(roomCode, {
      status: 'playing',
      api_payload: trivia,
      winner_option_id: null,
    });
  };

  const handleTriviaAnswer = (ans) => {
    if (!tb.api_payload || tb.winner_option_id) return;
    setSelectedTriviaAnswer(ans);
    const isCorrect = ans === tb.api_payload.correct_answer;

    const winId =
      (triviaSide === 'A' && isCorrect) || (triviaSide === 'B' && !isCorrect)
        ? tb.option_a_id
        : tb.option_b_id;

    updateTiebreakState(roomCode, {
      status: 'done',
      winner_option_id: winId,
    });
  };

  // MINI-GAME 2: HIGH-CARD SHOWDOWN
  const playHighCardDuel = async () => {
    setApiLoading(true);
    const drawResult = await fetchHighCardDuel();
    setApiLoading(false);
    const winId = drawResult.winnerSide === 'A' ? tb.option_a_id : tb.option_b_id;
    updateTiebreakState(roomCode, {
      status: 'done',
      api_payload: drawResult,
      winner_option_id: winId,
    });
  };

  // MINI-GAME 3: MASCOT STAT CLASH
  const playMascotClash = async () => {
    setApiLoading(true);
    const clashResult = await fetchMascotClash();
    setApiLoading(false);
    const winId = clashResult.winnerSide === 'A' ? tb.option_a_id : tb.option_b_id;
    updateTiebreakState(roomCode, {
      status: 'done',
      api_payload: clashResult,
      winner_option_id: winId,
    });
  };

  // MINI-GAME 4: 5-SECOND TAP SPRINT
  const startTapRace = () => {
    setTapRaceRunning(true);
    setTapTimeLeft(5.0);
    updateTiebreakState(roomCode, {
      status: 'playing',
      score_a: 0,
      score_b: 0,
      winner_option_id: null,
    });

    const startTime = Date.now();
    if (tapIntervalRef.current) clearInterval(tapIntervalRef.current);

    tapIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, 5.0 - elapsed);
      setTapTimeLeft(remaining);

      const latest = getRoomSnapshot(roomCode)?.tiebreak_state;
      if (latest && latest.status === 'playing' && Math.random() < 0.55) {
        updateTiebreakState(roomCode, {
          score_b: (latest.score_b || 0) + 1,
        });
      }

      if (remaining <= 0) {
        clearInterval(tapIntervalRef.current);
        setTapRaceRunning(false);
        const finalState = getRoomSnapshot(roomCode)?.tiebreak_state;
        if (finalState) {
          let finalA = finalState.score_a || 0;
          let finalB = finalState.score_b || 0;
          if (finalA === finalB) finalA += 1;
          const winId = finalA > finalB ? tb.option_a_id : tb.option_b_id;
          updateTiebreakState(roomCode, {
            status: 'done',
            score_a: finalA,
            score_b: finalB,
            winner_option_id: winId,
          });
        }
      }
    }, 120);
  };

  const handleTapOption = (side) => {
    if (!tapRaceRunning) return;
    const latest = getRoomSnapshot(roomCode)?.tiebreak_state;
    if (!latest) return;
    if (side === 'A') {
      updateTiebreakState(roomCode, { score_a: (latest.score_a || 0) + 1 });
    } else {
      updateTiebreakState(roomCode, { score_b: (latest.score_b || 0) + 1 });
    }
  };

  // MINI-GAME 5: FLASH REACTION REFLEX
  const startReactionCountdown = () => {
    setReactionPhase('waiting');
    updateTiebreakState(roomCode, {
      status: 'playing',
      reaction_ms_a: null,
      reaction_ms_b: null,
      winner_option_id: null,
    });

    const delay = 1500 + Math.random() * 2500;
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);

    reactionTimeoutRef.current = setTimeout(() => {
      greenTimestampRef.current = Date.now();
      setReactionPhase('ready');
    }, delay);
  };

  const handleReactionTap = (side) => {
    if (reactionPhase === 'waiting') {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      setReactionPhase('idle');
      const winId = side === 'A' ? tb.option_b_id : tb.option_a_id;
      updateTiebreakState(roomCode, {
        status: 'done',
        reaction_ms_a: side === 'A' ? 999 : 300,
        reaction_ms_b: side === 'B' ? 999 : 300,
        winner_option_id: winId,
      });
      return;
    }

    if (reactionPhase === 'ready') {
      const ms = Date.now() - greenTimestampRef.current;
      setReactionPhase('idle');
      const botMs = ms + Math.floor((Math.random() - 0.45) * 60);
      const msA = side === 'A' ? ms : botMs;
      const msB = side === 'B' ? ms : botMs;
      const winId = msA < msB ? tb.option_a_id : tb.option_b_id;

      updateTiebreakState(roomCode, {
        status: 'done',
        reaction_ms_a: msA,
        reaction_ms_b: msB,
        winner_option_id: winId,
      });
    }
  };

  // MINI-GAME 6: ROCK PAPER SCISSORS
  const playRpsRound = (moveA) => {
    const moves = ['rock', 'paper', 'scissors'];
    const moveB = moves[Math.floor(Math.random() * moves.length)];

    let roundWinner = 'draw';
    if (moveA !== moveB) {
      if (
        (moveA === 'rock' && moveB === 'scissors') ||
        (moveA === 'paper' && moveB === 'rock') ||
        (moveA === 'scissors' && moveB === 'paper')
      ) {
        roundWinner = 'A';
      } else {
        roundWinner = 'B';
      }
    }

    const nextScoreA = (tb.score_a || 0) + (roundWinner === 'A' ? 1 : 0);
    const nextScoreB = (tb.score_b || 0) + (roundWinner === 'B' ? 1 : 0);
    const nextRounds = [
      ...(tb.rps_rounds || []),
      { round: (tb.rps_rounds?.length || 0) + 1, moveA, moveB, roundWinner },
    ];

    let winnerOptionId = null;
    if (nextScoreA >= 2) winnerOptionId = tb.option_a_id;
    else if (nextScoreB >= 2) winnerOptionId = tb.option_b_id;

    updateTiebreakState(roomCode, {
      status: winnerOptionId ? 'done' : 'playing',
      score_a: nextScoreA,
      score_b: nextScoreB,
      rps_rounds: nextRounds,
      winner_option_id: winnerOptionId,
    });
  };

  const handleConfirmTiebreakWinner = () => {
    if (!tb.winner_option_id) return;
    let detail = '';
    if (gameType === 'api_trivia') {
      detail = `Trivia Duel (${tb.api_payload?.category || 'Pop Quiz'})`;
    } else if (gameType === 'api_cards') {
      detail = `High Card Duel: ${tb.api_payload?.cardA?.value} vs ${tb.api_payload?.cardB?.value}`;
    } else if (gameType === 'api_mascot') {
      detail = `Mascot Power Clash: ${tb.api_payload?.mascotA?.name} vs ${tb.api_payload?.mascotB?.name}`;
    } else if (gameType === 'tap_race') {
      detail = `Tap Sprint (5s): ${tb.score_a} vs ${tb.score_b} taps`;
    } else if (gameType === 'reaction_test') {
      detail = `Reaction Reflex: ${tb.reaction_ms_a}ms vs ${tb.reaction_ms_b}ms`;
    } else {
      detail = `Roshambo: ${tb.score_a}–${tb.score_b}`;
    }

    completeTiebreakAndAdvance(
      roomCode,
      tb.duel_id,
      tb.winner_option_id,
      gameType,
      detail
    );
  };

  const winningOption = options.find((o) => o.option_id === tb.winner_option_id);

  return (
    <AuthGate roomCode={roomCode}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
              <Gamepad2 className="w-4 h-4 text-amber-400 animate-pulse" />
              Sudden Death Tiebreaker Arena
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold">
                <Swords className="w-3.5 h-3.5 text-violet-400" />
                Tied Votes Detected
              </span>

              <button
                type="button"
                onClick={handleLeaveTiebreak}
                title="Leave match"
                className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Leave Match</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
              Tied Duel! Battle in Sudden Death
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Contenders:{' '}
              <span className="text-violet-400 font-extrabold">{optA?.emoji} {optA?.label}</span>
              {' '}vs{' '}
              <span className="text-pink-400 font-extrabold">{optB?.emoji} {optB?.label}</span>
            </p>
          </div>

          {/* Mini-Game Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {[
              { id: 'api_trivia', label: 'Pop Quiz', sub: 'Fast Trivia', icon: HelpCircle },
              { id: 'api_cards', label: 'High Card', sub: 'Royal Draw', icon: Spade },
              { id: 'api_mascot', label: 'Mascot Clash', sub: 'Power Battle', icon: Flame },
              { id: 'tap_race', label: 'Tap Sprint', sub: '5s Mash', icon: Timer },
              { id: 'reaction_test', label: 'Fast Reflex', sub: 'Green Signal', icon: Zap },
              { id: 'rps', label: 'Roshambo', sub: 'Best of 3', icon: Hand },
            ].map((g) => {
              const Icon = g.icon;
              const active = gameType === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => switchGameType(g.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between active:scale-95 ${
                    active
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400 shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/50'
                      : 'glass-card hover:bg-white/[0.08] text-slate-300 border-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-amber-300' : 'text-violet-400'}`} />
                  <div>
                    <div className="text-xs font-black leading-tight text-white">{g.label}</div>
                    <div className={`text-[10px] ${active ? 'text-violet-200' : 'text-slate-400'}`}>
                      {g.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* MINI-GAME 1: TRIVIA POP QUIZ                                      */}
        {/* ================================================================= */}
        {gameType === 'api_trivia' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-violet-400" />
                  Pop Culture Trivia Showdown
                </h2>
                <p className="text-xs text-slate-400">
                  Pick which contender you are championing, then tap the correct answer fast!
                </p>
              </div>
              <button
                type="button"
                onClick={loadTriviaChallenge}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${apiLoading ? 'animate-spin' : ''}`} />
                <span>Next Question</span>
              </button>
            </div>

            {/* Select side playing for */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-400">Playing For:</span>
              <button
                type="button"
                onClick={() => setTriviaSide('A')}
                className={`px-4 py-2 rounded-xl text-xs font-black border transition active:scale-95 ${
                  triviaSide === 'A'
                    ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30'
                    : 'bg-white/[0.05] text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                {optA?.emoji} {optA?.label}
              </button>
              <button
                type="button"
                onClick={() => setTriviaSide('B')}
                className={`px-4 py-2 rounded-xl text-xs font-black border transition active:scale-95 ${
                  triviaSide === 'B'
                    ? 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-600/30'
                    : 'bg-white/[0.05] text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                {optB?.emoji} {optB?.label}
              </button>
            </div>

            {apiLoading ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm animate-pulse">
                Loading live trivia question...
              </div>
            ) : tb.api_payload ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                    Category: {tb.api_payload.category}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {tb.api_payload.question}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(tb.api_payload.options || []).map((ans) => {
                    const isSelected = selectedTriviaAnswer === ans;
                    const isCorrect = ans === tb.api_payload.correct_answer;
                    const showResult = Boolean(tb.winner_option_id);

                    return (
                      <button
                        key={ans}
                        type="button"
                        disabled={showResult}
                        onClick={() => handleTriviaAnswer(ans)}
                        className={`p-4 rounded-2xl border text-left font-bold text-sm transition active:scale-98 ${
                          showResult && isCorrect
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : showResult && isSelected && !isCorrect
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                            : 'glass-card hover:bg-white/[0.08] border-white/10 text-white'
                        }`}
                      >
                        {ans}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ================================================================= */}
        {/* MINI-GAME 2: HIGH-CARD SHOWDOWN                                   */}
        {/* ================================================================= */}
        {gameType === 'api_cards' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Spade className="w-5 h-5 text-indigo-400" />
                  Royal High-Card Showdown
                </h2>
                <p className="text-xs text-slate-400">
                  Deals 1 card to each contender from a shuffled deck. Highest value card advances!
                </p>
              </div>

              <button
                type="button"
                onClick={playHighCardDuel}
                disabled={apiLoading}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-md transition active:scale-95"
              >
                {apiLoading ? 'Dealing Cards...' : '🃏 Draw Cards'}
              </button>
            </div>

            {tb.api_payload?.cardA && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { side: 'A', opt: optA, card: tb.api_payload.cardA },
                  { side: 'B', opt: optB, card: tb.api_payload.cardB },
                ].map(({ side, opt, card }) => {
                  const isWin = tb.api_payload.winnerSide === side;
                  return (
                    <div
                      key={side}
                      className={`p-6 rounded-3xl border-2 text-center space-y-3 transition ${
                        isWin
                          ? 'bg-emerald-500/10 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                          : 'glass-card border-white/10'
                      }`}
                    >
                      <div className="text-sm font-black text-white">
                        {opt?.emoji} {opt?.label}
                      </div>
                      <img
                        src={card.image}
                        alt={card.code}
                        className="w-32 h-auto mx-auto drop-shadow-xl rounded-lg"
                      />
                      <div className="text-base font-black text-white">
                        {card.value} of {card.suit}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MINI-GAME 3: MASCOT STAT CLASH                                    */}
        {/* ================================================================= */}
        {gameType === 'api_mascot' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  Mascot Power Clash
                </h2>
                <p className="text-xs text-slate-400">
                  Summons two random mascots and compares their HP, Attack, and Speed stats!
                </p>
              </div>

              <button
                type="button"
                onClick={playMascotClash}
                disabled={apiLoading}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:brightness-110 text-white font-black text-xs shadow-md transition active:scale-95"
              >
                {apiLoading ? 'Summoning...' : '🐉 Clash Mascots'}
              </button>
            </div>

            {tb.api_payload?.mascotA && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { side: 'A', opt: optA, m: tb.api_payload.mascotA },
                  { side: 'B', opt: optB, m: tb.api_payload.mascotB },
                ].map(({ side, opt, m }) => {
                  const isWin = tb.api_payload.winnerSide === side;
                  return (
                    <div
                      key={side}
                      className={`p-6 rounded-3xl border-2 text-center space-y-3 transition ${
                        isWin
                          ? 'bg-emerald-500/10 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                          : 'glass-card border-white/10'
                      }`}
                    >
                      <div className="text-xs font-black uppercase text-violet-300">
                        Champion for {opt?.emoji} {opt?.label}
                      </div>
                      <img
                        src={m.sprite}
                        alt={m.name}
                        className="w-28 h-28 object-contain mx-auto drop-shadow-lg"
                      />
                      <div className="text-lg font-black text-white">{m.name}</div>
                      <div className="flex justify-center gap-2 text-xs font-black">
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          HP: {m.hp}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ATK: {m.atk}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          SPD: {m.spd}
                        </span>
                      </div>
                      <div className="text-sm font-black text-amber-400">
                        Total Power: {m.totalPower}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MINI-GAME 4: 5-SECOND TAP SPRINT                                  */}
        {/* ================================================================= */}
        {gameType === 'tap_race' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  Tap Sprint: Rapid Mash in 5 Seconds!
                </h2>
                <p className="text-xs text-slate-400">
                  Tap your side furiously before the countdown hits 0.0s!
                </p>
              </div>

              <div className="px-5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="text-[10px] uppercase tracking-wider text-amber-300 font-black">
                  Countdown
                </div>
                <div className="text-2xl font-mono font-black text-amber-400">
                  {tapTimeLeft.toFixed(1)}s
                </div>
              </div>
            </div>

            {!tapRaceRunning && !tb.winner_option_id && (
              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={startTapRace}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 transition active:scale-95"
                >
                  ⚡ Start 5s Sprint!
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                disabled={!tapRaceRunning}
                onClick={() => handleTapOption('A')}
                className={`p-6 rounded-3xl border-2 text-center space-y-2 transition active:scale-95 ${
                  tapRaceRunning
                    ? 'glass-card border-violet-400 hover:bg-violet-500/20 cursor-pointer'
                    : 'glass-card border-white/10 opacity-70'
                }`}
              >
                <div className="text-4xl">{optA?.emoji}</div>
                <div className="text-base font-black text-white">{optA?.label}</div>
                <div className="text-4xl font-mono font-black text-violet-300">{tb.score_a || 0}</div>
                <div className="text-[10px] font-black uppercase text-slate-400">TAPS</div>
              </button>

              <button
                type="button"
                disabled={!tapRaceRunning}
                onClick={() => handleTapOption('B')}
                className={`p-6 rounded-3xl border-2 text-center space-y-2 transition active:scale-95 ${
                  tapRaceRunning
                    ? 'glass-card border-pink-400 hover:bg-pink-500/20 cursor-pointer'
                    : 'glass-card border-white/10 opacity-70'
                }`}
              >
                <div className="text-4xl">{optB?.emoji}</div>
                <div className="text-base font-black text-white">{optB?.label}</div>
                <div className="text-4xl font-mono font-black text-pink-300">{tb.score_b || 0}</div>
                <div className="text-[10px] font-black uppercase text-slate-400">TAPS</div>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MINI-GAME 5: FLASH REACTION REFLEX                                */}
        {/* ================================================================= */}
        {gameType === 'reaction_test' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Flash Reaction Reflex
              </h2>
              <p className="text-xs text-slate-400">
                Wait for the red card to turn GREEN. Tap immediately! False starts automatically forfeit!
              </p>
            </div>

            {reactionPhase === 'idle' && !tb.winner_option_id && (
              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={startReactionCountdown}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition active:scale-95"
                >
                  ⚡ Start Reaction Test
                </button>
              </div>
            )}

            {reactionPhase === 'waiting' && (
              <div className="p-12 rounded-3xl bg-rose-500/20 border-2 border-rose-500/50 text-center space-y-2 animate-pulse">
                <div className="text-3xl font-black text-rose-300 uppercase tracking-widest">
                  🔴 WAIT FOR GREEN...
                </div>
                <p className="text-xs text-rose-200">Do NOT tap yet!</p>
              </div>
            )}

            {reactionPhase === 'ready' && (
              <div className="p-8 rounded-3xl bg-emerald-500/30 border-2 border-emerald-400 text-center space-y-4">
                <div className="text-4xl font-black text-emerald-300 uppercase tracking-widest animate-bounce">
                  🟢 TAP NOW!!
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleReactionTap('A')}
                    className="p-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm transition active:scale-95"
                  >
                    {optA?.emoji} {optA?.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReactionTap('B')}
                    className="p-4 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm transition active:scale-95"
                  >
                    {optB?.emoji} {optB?.label}
                  </button>
                </div>
              </div>
            )}

            {tb.reaction_ms_a !== null && tb.reaction_ms_b !== null && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl glass-card border border-white/10">
                  <div className="text-xs font-bold text-slate-400">{optA?.label}</div>
                  <div className="text-2xl font-mono font-black text-violet-300">
                    {tb.reaction_ms_a === 999 ? 'False Start!' : `${tb.reaction_ms_a} ms`}
                  </div>
                </div>
                <div className="p-4 rounded-2xl glass-card border border-white/10">
                  <div className="text-xs font-bold text-slate-400">{optB?.label}</div>
                  <div className="text-2xl font-mono font-black text-pink-300">
                    {tb.reaction_ms_b === 999 ? 'False Start!' : `${tb.reaction_ms_b} ms`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MINI-GAME 6: ROCK PAPER SCISSORS                                  */}
        {/* ================================================================= */}
        {gameType === 'rps' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Hand className="w-5 h-5 text-violet-400" />
                  Roshambo — Best of 3!
                </h2>
                <p className="text-xs text-slate-400">
                  First option to win 2 clashes takes the duel!
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-mono font-black">
                <span className="text-violet-400">{optA?.emoji} {tb.score_a || 0}</span>
                <span className="mx-2 text-slate-500">—</span>
                <span className="text-pink-400">{tb.score_b || 0} {optB?.emoji}</span>
              </div>
            </div>

            {!tb.winner_option_id && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Throw move for {optA?.emoji} {optA?.label}:
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'rock', label: 'Rock', emoji: '🪨' },
                    { id: 'paper', label: 'Paper', emoji: '📄' },
                    { id: 'scissors', label: 'Scissors', emoji: '✂️' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => playRpsRound(m.id)}
                      className="p-5 rounded-2xl glass-card hover:bg-white/[0.1] border border-white/10 transition active:scale-95 text-center space-y-1"
                    >
                      <div className="text-4xl">{m.emoji}</div>
                      <div className="text-xs font-black text-white">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Automatic Progression / Winner Reveal Banner */}
        {tb.winner_option_id && winningOption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-6 sm:p-8 border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/60 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
                {winningOption.emoji || '🏆'}
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Sudden Death Winner Decided!
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {winningOption.label} advances!
                </h3>
                {autoAdvanceSeconds !== null && (
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    Continuing to next match automatically in {autoAdvanceSeconds}s...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => switchGameType(gameType)}
                className="px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Replay
              </button>
              <button
                type="button"
                onClick={handleConfirmTiebreakWinner}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition active:scale-95"
              >
                <span>Advance Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AuthGate>
  );
}
