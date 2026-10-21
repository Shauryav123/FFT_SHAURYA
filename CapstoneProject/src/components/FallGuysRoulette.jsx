import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dices,
  Play,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Target,
  Brain,
  Layers,
  Footprints,
  Compass,
  Bomb,
  Repeat,
} from 'lucide-react';

export const FALL_GUYS_GAMES = [
  {
    id: 'tail_tag',
    name: 'Tail Tag Rush',
    category: 'HUNT',
    color: 'from-amber-400 via-yellow-400 to-orange-500',
    accentColor: '#f59e0b',
    icon: '🦊',
    desc: 'Grab & hold the Golden Tail before time expires to rack up points!',
    duration: '10s',
    pointsMax: '+120 PTS',
  },
  {
    id: 'door_dash',
    name: 'Door Dash Sprint',
    category: 'RACE',
    color: 'from-pink-500 via-rose-500 to-red-500',
    accentColor: '#ec4899',
    icon: '🚪',
    desc: 'Pick the real door at each barrier! Fake doors bounce back, real doors crash open!',
    duration: '3 Gates',
    pointsMax: '+150 PTS',
  },
  {
    id: 'hex_a_drop',
    name: 'Hex-A-Drop',
    category: 'SURVIVAL',
    color: 'from-violet-600 via-purple-600 to-indigo-700',
    accentColor: '#8b5cf6',
    icon: '🧱',
    desc: 'Tiles crumble under your feet! Tap safe tiles to stay above the slime pit!',
    duration: 'Multi-Tier',
    pointsMax: '+140 PTS',
  },
  {
    id: 'blast_ball',
    name: 'Blast Ball Hot Potato',
    category: 'SURVIVAL',
    color: 'from-red-500 via-orange-500 to-amber-500',
    accentColor: '#ef4444',
    icon: '💣',
    desc: 'The bomb fuse is burning! Chuck it to the rival side before it detonates!',
    duration: '6s Fuse',
    pointsMax: '+130 PTS',
  },
  {
    id: 'trivia_drop',
    name: 'Trivia Drop Blitz',
    category: 'LOGIC',
    color: 'from-cyan-500 via-blue-600 to-indigo-600',
    accentColor: '#06b6d4',
    icon: '🧠',
    desc: 'Pop quiz trivia challenge! Answer fast before the timer drops!',
    duration: '10s Quiz',
    pointsMax: '+100 PTS',
  },
  {
    id: 'word_scramble',
    name: 'Word Scramble Rush',
    category: 'LOGIC',
    color: 'from-emerald-500 via-teal-500 to-cyan-600',
    accentColor: '#10b981',
    icon: '🔤',
    desc: 'Unscramble the secret word clue to claim the crown!',
    duration: '15s Word',
    pointsMax: '+100 PTS',
  },
  {
    id: 'target_blitz',
    name: 'Target Tap Frenzy',
    category: 'SKILL',
    color: 'from-fuchsia-500 via-pink-600 to-rose-600',
    accentColor: '#d946ef',
    icon: '🎯',
    desc: 'Targets and golden crowns are popping up! Tap as many as possible!',
    duration: '8s',
    pointsMax: '+125 PTS',
  },
  {
    id: 'blackjack_21',
    name: '21 Card Showdown',
    category: 'CARDS',
    color: 'from-slate-700 via-indigo-900 to-slate-900',
    accentColor: '#6366f1',
    icon: '🃏',
    desc: 'Draw high cards from the deck. Beat the rival hand without busting 21!',
    duration: 'Turn Based',
    pointsMax: '+100 PTS',
  },
  {
    id: 'tug_of_war',
    name: 'Tug of War Surge',
    category: 'TEAM',
    color: 'from-blue-600 via-indigo-600 to-violet-600',
    accentColor: '#3b82f6',
    icon: '⚡',
    desc: 'Mash to pull the glowing energy beam into your contender zone!',
    duration: 'Mash Race',
    pointsMax: '+100 PTS',
  },
  {
    id: 'tip_toe',
    name: 'Tip Toe Minefield',
    category: 'MEMORY',
    color: 'from-lime-500 via-emerald-500 to-teal-600',
    accentColor: '#84cc16',
    icon: '👣',
    desc: 'Find the safe glowing tiles to cross the bridge. Watch out for trapdoors!',
    duration: '3x3 Grid',
    pointsMax: '+110 PTS',
  },
];

// Web Audio sound synthesizer for Fall Guys style ticks and fanfare
function playSynthSound(type = 'tick') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'lock') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 fanfare
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.3);
      });
    }
  } catch {
    // Ignore audio errors if audio context is blocked
  }
}

export default function FallGuysRoulette({
  selectedGame,
  onSelectGame,
  onStartRound,
  optA,
  optB,
  chosenSide,
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = FALL_GUYS_GAMES.findIndex((g) => g.id === selectedGame?.id);
    return idx >= 0 ? idx : 0;
  });
  const [lockedIn, setLockedIn] = useState(true);
  const spinTimerRef = useRef(null);

  const startSpinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLockedIn(false);

    let speed = 60; // fast initial tick
    let iterations = 0;
    const maxIterations = 24 + Math.floor(Math.random() * 8);

    const step = () => {
      iterations++;
      setCurrentIndex((prev) => (prev + 1) % FALL_GUYS_GAMES.length);
      playSynthSound('tick');

      if (iterations < maxIterations) {
        if (iterations > maxIterations - 8) {
          speed += 35; // decelerate like a real roulette wheel
        }
        spinTimerRef.current = setTimeout(step, speed);
      } else {
        // Lock in!
        const finalIdx = (currentIndex + 1) % FALL_GUYS_GAMES.length;
        const chosen = FALL_GUYS_GAMES[finalIdx];
        setCurrentIndex(finalIdx);
        setIsSpinning(false);
        setLockedIn(true);
        playSynthSound('lock');
        onSelectGame(chosen);
      }
    };

    spinTimerRef.current = setTimeout(step, speed);
  };

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  const activeGame = FALL_GUYS_GAMES[currentIndex];
  const chosenContender = chosenSide === 'B' ? optB : optA;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white border-2 border-indigo-500/40 shadow-2xl">
      {/* Background Neon Glow Rings */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Fall Guys Round Generator
              </span>
              <span className="text-xs text-indigo-300 font-bold">
                10 Party Mini-Games
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Random Mini-Game Selection
            </h2>
          </div>
        </div>

        {/* Re-Roll / Spin Button */}
        <button
          type="button"
          onClick={startSpinRoulette}
          disabled={isSpinning}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition transform active:scale-95 ${
            isSpinning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 hover:brightness-110 text-white shadow-pink-500/25'
          }`}
        >
          <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'Generating...' : '🎲 Spin New Game'}</span>
        </button>
      </div>

      {/* Spinning Carousel Visual Reel */}
      <div className="relative z-10 py-6">
        <div className="flex items-center justify-center gap-3 overflow-hidden py-2">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const index =
              (currentIndex + offset + FALL_GUYS_GAMES.length) % FALL_GUYS_GAMES.length;
            const game = FALL_GUYS_GAMES[index];
            const isCenter = offset === 0;

            return (
              <motion.div
                key={`${offset}-${game.id}`}
                animate={{
                  scale: isCenter ? 1.08 : 0.85,
                  opacity: isCenter ? 1 : 0.45,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`shrink-0 rounded-2xl border-2 transition-all p-3 sm:p-4 text-center select-none ${
                  isCenter
                    ? 'w-44 sm:w-56 bg-gradient-to-br ' +
                      game.color +
                      ' border-white shadow-2xl shadow-indigo-500/50'
                    : 'w-28 sm:w-36 bg-slate-800/80 border-slate-700 hidden sm:block'
                }`}
              >
                <div className="text-3xl sm:text-4xl mb-1">{game.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-white/80">
                  {game.category}
                </div>
                <div className="font-black text-xs sm:text-sm text-white truncate">
                  {game.name}
                </div>
                {isCenter && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-extrabold text-white">
                    {game.pointsMax}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Game Card Showcase */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGame.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="relative z-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeGame.color} flex items-center justify-center text-3xl shadow-lg`}
              >
                {activeGame.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-white/20 text-white uppercase tracking-wider">
                    {activeGame.category}
                  </span>
                  <span className="text-xs text-amber-300 font-extrabold">
                    {activeGame.duration}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {activeGame.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                  {activeGame.desc}
                </p>
              </div>
            </div>

            {/* Target Contender & Play Button */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="text-xs text-slate-300 font-semibold">
                Playing for:{' '}
                <strong className="text-amber-300">
                  {chosenContender?.emoji} {chosenContender?.label}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => onStartRound(activeGame)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play Selected Round</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
