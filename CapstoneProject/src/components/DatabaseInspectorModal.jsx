import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, X, Cloud, Check, KeyRound, Table } from 'lucide-react';
import { getFirebaseStatus, saveFirebaseConfig } from '../services/realtimeStore';

/**
 * Interactive ER Diagram & Live Database Inspector
 * Displays the exact 5 Entities from Section 5 (Page 4) of the Decision Duel Problem Statement:
 * PLAYER, ROOM, OPTION, VOTE, DUEL + Firebase Realtime Database configuration.
 */
export default function DatabaseInspectorModal({ isOpen, onClose, snapshot }) {
  const [activeTab, setActiveTab] = useState('er_entities');
  const fbStatus = getFirebaseStatus();
  const [dbUrl, setDbUrl] = useState(fbStatus.config?.databaseURL || '');
  const [apiKey, setApiKey] = useState(fbStatus.config?.apiKey || '');
  const [projectId, setProjectId] = useState(fbStatus.config?.projectId || '');
  const [savedMsg, setSavedMsg] = useState('');

  if (!isOpen) return null;

  const room = snapshot?.room || null;
  const players = snapshot?.players || [];
  const options = snapshot?.options || [];
  const duels = snapshot?.duels || [];
  const votes = snapshot?.votes || [];

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    if (!dbUrl.trim()) {
      saveFirebaseConfig(null);
      setSavedMsg('Switched to Built-in BroadcastChannel + LocalStorage Real-Time Sync.');
      return;
    }
    const ok = saveFirebaseConfig({
      apiKey: apiKey.trim(),
      databaseURL: dbUrl.trim(),
      projectId: projectId.trim(),
    });
    setSavedMsg(
      ok
        ? 'Connected to Firebase Realtime Database!'
        : 'Could not initialize Firebase — verify your databaseURL.'
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel w-full max-w-5xl max-h-[88vh] rounded-2xl border border-violet-500/30 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-violet-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  ER Diagram Entities & Live Realtime Database Inspector
                </h2>
                <p className="text-xs text-slate-400">
                  Matches Section 5 of the Problem Statement: ROOM, PLAYER, OPTION, DUEL, VOTE
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-navigation */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('er_entities')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'er_entities'
                  ? 'border-violet-400 text-violet-300 bg-violet-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />5 Live ER Entities
            </button>
            <button
              onClick={() => setActiveTab('firebase_config')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'firebase_config'
                  ? 'border-violet-400 text-violet-300 bg-violet-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              Realtime Sync & Firebase Setup
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'er_entities' ? (
              <>
                {!room ? (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-slate-300 text-sm">
                    Create or join a room first to see live records populate the 5 ER Diagram tables in real time!
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Entity 1: PLAYER */}
                  <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 overflow-hidden">
                    <div className="bg-violet-600 px-4 py-2 font-bold text-xs tracking-wider uppercase text-white flex justify-between">
                      <span>PLAYER</span>
                      <span>{players.length} rows</span>
                    </div>
                    <div className="p-3 text-xs space-y-1.5 border-b border-white/10 font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span>player_id</span>
                        <span className="text-violet-400 font-bold">PK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>room_id</span>
                        <span className="text-indigo-400 font-bold">FK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>nickname</span>
                        <span className="text-slate-500">STRING</span>
                      </div>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                      {players.map((p) => (
                        <div key={p.player_id} className="p-2 rounded bg-white/5 font-mono text-[11px]">
                          <div className="text-violet-300 truncate">PK: {p.player_id}</div>
                          <div className="text-white font-sans font-semibold">
                            nickname: {p.nickname} {p.is_host ? '(Host)' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entity 2: ROOM */}
                  <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 overflow-hidden">
                    <div className="bg-violet-600 px-4 py-2 font-bold text-xs tracking-wider uppercase text-white flex justify-between">
                      <span>ROOM</span>
                      <span>{room ? '1 row' : '0 rows'}</span>
                    </div>
                    <div className="p-3 text-xs space-y-1.5 border-b border-white/10 font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span>room_id</span>
                        <span className="text-violet-400 font-bold">PK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>room_code</span>
                        <span className="text-slate-500">STRING</span>
                      </div>
                      <div className="flex justify-between">
                        <span>host_name</span>
                        <span className="text-slate-500">STRING</span>
                      </div>
                      <div className="flex justify-between">
                        <span>status</span>
                        <span className="text-slate-500">ENUM</span>
                      </div>
                    </div>
                    {room && (
                      <div className="p-3 text-xs font-mono space-y-1 bg-white/5 m-3 rounded">
                        <div className="text-violet-300 truncate">PK: {room.room_id}</div>
                        <div>room_code: <span className="text-amber-300 font-bold">{room.room_code}</span></div>
                        <div>host_name: {room.host_name}</div>
                        <div>status: <span className="text-emerald-400">{room.status}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Entity 3: OPTION */}
                  <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 overflow-hidden">
                    <div className="bg-violet-600 px-4 py-2 font-bold text-xs tracking-wider uppercase text-white flex justify-between">
                      <span>OPTION</span>
                      <span>{options.length} rows</span>
                    </div>
                    <div className="p-3 text-xs space-y-1.5 border-b border-white/10 font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span>option_id</span>
                        <span className="text-violet-400 font-bold">PK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>room_id</span>
                        <span className="text-indigo-400 font-bold">FK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>label</span>
                        <span className="text-slate-500">STRING</span>
                      </div>
                      <div className="flex justify-between">
                        <span>is_vetoed</span>
                        <span className="text-slate-500">BOOLEAN</span>
                      </div>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                      {options.map((o) => (
                        <div key={o.option_id} className="p-2 rounded bg-white/5 font-mono text-[11px]">
                          <div className="text-white font-sans font-medium truncate">
                            {o.emoji} {o.label}
                          </div>
                          <div className="text-slate-400">
                            is_vetoed: <span className={o.is_vetoed ? 'text-rose-400' : 'text-emerald-400'}>{String(o.is_vetoed)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Entity 4: VOTE */}
                  <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 overflow-hidden">
                    <div className="bg-violet-600 px-4 py-2 font-bold text-xs tracking-wider uppercase text-white flex justify-between">
                      <span>VOTE</span>
                      <span>{votes.length} rows</span>
                    </div>
                    <div className="p-3 text-xs grid grid-cols-2 gap-2 border-b border-white/10 font-mono text-slate-300">
                      <div>vote_id <span className="text-violet-400 font-bold">PK</span></div>
                      <div>duel_id <span className="text-indigo-400 font-bold">FK</span></div>
                      <div>player_id <span className="text-indigo-400 font-bold">FK</span></div>
                      <div>option_id <span className="text-indigo-400 font-bold">FK</span></div>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                      {votes.length === 0 ? (
                        <div className="text-slate-500 italic">No votes cast yet</div>
                      ) : (
                        votes.map((v) => (
                          <div key={v.vote_id} className="p-2 rounded bg-white/5 font-mono text-[11px] flex justify-between">
                            <span className="truncate max-w-[180px]">player: {v.player_id.slice(0, 14)}…</span>
                            <span className="text-emerald-300 truncate">opt: {v.option_id.slice(-8)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Entity 5: DUEL */}
                  <div className="rounded-xl border border-violet-500/30 bg-slate-900/70 overflow-hidden">
                    <div className="bg-violet-600 px-4 py-2 font-bold text-xs tracking-wider uppercase text-white flex justify-between">
                      <span>DUEL</span>
                      <span>{duels.length} rows</span>
                    </div>
                    <div className="p-3 text-xs grid grid-cols-2 gap-1.5 border-b border-white/10 font-mono text-slate-300">
                      <div>duel_id <span className="text-violet-400 font-bold">PK</span></div>
                      <div>room_id <span className="text-indigo-400 font-bold">FK</span></div>
                      <div>round_no <span className="text-slate-500">INT</span></div>
                      <div>option_a_id <span className="text-indigo-400 font-bold">FK</span></div>
                      <div>option_b_id <span className="text-indigo-400 font-bold">FK</span></div>
                      <div>winner_id <span className="text-indigo-400 font-bold">FK</span></div>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                      {duels.length === 0 ? (
                        <div className="text-slate-500 italic">Bracket not started yet</div>
                      ) : (
                        duels.map((d) => (
                          <div key={d.duel_id} className="p-2 rounded bg-white/5 font-mono text-[11px] flex justify-between">
                            <span>R{d.round_no} • Duel #{d.duel_index}</span>
                            <span className={d.winner_id ? 'text-emerald-400' : 'text-amber-300'}>
                              {d.is_bye ? 'BYE' : d.winner_id ? 'Decided' : 'Voting'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveFirebase} className="space-y-4 max-w-xl">
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white mb-1">
                    Dual-Mode Real-Time Synchronization Active
                  </p>
                  By default, Decision Duel synchronizes votes and room state across all browser tabs/windows in{' '}
                  <strong className="text-emerald-300">&lt;50ms</strong> using{' '}
                  <code className="text-violet-300">BroadcastChannel</code> +{' '}
                  <code className="text-violet-300">localStorage</code>. You can also connect a Firebase Realtime Database URL below for cloud cross-device sync.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Firebase Realtime Database URL
                  </label>
                  <input
                    type="url"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="https://your-project-default-rtdb.firebaseio.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Firebase API Key (optional for public rules)
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="decision-duel-app"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Save Realtime Database Config
                </button>

                {savedMsg && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> {savedMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
