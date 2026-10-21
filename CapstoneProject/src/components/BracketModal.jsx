import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Swords, Sparkles, CheckCircle2 } from 'lucide-react';
import { getRoundLabel } from '../services/bracketEngine';

export default function BracketModal({ isOpen, onClose, snapshot }) {
  if (!isOpen || !snapshot) return null;

  const { room, options = [], duels = [], votes = [] } = snapshot;
  const optionMap = Object.fromEntries(options.map((o) => [o.option_id, o]));

  const roundsMap = new Map();
  duels.forEach((d) => {
    if (!roundsMap.has(d.round_no)) {
      roundsMap.set(d.round_no, []);
    }
    roundsMap.get(d.round_no).push(d);
  });

  const roundNumbers = Array.from(roundsMap.keys()).sort((a, b) => a - b);
  const totalRounds = room.total_rounds || roundNumbers.length || 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="glass-panel bg-[#0C0E1A]/95 w-full max-w-5xl max-h-[88vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-md shadow-violet-600/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Live Tournament Bracket</h2>
                <p className="text-xs text-slate-400">
                  {room.title} • {options.filter((o) => !o.is_vetoed).length} contenders
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bracket Tree Body */}
          <div className="p-6 overflow-x-auto overflow-y-auto flex-1 bg-[#0A0B14]/60">
            {roundNumbers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold">
                Bracket will appear once the duels start from the Lobby!
              </div>
            ) : (
              <div className="flex gap-6 min-w-max">
                {roundNumbers.map((rNo) => {
                  const roundDuels = roundsMap.get(rNo) || [];
                  const label = getRoundLabel(rNo, totalRounds, roundDuels.length);

                  return (
                    <div key={rNo} className="w-72 flex flex-col gap-4">
                      <div className="px-3.5 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-violet-300">
                          {label}
                        </span>
                        <span className="text-xs font-semibold text-violet-400">
                          Round {rNo} ({roundDuels.length})
                        </span>
                      </div>

                      <div className="flex flex-col gap-4 justify-around flex-1">
                        {roundDuels.map((duel) => {
                          const optA = optionMap[duel.option_a_id];
                          const optB = duel.option_b_id ? optionMap[duel.option_b_id] : null;
                          const duelVotes = votes.filter((v) => v.duel_id === duel.duel_id);
                          const votesA = duelVotes.filter((v) => v.option_id === duel.option_a_id).length;
                          const votesB = duelVotes.filter((v) => v.option_id === duel.option_b_id).length;
                          const isCurrent = room.current_duel_id === duel.duel_id && room.status !== 'finished';

                          return (
                            <div
                              key={duel.duel_id}
                              className={`rounded-2xl p-3.5 border transition shadow-sm ${
                                isCurrent
                                  ? 'bg-amber-500/10 border-amber-400/50 ring-2 ring-amber-400/25 shadow-lg shadow-amber-500/10'
                                  : 'glass-card border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                                <span className="font-bold flex items-center gap-1 text-slate-300">
                                  <Swords className="w-3.5 h-3.5 text-violet-400" />
                                  Duel #{duel.duel_index}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
                                    Active Now
                                  </span>
                                )}
                                {duel.is_bye && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                                    BYE Advance
                                  </span>
                                )}
                                {duel.won_by_tiebreak && (
                                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-black flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Tiebreak
                                  </span>
                                )}
                              </div>

                              {/* Option A */}
                              <div
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs mb-1.5 border transition ${
                                  duel.winner_id === duel.option_a_id
                                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 font-black'
                                    : duel.winner_id
                                    ? 'bg-white/[0.02] border-white/5 text-slate-500 line-through'
                                    : 'bg-white/[0.04] border-white/10 text-white font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span>{optA?.emoji || '🔹'}</span>
                                  <span className="truncate">{optA?.label || 'Option A'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                  {!duel.is_bye && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-black">
                                      {votesA}v
                                    </span>
                                  )}
                                  {duel.winner_id === duel.option_a_id && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                </div>
                              </div>

                              {/* Option B or BYE */}
                              {duel.is_bye ? (
                                <div className="px-3 py-1.5 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-[11px] text-slate-500 italic text-center">
                                  Odd count — automatic bye
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition ${
                                    duel.winner_id === duel.option_b_id
                                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 font-black'
                                      : duel.winner_id
                                      ? 'bg-white/[0.02] border-white/5 text-slate-500 line-through'
                                      : 'bg-white/[0.04] border-white/10 text-white font-medium'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span>{optB?.emoji || '🔸'}</span>
                                    <span className="truncate">{optB?.label || 'Option B'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-black">
                                      {votesB}v
                                    </span>
                                    {duel.winner_id === duel.option_b_id && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                  </div>
                                </div>
                              )}

                              {duel.tiebreak_detail && !duel.is_bye && (
                                <div className="mt-2 text-[10px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-semibold">
                                  ⚡ {duel.tiebreak_detail}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
