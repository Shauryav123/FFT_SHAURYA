import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dices,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  Zap,
} from 'lucide-react';
import FallGuysRoulette, { FALL_GUYS_GAMES } from './FallGuysRoulette';
import {
  fetchTriviaQuestion,
  fetchWordScrambleChallenge,
  fetchDeckCards,
} from '../services/minigameApi';

export default function InteractiveDuelGames({
  duelId,
  optA,
  optB,
  chosenSide, // 'A' | 'B'
  pointsA,
  pointsB,
  onAwardPoints, // (side: 'A' | 'B', pts: number) => void
  onFinishDuel, // (gameName: string) => void
}) {
  // Current game selected by the Fall Guys Roulette
  const [selectedGame, setSelectedGame] = useState(() => {
    const idx = Math.floor(Math.random() * FALL_GUYS_GAMES.length);
    return FALL_GUYS_GAMES[idx];
  });

  // State: 'roulette' (spin / preview) or 'playing' (in-game arena) or 'round_over'
  const [gameState, setGameState] = useState('playing');
  const [roundResult, setRoundResult] = useState('');
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(5);

  // Automatically randomize mini-game whenever duelId changes (every new match)
  useEffect(() => {
    const idx = Math.floor(Math.random() * FALL_GUYS_GAMES.length);
    setSelectedGame(FALL_GUYS_GAMES[idx]);
    setGameState('playing');
    setRoundResult('');
    setEarnedPoints(0);
    setAutoAdvanceTimer(5);
  }, [duelId]);

  // Automatic progression countdown so game never stalls waiting for mediator
  useEffect(() => {
    if (gameState !== 'round_over') {
      setAutoAdvanceTimer(5);
      return;
    }
    setAutoAdvanceTimer(5);
    const interval = setInterval(() => {
      setAutoAdvanceTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinishDuel(selectedGame?.name || 'Fall Guys Arena');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, selectedGame?.name]);

  const myOption = chosenSide === 'B' ? optB : optA;
  const rivalOption = chosenSide === 'B' ? optA : optB;
  const rivalSide = chosenSide === 'B' ? 'A' : 'B';

  const resetToRoulette = () => {
    setGameState('roulette');
    setRoundResult('');
    setEarnedPoints(0);
  };

  const handleStartGameRound = (game = selectedGame) => {
    setSelectedGame(game);
    setGameState('playing');
    setRoundResult('');
    setEarnedPoints(0);
  };

  // ==========================================================================
  // GAME 1: TAIL TAG RUSH (Fall Guys Hunt)
  // ==========================================================================
  const [hasTail, setHasTail] = useState(false);
  const [tailTimeLeft, setTailTimeLeft] = useState(10);
  const [tailPos, setTailPos] = useState({ x: 50, y: 50 });
  const tailIntervalRef = useRef(null);

  const startTailTag = () => {
    setHasTail(false);
    setTailTimeLeft(10);
    setTailPos({ x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 });

    if (tailIntervalRef.current) clearInterval(tailIntervalRef.current);
    const startTs = Date.now();
    tailIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTs) / 1000;
      const rem = Math.max(0, 10 - elapsed);
      setTailTimeLeft(rem);

      // Move tail randomly if not held
      setTailPos((prev) => ({
        x: Math.max(15, Math.min(85, prev.x + (Math.random() * 24 - 12))),
        y: Math.max(20, Math.min(80, prev.y + (Math.random() * 24 - 12))),
      }));

      // If user holds tail, award points over time!
      setHasTail((holding) => {
        if (holding) {
          onAwardPoints(chosenSide, 12);
        } else if (Math.random() < 0.25) {
          // Rival grabs some points if you don't hold it
          onAwardPoints(rivalSide, 8);
        }
        return holding;
      });

      if (rem <= 0) {
        clearInterval(tailIntervalRef.current);
        setGameState('round_over');
        setRoundResult('Tail Tag Over! Points awarded based on hold time.');
      }
    }, 450);
  };

  const grabTail = () => {
    setHasTail(true);
    onAwardPoints(chosenSide, 35);
  };

  // ==========================================================================
  // GAME 2: DOOR DASH SPRINT (Fall Guys Race)
  // ==========================================================================
  const [doorGate, setDoorGate] = useState(1); // Gate 1, 2, 3
  const [realDoors, setRealDoors] = useState(() => [
    Math.floor(Math.random() * 3) + 1,
    Math.floor(Math.random() * 3) + 1,
    Math.floor(Math.random() * 3) + 1,
  ]);
  const [doorFeedback, setDoorFeedback] = useState('');

  const startDoorDash = () => {
    setDoorGate(1);
    setDoorFeedback('');
    setRealDoors([
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1,
    ]);
  };

  const handlePickDoor = (doorNum) => {
    const isReal = doorNum === realDoors[doorGate - 1];
    if (isReal) {
      setDoorFeedback(`🎉 Gate ${doorGate} Smashed Open!`);
      onAwardPoints(chosenSide, 45);
      if (doorGate < 3) {
        setTimeout(() => {
          setDoorGate((g) => g + 1);
          setDoorFeedback('');
        }, 500);
      } else {
        setTimeout(() => {
          setGameState('round_over');
          setRoundResult(`🏆 Finished Door Dash in 1st Place! +135 PTS for ${myOption?.label}`);
        }, 600);
      }
    } else {
      setDoorFeedback('💥 BONK! Fake door! Try another one!');
      onAwardPoints(rivalSide, 15);
    }
  };

  // ==========================================================================
  // GAME 3: HEX-A-DROP (Falling Platforms)
  // ==========================================================================
  const [hexGrid, setHexGrid] = useState(() =>
    Array.from({ length: 9 }).map((_, i) => ({ id: i, alive: true }))
  );
  const [hexPlayerPos, setHexPlayerPos] = useState(4);
  const [hexScore, setHexScore] = useState(0);

  const startHexADrop = () => {
    setHexGrid(Array.from({ length: 9 }).map((_, i) => ({ id: i, alive: true })));
    setHexPlayerPos(4);
    setHexScore(0);
  };

  const handleJumpTile = (tileIndex) => {
    if (!hexGrid[tileIndex].alive) return;
    setHexPlayerPos(tileIndex);

    // Tile crumbles shortly after jump!
    setTimeout(() => {
      setHexGrid((prev) =>
        prev.map((t) => (t.id === tileIndex ? { ...t, alive: false } : t))
      );
    }, 350);

    const nextScore = hexScore + 20;
    setHexScore(nextScore);
    onAwardPoints(chosenSide, 20);

    const remaining = hexGrid.filter((t) => t.id !== tileIndex && t.alive).length;
    if (remaining <= 1) {
      setGameState('round_over');
      setRoundResult(`🧱 Survived Hex-A-Drop! +${nextScore} PTS for ${myOption?.label}`);
    }
  };

  // ==========================================================================
  // GAME 4: BLAST BALL / HOT POTATO (Bomb Pass)
  // ==========================================================================
  const [bombHolder, setBombHolder] = useState('you'); // 'you' | 'rival'
  const [bombTimer, setBombTimer] = useState(6);
  const bombIntervalRef = useRef(null);

  const startBlastBall = () => {
    setBombHolder('you');
    setBombTimer(6);

    if (bombIntervalRef.current) clearInterval(bombIntervalRef.current);
    const startTs = Date.now();
    bombIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTs) / 1000;
      const rem = Math.max(0, 6 - elapsed);
      setBombTimer(rem);

      if (rem <= 0) {
        clearInterval(bombIntervalRef.current);
        setGameState('round_over');
        setBombHolder((cur) => {
          if (cur === 'you') {
            onAwardPoints(rivalSide, 90);
            setRoundResult(`💥 Bomb exploded on ${myOption?.label}! Rival scores +90 PTS.`);
          } else {
            onAwardPoints(chosenSide, 120);
            setRoundResult(`💣 Bomb exploded on the rival! +120 PTS for ${myOption?.label}!`);
          }
          return cur;
        });
      }
    }, 250);
  };

  const passBomb = () => {
    if (bombHolder === 'you') {
      setBombHolder('rival');
      onAwardPoints(chosenSide, 25);
      // Rival AI will throw it back after 1.2 to 2 seconds
      setTimeout(() => {
        setBombHolder((cur) => (cur === 'rival' ? 'you' : cur));
      }, 1400);
    }
  };

  // ==========================================================================
  // GAME 5: TIP TOE MINEFIELD (Memory Path)
  // ==========================================================================
  const [tipStep, setTipStep] = useState(0); // 0 to 3
  const [tipPath] = useState(() => [
    Math.floor(Math.random() * 3),
    Math.floor(Math.random() * 3),
    Math.floor(Math.random() * 3),
  ]);
  const [tipError, setTipError] = useState(false);

  const startTipToe = () => {
    setTipStep(0);
    setTipError(false);
  };

  const handleStepTile = (row, col) => {
    if (row !== tipStep) return;
    if (col === tipPath[row]) {
      const next = tipStep + 1;
      setTipStep(next);
      setTipError(false);
      onAwardPoints(chosenSide, 35);

      if (next >= 3) {
        setTimeout(() => {
          setGameState('round_over');
          setRoundResult(`👣 Cross the finish line safely! +105 PTS for ${myOption?.label}!`);
        }, 400);
      }
    } else {
      setTipError(true);
      onAwardPoints(rivalSide, 20);
      setTimeout(() => setTipError(false), 500);
    }
  };

  // ==========================================================================
  // GAME 6: TARGET TAP FRENZY
  // ==========================================================================
  const [targets, setTargets] = useState([]);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(8);
  const blitzTimerRef = useRef(null);

  const makeTarget = () => ({
    id: `tgt_${Date.now()}_${Math.random()}`,
    x: 15 + Math.floor(Math.random() * 70),
    y: 20 + Math.floor(Math.random() * 60),
    isCrown: Math.random() < 0.35,
  });

  const startTargetBlitz = () => {
    setBlitzTimeLeft(8);
    setTargets([makeTarget(), makeTarget(), makeTarget()]);

    if (blitzTimerRef.current) clearInterval(blitzTimerRef.current);
    const startTs = Date.now();
    blitzTimerRef.current = setInterval(() => {
      const rem = Math.max(0, 8 - (Date.now() - startTs) / 1000);
      setBlitzTimeLeft(rem);

      if (Math.random() < 0.35) {
        onAwardPoints(rivalSide, 15);
      }

      if (rem <= 0) {
        clearInterval(blitzTimerRef.current);
        setGameState('round_over');
        setRoundResult(`🎯 Target Frenzy Done! Crown points locked in.`);
      }
    }, 350);
  };

  const handleHitTarget = (target) => {
    const pts = target.isCrown ? 50 : 25;
    onAwardPoints(chosenSide, pts);
    setTargets((prev) =>
      prev.map((t) => (t.id === target.id ? makeTarget() : t))
    );
  };

  // ==========================================================================
  // GAME 7: LIVE TRIVIA DROP (OpenTDB API)
  // ==========================================================================
  const [trivia, setTrivia] = useState(null);
  const [triviaPicked, setTriviaPicked] = useState(null);
  const [triviaLoading, setTriviaLoading] = useState(false);

  const loadTrivia = async () => {
    setTriviaLoading(true);
    setTriviaPicked(null);
    const data = await fetchTriviaQuestion();
    setTrivia(data);
    setTriviaLoading(false);
  };

  const handlePickTrivia = (ans) => {
    setTriviaPicked(ans);
    if (ans === trivia.correct_answer) {
      onAwardPoints(chosenSide, 100);
      setRoundResult(`🎯 Correct Answer! +100 PTS for ${myOption?.label}!`);
    } else {
      onAwardPoints(rivalSide, 50);
      setRoundResult(`Wrong! Answer was "${trivia.correct_answer}". Rival scores +50 PTS.`);
    }
    setTimeout(() => setGameState('round_over'), 600);
  };

  // ==========================================================================
  // GAME 8: WORD SCRAMBLE RUSH (Datamuse API)
  // ==========================================================================
  const [wordData, setWordData] = useState(null);
  const [pickedIndices, setPickedIndices] = useState([]);
  const [wordLoading, setWordLoading] = useState(false);

  const loadWordGame = async () => {
    setWordLoading(true);
    setPickedIndices([]);
    const data = await fetchWordScrambleChallenge();
    setWordData(data);
    setWordLoading(false);
  };

  const handleTileClick = (idx) => {
    if (!wordData || pickedIndices.includes(idx)) return;
    const next = [...pickedIndices, idx];
    setPickedIndices(next);

    const guess = next.map((i) => wordData.scrambled[i]).join('');
    if (guess.length === wordData.word.length) {
      if (guess === wordData.word) {
        onAwardPoints(chosenSide, 110);
        setRoundResult(`🎉 Unscrambled "${wordData.word}"! +110 PTS for ${myOption?.label}!`);
      } else {
        onAwardPoints(rivalSide, 50);
        setRoundResult(`The word was "${wordData.word}".`);
      }
      setTimeout(() => setGameState('round_over'), 600);
    }
  };

  // ==========================================================================
  // GAME 9: 21 CARD SHOWDOWN (Deck of Cards API)
  // ==========================================================================
  const [bjDeck, setBjDeck] = useState([]);
  const [yourHand, setYourHand] = useState([]);
  const [rivalHand, setRivalHand] = useState([]);
  const [bjLoading, setBjLoading] = useState(false);

  const sumHand = (hand) => hand.reduce((acc, c) => acc + (c.points || 10), 0);

  const startBlackjack = async () => {
    setBjLoading(true);
    const res = await fetchDeckCards(8);
    setYourHand([res.cards[0], res.cards[1]]);
    setRivalHand([res.cards[2], res.cards[3]]);
    setBjDeck(res.cards.slice(4));
    setBjLoading(false);
  };

  const handleBjHit = () => {
    if (bjDeck.length === 0) return;
    const nextHand = [...yourHand, bjDeck[0]];
    setYourHand(nextHand);
    setBjDeck(bjDeck.slice(1));

    if (sumHand(nextHand) > 21) {
      onAwardPoints(rivalSide, 80);
      setRoundResult(`Bust (over 21)! Rival scores +80 PTS.`);
      setTimeout(() => setGameState('round_over'), 600);
    }
  };

  const handleBjStand = () => {
    let rHand = [...rivalHand];
    let deckCopy = [...bjDeck];
    while (sumHand(rHand) < 16 && deckCopy.length > 0) {
      rHand.push(deckCopy[0]);
      deckCopy = deckCopy.slice(1);
    }
    setRivalHand(rHand);

    const myTotal = sumHand(yourHand);
    const rTotal = sumHand(rHand);
    if (rTotal > 21 || myTotal >= rTotal) {
      onAwardPoints(chosenSide, 100);
      setRoundResult(`You Won (${myTotal} vs ${rTotal})! +100 PTS for ${myOption?.label}!`);
    } else {
      onAwardPoints(rivalSide, 75);
      setRoundResult(`Rival Won (${rTotal} vs ${myTotal})! Rival scores +75 PTS.`);
    }
    setTimeout(() => setGameState('round_over'), 600);
  };

  // ==========================================================================
  // GAME 10: TUG OF WAR SURGE
  // ==========================================================================
  const [ropePos, setRopePos] = useState(50);
  const tugTimerRef = useRef(null);

  const startTugOfWar = () => {
    setRopePos(50);
    if (tugTimerRef.current) clearInterval(tugTimerRef.current);
    tugTimerRef.current = setInterval(() => {
      setRopePos((prev) => {
        const pull = chosenSide === 'A' ? 2 : -2;
        const next = Math.max(0, Math.min(100, prev + pull));
        if (next <= 10 || next >= 90) {
          clearInterval(tugTimerRef.current);
          setGameState('round_over');
          setRoundResult('Tug of War Completed!');
        }
        return next;
      });
    }, 280);
  };

  const handlePullTug = () => {
    onAwardPoints(chosenSide, 20);
    setRopePos((prev) => {
      const delta = chosenSide === 'A' ? -8 : 8;
      const next = Math.max(0, Math.min(100, prev + delta));
      if (next <= 10 || next >= 90) {
        clearInterval(tugTimerRef.current);
        onAwardPoints(chosenSide, 60);
        setRoundResult(`Victory Surge! +60 bonus PTS for ${myOption?.label}!`);
        setTimeout(() => setGameState('round_over'), 500);
      }
      return next;
    });
  };

  // Launch the corresponding mini-game engine when round starts or changes
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (selectedGame.id === 'tail_tag') startTailTag();
    if (selectedGame.id === 'door_dash') startDoorDash();
    if (selectedGame.id === 'hex_a_drop') startHexADrop();
    if (selectedGame.id === 'blast_ball') startBlastBall();
    if (selectedGame.id === 'tip_toe') startTipToe();
    if (selectedGame.id === 'target_blitz') startTargetBlitz();
    if (selectedGame.id === 'trivia_drop') loadTrivia();
    if (selectedGame.id === 'word_scramble') loadWordGame();
    if (selectedGame.id === 'blackjack_21') startBlackjack();
    if (selectedGame.id === 'tug_of_war') startTugOfWar();

    return () => {
      if (tailIntervalRef.current) clearInterval(tailIntervalRef.current);
      if (bombIntervalRef.current) clearInterval(bombIntervalRef.current);
      if (blitzTimerRef.current) clearInterval(blitzTimerRef.current);
      if (tugTimerRef.current) clearInterval(tugTimerRef.current);
    };
  }, [selectedGame.id, gameState, duelId]);

  const leadingOption = pointsA >= pointsB ? optA : optB;
  const maxPts = Math.max(pointsA, pointsB);

  return (
    <div className="space-y-4">
      {/* 1. Active Game Arena Mode */}
      {gameState === 'playing' && (
        <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-5">
          {/* Active Round Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 shadow-sm">
                {selectedGame.icon}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {selectedGame.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Battling for:{' '}
                    <strong className="text-white">
                      {myOption?.emoji} {myOption?.label}
                    </strong>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedGame.name}
                </h3>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Mini-Game Decides Match</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* GAME 1: TAIL TAG RUSH                                          */}
          {/* ============================================================== */}
          {selectedGame.id === 'tail_tag' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>
                  {hasTail
                    ? '🔥 YOU HAVE THE TAIL! HOLD ONTO IT!'
                    : '🦊 Click the Golden Tail to steal it!'}
                </span>
                <span className="text-amber-600 font-mono font-black text-sm">
                  ⏱️ {tailTimeLeft.toFixed(1)}s
                </span>
              </div>
              <div className="relative h-60 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-2 border-indigo-400 overflow-hidden select-none flex items-center justify-center">
                {!hasTail ? (
                  <motion.button
                    type="button"
                    onClick={grabTail}
                    style={{ left: `${tailPos.x}%`, top: `${tailPos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-4 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border-2 border-white text-slate-950 font-black text-xs shadow-xl animate-bounce flex items-center gap-1.5"
                  >
                    <span>🦊</span>
                    <span>STEAL TAIL!</span>
                  </motion.button>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-5xl animate-pulse">🦊👑</div>
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-black text-xs inline-block">
                      TAIL SECURED! +12 PTS / SEC
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 2: DOOR DASH SPRINT                                       */}
          {/* ============================================================== */}
          {selectedGame.id === 'door_dash' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Pick the real door to smash through!</span>
                <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-800 font-black text-xs">
                  Barrier {doorGate} of 3
                </span>
              </div>

              {doorFeedback && (
                <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 text-xs font-bold text-center">
                  {doorFeedback}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePickDoor(num)}
                    className="h-36 sm:h-44 rounded-2xl bg-gradient-to-b from-pink-500 to-rose-600 hover:brightness-110 active:scale-95 border-4 border-white shadow-lg text-white font-black text-base sm:text-lg flex flex-col items-center justify-center gap-2 transition"
                  >
                    <span className="text-3xl sm:text-4xl">🚪</span>
                    <span>Door #{num}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 3: HEX-A-DROP                                             */}
          {/* ============================================================== */}
          {selectedGame.id === 'hex_a_drop' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Tap safe hexagon tiles before they crumble!</span>
                <span className="text-violet-700 font-mono font-black">
                  Score: +{hexScore} PTS
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 p-4 rounded-3xl bg-slate-900 border-2 border-violet-500">
                {hexGrid.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={!tile.alive}
                    onClick={() => handleJumpTile(tile.id)}
                    className={`h-20 rounded-2xl font-black text-sm transition-all border-2 flex items-center justify-center ${
                      !tile.alive
                        ? 'bg-transparent border-dashed border-slate-700 text-slate-700 opacity-20'
                        : hexPlayerPos === tile.id
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-300 border-white text-slate-950 scale-105 shadow-lg'
                        : 'bg-violet-600 hover:bg-violet-500 border-violet-400 text-white shadow'
                    }`}
                  >
                    {hexPlayerPos === tile.id ? (
                      <span className="text-xl">👑</span>
                    ) : tile.alive ? (
                      'HEX'
                    ) : (
                      '🕳️'
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 4: BLAST BALL (Bomb Pass)                                 */}
          {/* ============================================================== */}
          {selectedGame.id === 'blast_ball' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Pass the ticking bomb! Don't hold it when it blows!</span>
                <span className="text-rose-600 font-mono font-black text-sm">
                  💣 Fuse: {bombTimer.toFixed(1)}s
                </span>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 border-2 border-red-500 text-white space-y-4">
                <div className="text-6xl animate-bounce">
                  {bombHolder === 'you' ? '💣🔥' : '🛡️'}
                </div>
                <div className="text-lg font-black">
                  {bombHolder === 'you'
                    ? 'YOU ARE HOLDING THE BOMB!'
                    : `Rival is holding the bomb (${bombTimer.toFixed(1)}s remaining)!`}
                </div>

                {bombHolder === 'you' && (
                  <button
                    type="button"
                    onClick={passBomb}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-xl transition"
                  >
                    💥 CHUCK BOMB TO RIVAL (+25 PTS)!
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 5: TIP TOE MINEFIELD                                      */}
          {/* ============================================================== */}
          {selectedGame.id === 'tip_toe' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Find the safe path across the 3 rows!</span>
                <span className="px-3 py-1 rounded-full bg-lime-100 text-lime-800 font-black text-xs">
                  Row {tipStep + 1} of 3
                </span>
              </div>

              {tipError && (
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold text-center">
                  ⚠️ Trapdoor triggered! Try another tile in this row!
                </div>
              )}

              <div className="space-y-2 p-4 rounded-3xl bg-slate-900 border-2 border-lime-500">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((col) => {
                      const isCompleted = row < tipStep;
                      const isCurrent = row === tipStep;

                      return (
                        <button
                          key={col}
                          type="button"
                          disabled={!isCurrent}
                          onClick={() => handleStepTile(row, col)}
                          className={`h-16 rounded-xl font-black text-xs transition border-2 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-300 text-white'
                              : isCurrent
                              ? 'bg-slate-800 hover:bg-slate-700 border-lime-400 text-white cursor-pointer active:scale-95'
                              : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40'
                          }`}
                        >
                          {isCompleted ? '✓ SAFE' : isCurrent ? 'STEP' : 'LOCKED'}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 6: TARGET TAP FRENZY                                      */}
          {/* ============================================================== */}
          {selectedGame.id === 'target_blitz' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Tap the floating targets &amp; crowns before time runs out!</span>
                <span className="text-violet-700 font-mono font-black text-sm">
                  ⏱️ {blitzTimeLeft.toFixed(1)}s
                </span>
              </div>

              <div className="relative h-60 rounded-3xl bg-slate-900 border-2 border-fuchsia-400 overflow-hidden select-none">
                {targets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleHitTarget(t)}
                    style={{ left: `${t.x}%`, top: `${t.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl shadow-lg active:scale-90 transition ${
                      t.isCrown
                        ? 'bg-amber-400 border-white animate-pulse'
                        : 'bg-fuchsia-600 hover:bg-fuchsia-500 border-fuchsia-200'
                    }`}
                  >
                    {t.isCrown ? '👑' : myOption?.emoji || '🎯'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 7: LIVE TRIVIA DROP                                       */}
          {/* ============================================================== */}
          {selectedGame.id === 'trivia_drop' && (
            <div className="space-y-3">
              {triviaLoading ? (
                <div className="py-8 text-center text-sm font-bold text-slate-400">
                  Loading Pop Quiz Challenge...
                </div>
              ) : (
                trivia && (
                  <>
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-white text-sm font-bold">
                      <span className="text-[10px] uppercase font-black text-cyan-400 block mb-1">
                        Category: {trivia.category} • +100 PTS
                      </span>
                      {trivia.question}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {trivia.options.map((ans) => (
                        <button
                          key={ans}
                          type="button"
                          disabled={Boolean(triviaPicked)}
                          onClick={() => handlePickTrivia(ans)}
                          className="p-3.5 rounded-xl border text-left text-xs font-bold bg-white/[0.05] hover:bg-cyan-500/20 border-white/10 hover:border-cyan-500/40 text-slate-100 transition active:scale-98"
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 8: WORD SCRAMBLE RUSH                                     */}
          {/* ============================================================== */}
          {selectedGame.id === 'word_scramble' && (
            <div className="space-y-4">
              {wordLoading ? (
                <div className="py-8 text-center text-sm font-bold text-slate-400">
                  Loading word scramble puzzle...
                </div>
              ) : (
                wordData && (
                  <>
                    <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 text-center">
                      Clue: <strong className="text-white">“{wordData.clue}”</strong>
                    </div>

                    <div className="flex justify-center gap-2">
                      {wordData.word.split('').map((_, idx) => {
                        const src = pickedIndices[idx];
                        const letter = src !== undefined ? wordData.scrambled[src] : '';
                        return (
                          <div
                            key={idx}
                            className={`w-10 h-11 rounded-xl border-2 flex items-center justify-center text-base font-black ${
                              letter
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                                : 'bg-white/[0.04] border-dashed border-white/20'
                            }`}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {wordData.scrambled.split('').map((ch, idx) => {
                        const used = pickedIndices.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={used}
                            onClick={() => handleTileClick(idx)}
                            className={`w-11 h-11 rounded-xl font-black text-base border transition active:scale-95 ${
                              used
                                ? 'bg-white/[0.02] text-slate-600 border-white/5 cursor-not-allowed'
                                : 'bg-white/10 hover:bg-emerald-500/20 border-white/15 text-white hover:border-emerald-500/40'
                            }`}
                          >
                            {ch}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 9: 21 CARD SHOWDOWN                                       */}
          {/* ============================================================== */}
          {selectedGame.id === 'blackjack_21' && (
            <div className="space-y-4">
              {bjLoading ? (
                <div className="py-8 text-center text-sm font-bold text-slate-400">
                  Drawing cards from deck...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3 text-center">
                    <div className="text-xs font-bold text-slate-300">
                      Your Hand ({sumHand(yourHand)} / 21)
                    </div>
                    <div className="flex justify-center gap-2">
                      {yourHand.map((c, idx) => (
                        <img
                          key={idx}
                          src={c.image}
                          alt={c.code}
                          className="w-16 rounded shadow-md"
                        />
                      ))}
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleBjHit}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition active:scale-95"
                      >
                        Hit
                      </button>
                      <button
                        type="button"
                        onClick={handleBjStand}
                        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95"
                      >
                        Stand
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3 text-center">
                    <div className="text-xs font-bold text-slate-300">Rival Hand</div>
                    <div className="flex justify-center gap-2">
                      {rivalHand.map((c, idx) => (
                        <img
                          key={idx}
                          src={
                            idx === 1
                              ? 'https://deckofcardsapi.com/static/img/back.png'
                              : c.image
                          }
                          alt={c.code}
                          className="w-16 rounded shadow-md"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* GAME 10: TUG OF WAR SURGE                                      */}
          {/* ============================================================== */}
          {selectedGame.id === 'tug_of_war' && (
            <div className="space-y-4 text-center">
              <div className="w-full h-6 rounded-full bg-slate-200 relative overflow-hidden">
                <motion.div
                  animate={{ left: `${ropePos}%` }}
                  className="w-6 h-6 -translate-x-1/2 relative rounded-full bg-blue-600 border-2 border-white shadow-md"
                />
              </div>
              <button
                type="button"
                onClick={handlePullTug}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg transition"
              >
                ⚡ TAP FAST TO PULL FOR {myOption?.label?.toUpperCase()} (+20 PTS)!
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Round Over Celebration Banner */}
      {gameState === 'round_over' && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-indigo-400 shadow-2xl space-y-5 text-center">
          <div className="text-4xl">👑🎉</div>
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-widest">
              Round Complete
            </span>
            <h3 className="text-2xl font-black text-white">
              {roundResult || 'Mini-Game Finished!'}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200">
              Current Leader:{' '}
              <strong className="text-white">
                {leadingOption?.emoji} {leadingOption?.label} ({maxPts} PTS)
              </strong>
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-900/80 border border-indigo-400/40 text-amber-300 text-xs font-black tracking-wide shadow-sm animate-pulse">
                <span>⚡ Auto-advancing to next match in {autoAdvanceTimer}s... (No Delay)</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onFinishDuel(selectedGame?.name || 'Fall Guys Arena')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition transform active:scale-95"
            >
              <Trophy className="w-4 h-4 fill-slate-950" />
              <span>Advance {leadingOption?.label} to Next Match →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
