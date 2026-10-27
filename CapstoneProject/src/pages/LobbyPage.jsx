import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Copy,
  Check,
  Users,
  Plus,
  Trash2,
  Ban,
  Undo2,
  Swords,
  UserPlus,
  UserX,
  ShieldAlert,
  Gamepad2,
  Share2,
  Clock,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  LogOut,
} from 'lucide-react';
import {
  getRoomSnapshot,
  subscribeToRoom,
  getLocalPlayer,
  setLocalPlayer,
  joinRoom,
  leaveRoom,
  addOption,
  removeOption,
  toggleVetoOption,
  addDemoPlayers,
  addFriendPlayer,
  togglePlayerReady,
  startTournament,
  kickPlayer,
  getCurrentUser,
  subscribeToAuth,
} from '../services/realtimeStore';
import { getEligibleOptions } from '../services/bracketEngine';
import { getFirebaseDiagnostics } from '../services/firebase';
import AuthGate from '../components/AuthGate';

const EMOJI_CHOICES = ['🍕', '🍔', '🌮', '🍣', '🍜', '🥗', '🎬', '🍿', '🎳', '🎮', '☕', '✨'];

export default function LobbyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const roomCode = (code || '').toUpperCase();

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [snapshot, setSnapshot] = useState(() => getRoomSnapshot(roomCode));
  const [localPlayer, setLocalPlayerState] = useState(() => getLocalPlayer(roomCode));
  const [nicknameInput, setNicknameInput] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [shareSuccessMsg, setShareSuccessMsg] = useState('');

  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍕');
  const [startError, setStartError] = useState('');
  const [optionError, setOptionError] = useState('');

  const firebaseDiag = getFirebaseDiagnostics();

  useEffect(() => {
    return subscribeToAuth((u) => setCurrentUser(u));
  }, []);

  // Automatically link authenticated user as player in the room
  useEffect(() => {
    if (currentUser && !localPlayer && snapshot) {
      const existing = (snapshot.players || []).find(
        (p) => p.player_id === currentUser.user_id || p.nickname === (currentUser.fullName || currentUser.email?.split('@')[0])
      );
      if (existing) {
        setLocalPlayer(roomCode, existing);
        setLocalPlayerState(existing);
      } else {
        joinRoom({
          roomCode,
          nickname: currentUser.fullName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Player',
        })
          .then((res) => setLocalPlayerState(res.player))
          .catch(() => {});
      }
    }
  }, [currentUser, localPlayer, snapshot, roomCode]);

  useEffect(() => {
    return subscribeToRoom(roomCode, (data) => {
      setSnapshot(data);
      const p = getLocalPlayer(roomCode);
      if (p) setLocalPlayerState(p);

      if (data?.room?.status === 'dueling') {
        navigate(`/room/${roomCode}/duel`);
      } else if (data?.room?.status === 'tiebreak') {
        navigate(`/room/${roomCode}/tiebreak`);
      } else if (data?.room?.status === 'finished') {
        navigate(`/room/${roomCode}/result`);
      }
    });
  }, [roomCode, navigate]);

  if (!snapshot) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">Room "{roomCode}" Not Found</h2>
          <p className="text-xs text-slate-500">Check the code or create a new room from the home page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { room, players = [], options = [] } = snapshot;
  const eligibleOptions = getEligibleOptions(options, room.active_filters || {});

  if (!localPlayer) {
    const handleQuickJoin = async (e) => {
      e.preventDefault();
      setJoinErr('');
      const targetName = nicknameInput.trim() || currentUser?.fullName || currentUser?.displayName || 'Player';
      try {
        const res = await joinRoom({ roomCode, nickname: targetName });
        setLocalPlayerState(res.player);
      } catch (err) {
        setJoinErr(err.message);
      }
    };

    return (
      <AuthGate roomCode={roomCode}>
        <div className="max-w-md mx-auto px-4 py-14">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase text-violet-600">
                Room {roomCode}
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{room.title}</h1>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder={currentUser?.fullName ? `Join as ${currentUser.fullName}` : 'Enter your name to join...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
              />
              {joinErr && <p className="text-xs text-rose-600 font-semibold">{joinErr}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm"
              >
                Join as {nicknameInput.trim() || currentUser?.fullName || 'Player'}
              </button>
            </form>
          </div>
        </div>
      </AuthGate>
    );
  }

  const shareUrl = `${window.location.origin}/room/${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setShareSuccessMsg('Copied invite link to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setShareSuccessMsg('');
    }, 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setShareSuccessMsg(`Room code ${roomCode} copied!`);
    setTimeout(() => {
      setCopiedCode(false);
      setShareSuccessMsg('');
    }, 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Decision Duel: ${room.title}`,
          text: `Join our Decision Duel game to decide "${room.title}"! Room Code: ${roomCode}`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleToggleMyReady = async () => {
    try {
      await togglePlayerReady(roomCode, localPlayer.player_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveRoom = async () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
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

  const handleAddFriend = async (nameToAdd) => {
    const targetName = (nameToAdd || friendNameInput).trim();
    if (!targetName) return;
    try {
      await addFriendPlayer(roomCode, targetName);
      setFriendNameInput('');
      setShareSuccessMsg(`Added ${targetName} to room!`);
      setTimeout(() => setShareSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Error adding friend');
    }
  };

  const minPlayersNeeded = 2;
  const hasMinPlayers = players.length >= minPlayersNeeded;
  const unreadyPlayers = players.filter((p) => p.is_ready === false);
  const readyCount = players.filter((p) => p.is_ready !== false).length;
  const allPlayersReady = hasMinPlayers && unreadyPlayers.length === 0;
  const canStartTournament = eligibleOptions.length >= 2 && allPlayersReady;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Hey! Join our Decision Duel room: "${room.title}". Link: ${shareUrl} (Room Code: ${roomCode})`
  )}`;

  const handleAddOption = async (e) => {
    e.preventDefault();
    setOptionError('');
    if (!newLabel.trim()) return;
    try {
      await addOption(roomCode, {
        label: newLabel.trim(),
        emoji: newEmoji,
      });
      setNewLabel('');
    } catch (err) {
      setOptionError(err.message);
    }
  };

  const handleVeto = async (optId) => {
    setOptionError('');
    try {
      await toggleVetoOption(roomCode, optId, localPlayer.nickname);
    } catch (err) {
      setOptionError(err.message);
    }
  };

  const handleStartDuels = async () => {
    setStartError('');
    if (!hasMinPlayers) {
      setStartError('At least 2 players must join the room before you can start dueling! Use the Add Friends section below.');
      return;
    }
    if (unreadyPlayers.length > 0) {
      setStartError(`Cannot start yet! Waiting for all players to be Ready (${unreadyPlayers.map((p) => p.nickname).join(', ')} not ready).`);
      return;
    }
    if (eligibleOptions.length < 2) {
      setStartError('You need at least 2 active non-vetoed options to start.');
      return;
    }
    try {
      await startTournament(roomCode, localPlayer.player_id);
      navigate(`/room/${roomCode}/duel`);
    } catch (err) {
      setStartError(err.message);
    }
  };

  const handleKickPlayer = async (targetPlayerId, targetNickname) => {
    if (!window.confirm(`Are you sure you want to remove "${targetNickname}" from the lobby? (Host Power)`)) {
      return;
    }
    try {
      await kickPlayer(roomCode, localPlayer.player_id, targetPlayerId);
    } catch (err) {
      alert(err.message || 'Error removing player');
    }
  };

  if (localPlayer && snapshot?.players && !snapshot.players.some((p) => p.player_id === localPlayer.player_id)) {
    return (
      <AuthGate roomCode={roomCode}>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="glass-panel rounded-3xl p-8 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <UserX className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white">Removed from Room</h2>
            <p className="text-xs text-slate-400">
              You were removed from this room by the host ({room.host_name}).
            </p>
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

  return (
    <AuthGate roomCode={roomCode}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* 1. Room Header Glass Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                onClick={handleCopyCode}
                title="Click to copy room code"
                className="px-3 py-1 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 font-mono text-xs font-black transition flex items-center gap-1.5"
              >
                <span>CODE: {roomCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
              </button>
              <span className="text-xs text-slate-400 font-medium">
                • Hosted by <strong className="text-white">{room.host_name}</strong>
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
              {room.title}
            </h1>
          </div>

          {/* Ready Status Switch and Leave Room for current user */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMyReady}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition shadow-md active:scale-95 ${
                localPlayer.is_ready !== false
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-emerald-500/10'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
            >
              {localPlayer.is_ready !== false ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>You Are Ready! (Click to toggle)</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Click to Ready Up!</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLeaveRoom}
              title="Leave this lobby"
              className="px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 active:scale-95 shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* 2. Feature: ADD FRIENDS & QUICK INVITE */}
        <div className="glass-panel rounded-3xl p-6 border border-violet-500/20 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-violet-600/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">
                  Add & Invite Friends
                </h2>
                <p className="text-xs text-slate-400">
                  Instant browser join via link or code. No app install needed!
                </p>
              </div>
            </div>

            {shareSuccessMsg && (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30 animate-pulse">
                {shareSuccessMsg}
              </span>
            )}
          </div>

          {/* Action Buttons: WhatsApp, Copy Link, Native Share */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-violet-400" />}
              <span>{copied ? 'Copied Link!' : 'Copy Invite Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-violet-600/20 transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via Any App</span>
            </button>
          </div>

          {/* Quick Add Custom Friend or Companion Player */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={friendNameInput}
                onChange={(e) => setFriendNameInput(e.target.value)}
                placeholder="Add companion by name (e.g. Alex, Jordan)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => handleAddFriend()}
                className="px-4 py-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.2] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Companion</span>
              </button>
            </div>

            {/* Quick Friend Presets for Instant Testing */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                Quick Bots / Companions:
              </span>
              {['Priya', 'Aarav', 'Rohan', 'Alex'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleAddFriend(name)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-bold border border-violet-500/25 transition active:scale-95"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Players Row & Ready Status */}
        <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Players in Arena ({players.length})</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  allPlayersReady
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {readyCount} / {players.length} Ready
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {hasMinPlayers
                ? allPlayersReady
                  ? '✅ All players ready!'
                  : '⏳ Waiting for all to ready up'
                : '⚠️ Need min 2 players'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {players.map((p) => {
              const isReady = p.is_ready !== false;
              return (
                <span
                  key={p.player_id}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                    isReady
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200 animate-pulse'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isReady ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span>{p.nickname}</span>
                  {p.player_id === localPlayer.player_id && (
                    <span className="text-violet-400 font-semibold">(You)</span>
                  )}
                  {p.is_host && (
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-black uppercase">
                      Host
                    </span>
                  )}
                  {localPlayer.is_host && !p.is_host && (
                    <button
                      type="button"
                      onClick={() => handleKickPlayer(p.player_id, p.nickname)}
                      title={`Remove ${p.nickname} (Host Moderation Power)`}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition active:scale-90 ml-0.5"
                    >
                      <UserX className="w-3 h-3" />
                    </button>
                  )}
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isReady
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {isReady ? 'Ready' : 'Not Ready'}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* 4. Options List */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white">
                Duel Options ({eligibleOptions.length} Active / {options.length} Total)
              </h2>
              <p className="text-xs text-slate-400">
                Each player gets 1 Veto to strike out options. At least 2 active options needed to duel.
              </p>
            </div>
          </div>

          {/* Add Option Input */}
          <form onSubmit={handleAddOption} className="flex gap-2">
            <select
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-base focus:outline-none focus:border-violet-500"
            >
              {EMOJI_CHOICES.map((em) => (
                <option key={em} value={em} className="bg-slate-900 text-white">
                  {em}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Add choice (e.g. Sushi, Interstellar, Go-Karting)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {optionError && (
            <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {optionError}
            </p>
          )}

          {/* List of Options */}
          <div className="space-y-2">
            {options.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No options yet. Add at least 2 choices above!
              </div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.option_id}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition ${
                    opt.is_vetoed
                      ? 'bg-rose-500/10 border-rose-500/20 opacity-60'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{opt.emoji || '✨'}</span>
                    <div className="min-w-0">
                      <span
                        className={`text-sm font-bold block truncate ${
                          opt.is_vetoed ? 'line-through text-rose-400' : 'text-white'
                        }`}
                      >
                        {opt.label}
                      </span>
                      {opt.is_vetoed && (
                        <span className="text-[10px] text-rose-400 font-bold block">
                          Vetoed by {opt.vetoed_by || 'Player'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVeto(opt.option_id)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center gap-1 transition"
                      title="Veto this option (1 per player)"
                    >
                      {opt.is_vetoed ? (
                        <>
                          <Undo2 className="w-3.5 h-3.5 text-violet-400" /> Un-veto
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-400" /> Veto
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeOption(roomCode, opt.option_id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {startError && (
            <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {startError}
            </p>
          )}

          {!canStartTournament && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-2">
              <span>
                {!hasMinPlayers
                  ? `⚠️ Need at least 2 players to start a duel (currently ${players.length}). Use "Add & Invite Friends" above!`
                  : unreadyPlayers.length > 0
                  ? `⏳ Waiting for ${unreadyPlayers.length} player(s) to be ready (${unreadyPlayers.map((p) => p.nickname).join(', ')}).`
                  : '⚠️ Need at least 2 active options to duel.'}
              </span>
              {!hasMinPlayers && (
                <button
                  type="button"
                  onClick={() => handleAddFriend('Alex')}
                  className="px-2.5 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-black text-[11px] border border-amber-400/30 shrink-0"
                >
                  + Add Bot Alex
                </button>
              )}
            </div>
          )}

          {/* Start Duels CTA (Host Only Power) */}
          {localPlayer.is_host ? (
            <button
              type="button"
              onClick={handleStartDuels}
              disabled={!canStartTournament}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition"
            >
              <Swords className="w-4 h-4" />
              <span>
                {eligibleOptions.length < 2
                  ? `Need 2+ Options (${eligibleOptions.length} available)`
                  : !hasMinPlayers
                  ? `Waiting for 2+ Players (${players.length}/${minPlayersNeeded})`
                  : unreadyPlayers.length > 0
                  ? `Waiting for All Players to be Ready (${readyCount}/${players.length})`
                  : `🚀 Start Mini-Game Duels (${eligibleOptions.length} Options · Ready!)`}
              </span>
            </button>
          ) : (
            <div className="w-full py-4 px-6 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Waiting for Host ({room.host_name}) to start the tournament...</span>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
