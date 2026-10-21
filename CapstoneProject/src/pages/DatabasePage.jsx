import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Table,
  Cloud,
  Download,
  RefreshCw,
  Check,
  KeyRound,
  PlusCircle,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import {
  getAllDatabaseSnapshots,
  getAllUsers,
  ensureSampleDatabaseSeed,
  getFirebaseStatus,
  saveFirebaseConfig,
} from '../services/realtimeStore';

export default function DatabasePage() {
  const [snapshots, setSnapshots] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState('ALL');
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'er_diagram' | 'sql_schema' | 'firebase'
  const [backendStatus, setBackendStatus] = useState({ online: false, schemaSql: '' });

  const fbStatus = getFirebaseStatus();
  const [dbUrl, setDbUrl] = useState(fbStatus.config?.databaseURL || '');
  const [apiKey, setApiKey] = useState(fbStatus.config?.apiKey || '');
  const [projectId, setProjectId] = useState(fbStatus.config?.projectId || '');
  const [savedMsg, setSavedMsg] = useState('');

  const refreshData = () => {
    const seeded = ensureSampleDatabaseSeed();
    setSnapshots(seeded);
    setUsers(getAllUsers());

    fetch('http://localhost:4000/api/db')
      .then((r) => r.json())
      .then((data) => {
        if (data?.status === 'online') {
          setBackendStatus({ online: true, schemaSql: data.schema_sql || '' });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredSnapshots =
    selectedRoomCode === 'ALL'
      ? snapshots
      : snapshots.filter((s) => s.room?.room_code === selectedRoomCode);

  const roomsList = filteredSnapshots.map((s) => s.room).filter(Boolean);
  const playersList = filteredSnapshots.flatMap((s) => s.players || []);
  const optionsList = filteredSnapshots.flatMap((s) => s.options || []);
  const duelsList = filteredSnapshots.flatMap((s) => s.duels || []);
  const votesList = filteredSnapshots.flatMap((s) => s.votes || []);

  const handleExportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      entities: {
        USER: users,
        ROOM: roomsList,
        PLAYER: playersList,
        OPTION: optionsList,
        DUEL: duelsList,
        VOTE: votesList,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision_duel_database_${Date.now()}.json`;
    a.click();
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    if (!dbUrl.trim()) {
      saveFirebaseConfig(null);
      setSavedMsg('Using Built-In Local + Node Server Database.');
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-violet-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-extrabold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              Live Database &amp; ER Explorer
            </span>
            {backendStatus.online && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                ● Node DB Server Online (Port 4000)
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900">
            Decision Duel Relational Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            On-disk database files located at{' '}
            <code className="bg-slate-100 px-2 py-0.5 rounded text-violet-700 font-bold">
              decision-duel/database/decision_duel_db.json
            </code>{' '}
            &amp;{' '}
            <code className="bg-slate-100 px-2 py-0.5 rounded text-violet-700 font-bold">
              decision-duel/database/schema.sql
            </code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedRoomCode}
            onChange={(e) => setSelectedRoomCode(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800"
          >
            <option value="ALL">All Rooms ({snapshots.length})</option>
            {snapshots.map((s) => (
              <option key={s.room.room_code} value={s.room.room_code}>
                Room {s.room.room_code} — {s.room.title}
              </option>
            ))}
          </select>

          <button
            onClick={refreshData}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'tables', label: '1. Live Relational Tables (6 Tables)', icon: Table },
          { id: 'er_diagram', label: '2. Visual ER Diagram Schema', icon: Database },
          { id: 'sql_schema', label: '3. SQL DDL (database/schema.sql)', icon: FileCode },
          { id: 'firebase', label: '4. Firebase Realtime DB Config', icon: Cloud },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeTab === t.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE RELATIONAL TABLES */}
      {activeTab === 'tables' && (
        <div className="space-y-8">
          {/* Summary Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { name: 'USER', count: users.length, color: 'bg-sky-50 border-sky-200 text-sky-700' },
              { name: 'ROOM', count: roomsList.length, color: 'bg-violet-50 border-violet-200 text-violet-700' },
              { name: 'PLAYER', count: playersList.length, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
              { name: 'OPTION', count: optionsList.length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { name: 'DUEL', count: duelsList.length, color: 'bg-rose-50 border-rose-200 text-rose-700' },
              { name: 'VOTE', count: votesList.length, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ].map((stat) => (
              <div key={stat.name} className={`p-4 rounded-2xl border ${stat.color} text-center`}>
                <div className="text-2xl font-black">{stat.count}</div>
                <div className="text-xs font-extrabold uppercase tracking-wider">{stat.name} Table</div>
              </div>
            ))}
          </div>

          {/* 0. USER TABLE (Registered Accounts) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-600 px-5 py-3 flex items-center justify-between text-white">
              <span className="font-extrabold text-sm tracking-wide">
                Table: USER (user_id PK, full_name, email, avatar, role)
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                {users.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">user_id (PK)</th>
                    <th className="py-3 px-4">avatar</th>
                    <th className="py-3 px-4">full_name</th>
                    <th className="py-3 px-4">email</th>
                    <th className="py-3 px-4">role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-sky-700 font-bold">{u.user_id}</td>
                      <td className="py-2.5 px-4 text-lg">{u.avatar || '⚡'}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                          {u.role || 'Host / Member'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1. ROOM TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-600 px-5 py-3 flex items-center justify-between text-white">
              <span className="font-extrabold text-sm tracking-wide">
                Entity 1: ROOM (room_id PK, room_code, host_name, status)
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                {roomsList.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">room_id (PK)</th>
                    <th className="py-3 px-4">room_code</th>
                    <th className="py-3 px-4">host_name</th>
                    <th className="py-3 px-4">title</th>
                    <th className="py-3 px-4">status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomsList.map((r) => (
                    <tr key={r.room_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-violet-700 font-semibold">{r.room_id}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-600">{r.room_code}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{r.host_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{r.title}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase text-[10px]">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <Link
                          to={`/room/${r.room_code}`}
                          className="text-violet-600 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. PLAYER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between text-white">
              <span className="font-extrabold text-sm tracking-wide">
                Entity 2: PLAYER (player_id PK, room_id FK, nickname)
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                {playersList.length} records
              </span>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase sticky top-0">
                  <tr>
                    <th className="py-3 px-4">player_id (PK)</th>
                    <th className="py-3 px-4">room_id (FK)</th>
                    <th className="py-3 px-4">nickname</th>
                    <th className="py-3 px-4">role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {playersList.map((p) => (
                    <tr key={p.player_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-indigo-700">{p.player_id}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{p.room_id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.nickname}</td>
                      <td className="py-2.5 px-4">
                        {p.is_host ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Host
                          </span>
                        ) : (
                          <span className="text-slate-500">Participant</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. OPTION TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-amber-500 px-5 py-3 flex items-center justify-between text-slate-950">
              <span className="font-extrabold text-sm tracking-wide">
                Entity 3: OPTION (option_id PK, room_id FK, label, is_vetoed)
              </span>
              <span className="text-xs bg-black/10 px-2.5 py-0.5 rounded-full font-bold">
                {optionsList.length} records
              </span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase sticky top-0">
                  <tr>
                    <th className="py-3 px-4">option_id (PK)</th>
                    <th className="py-3 px-4">room_id (FK)</th>
                    <th className="py-3 px-4">label</th>
                    <th className="py-3 px-4">is_vetoed</th>
                    <th className="py-3 px-4">criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {optionsList.map((o) => (
                    <tr key={o.option_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-amber-700">{o.option_id}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{o.room_id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {o.emoji} {o.label}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            o.is_vetoed
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {String(o.is_vetoed)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {o.price_tag} • {o.is_veg ? 'Veg' : 'Non-Veg'} • {o.duration_tag}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. DUEL & 5. VOTE TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-rose-600 px-5 py-3 flex items-center justify-between text-white">
                <span className="font-extrabold text-sm">
                  Entity 4: DUEL (duel_id PK, round_no, option_a_id, option_b_id, winner_id)
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {duelsList.length}
                </span>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">duel_id (PK)</th>
                      <th className="py-2.5 px-3">round_no</th>
                      <th className="py-2.5 px-3">option_a / b (FK)</th>
                      <th className="py-2.5 px-3">winner_id (FK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {duelsList.map((d) => (
                      <tr key={d.duel_id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-rose-700">{d.duel_id.slice(0, 16)}…</td>
                        <td className="py-2 px-3 font-bold">Round {d.round_no}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {d.option_a_id?.slice(-6)} vs {d.is_bye ? 'BYE' : d.option_b_id?.slice(-6)}
                        </td>
                        <td className="py-2 px-3 font-mono text-emerald-700 font-bold">
                          {d.winner_id ? d.winner_id.slice(-8) : 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-600 px-5 py-3 flex items-center justify-between text-white">
                <span className="font-extrabold text-sm">
                  Entity 5: VOTE (vote_id PK, duel_id FK, player_id FK, option_id FK)
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {votesList.length}
                </span>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">vote_id (PK)</th>
                      <th className="py-2.5 px-3">duel_id (FK)</th>
                      <th className="py-2.5 px-3">player_id (FK)</th>
                      <th className="py-2.5 px-3">option_id (FK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {votesList.map((v) => (
                      <tr key={v.vote_id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-emerald-700">{v.vote_id.slice(0, 14)}…</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{v.duel_id.slice(0, 12)}…</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{v.player_id.slice(0, 12)}…</td>
                        <td className="py-2 px-3 font-mono text-violet-700 font-bold">{v.option_id.slice(-8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL ER DIAGRAM */}
      {activeTab === 'er_diagram' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Section 5: Sample ER Diagram Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Five core entities store everything the website needs, kept as nodes in Firebase Realtime Database or tables in an SQL database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="rounded-2xl border-2 border-violet-500 bg-violet-50/40 overflow-hidden shadow-sm">
              <div className="bg-violet-600 text-white font-extrabold text-center py-2.5 text-sm tracking-wider">
                PLAYER
              </div>
              <div className="p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>player_id</span><strong className="text-violet-700">PK</strong></div>
                <div className="flex justify-between"><span>room_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>nickname</span><span className="text-slate-500">VARCHAR</span></div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-violet-600 bg-violet-50/60 overflow-hidden shadow-md">
              <div className="bg-violet-700 text-white font-extrabold text-center py-2.5 text-sm tracking-wider">
                ROOM (Central Entity)
              </div>
              <div className="p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>room_id</span><strong className="text-violet-700">PK</strong></div>
                <div className="flex justify-between"><span>room_code</span><span className="text-slate-500">VARCHAR(6)</span></div>
                <div className="flex justify-between"><span>host_name</span><span className="text-slate-500">VARCHAR</span></div>
                <div className="flex justify-between"><span>status</span><span className="text-slate-500">ENUM</span></div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-violet-500 bg-violet-50/40 overflow-hidden shadow-sm">
              <div className="bg-violet-600 text-white font-extrabold text-center py-2.5 text-sm tracking-wider">
                OPTION
              </div>
              <div className="p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>option_id</span><strong className="text-violet-700">PK</strong></div>
                <div className="flex justify-between"><span>room_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>label</span><span className="text-slate-500">VARCHAR</span></div>
                <div className="flex justify-between"><span>is_vetoed</span><span className="text-slate-500">BOOLEAN</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-violet-500 bg-violet-50/40 overflow-hidden shadow-sm">
              <div className="bg-violet-600 text-white font-extrabold text-center py-2.5 text-sm tracking-wider">
                VOTE (PLAYER casts N VOTE for 1 DUEL)
              </div>
              <div className="p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>vote_id</span><strong className="text-violet-700">PK</strong></div>
                <div className="flex justify-between"><span>duel_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>player_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>option_id</span><strong className="text-indigo-600">FK</strong></div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-violet-500 bg-violet-50/40 overflow-hidden shadow-sm">
              <div className="bg-violet-600 text-white font-extrabold text-center py-2.5 text-sm tracking-wider">
                DUEL (ROOM has N DUEL featuring OPTION A, B &amp; Winner)
              </div>
              <div className="p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>duel_id</span><strong className="text-violet-700">PK</strong></div>
                <div className="flex justify-between"><span>room_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>round_no</span><span className="text-slate-500">INT</span></div>
                <div className="flex justify-between"><span>option_a_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>option_b_id</span><strong className="text-indigo-600">FK</strong></div>
                <div className="flex justify-between"><span>winner_id</span><strong className="text-indigo-600">FK</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SQL DDL SCHEMA */}
      {activeTab === 'sql_schema' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                SQL Relational Schema (database/schema.sql)
              </h2>
              <p className="text-xs text-slate-500">
                Ready for SQLite / PostgreSQL / MySQL or Firebase Realtime Database
              </p>
            </div>
            <a
              href="http://localhost:4000/api/db"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Open Raw Backend Endpoint (:4000/api/db)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <pre className="p-5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {backendStatus.schemaSql ||
              `CREATE TABLE ROOM (room_id PK, room_code, host_name, status);\nCREATE TABLE PLAYER (player_id PK, room_id FK, nickname);\nCREATE TABLE OPTION (option_id PK, room_id FK, label, is_vetoed);\nCREATE TABLE DUEL (duel_id PK, room_id FK, round_no, option_a_id FK, option_b_id FK, winner_id FK);\nCREATE TABLE VOTE (vote_id PK, duel_id FK, player_id FK, option_id FK);`}
          </pre>
        </div>
      )}

      {/* TAB 4: FIREBASE CONFIG */}
      {activeTab === 'firebase' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl space-y-5">
          <h2 className="text-xl font-extrabold text-slate-900">
            Connect Firebase Realtime Database (Optional)
          </h2>
          <form onSubmit={handleSaveFirebase} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Firebase Realtime Database URL
              </label>
              <input
                type="url"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="decision-duel"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Save Database Connection</span>
            </button>
            {savedMsg && (
              <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> {savedMsg}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
