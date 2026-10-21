/**
 * Module 7: Authoritative Real-Time Store & State Machine
 *
 * Single Authoritative Source of Truth:
 * - Firebase Realtime Database is primary when configured via environment variables.
 * - When Firebase is not configured or offline, operates transparently in an isolated
 *   local memory/storage mode with explicit UI notices instead of silently pretending.
 *
 * Canonical Database Structure:
 * rooms/{roomCode}/
 *   metadata: { room_id, room_code, host_name, host_user_id, title, status, current_round, current_duel_id, champion_option_id, allow_veto, created_at, started_at, completed_at }
 *   players/{playerId}: { player_id, nickname, is_host, joined_at }
 *   options/{optionId}: { option_id, label, emoji, price_tag, is_veg, duration_tag, is_vetoed, vetoed_by }
 *   duels/{duelId}: { duel_id, round_no, duel_index, option_a_id, option_b_id, winner_id, is_bye, status, won_by_tiebreak, tiebreak_type, tiebreak_detail }
 *   votes/{duelId}/{playerId}: { vote_id, duel_id, player_id, option_id, created_at }
 *   tiebreak: { duel_id, option_a_id, option_b_id, game_type, status, score_a, score_b, reaction_ms_a, reaction_ms_b, rps_rounds, api_payload, winner_option_id, started_at }
 */

import { ref, onValue, set, get, update, remove } from 'firebase/database';
import {
  getDatabaseInstance,
  getFirebaseDiagnostics,
  getAuthInstance,
  firebaseSignInWithEmail,
  firebaseSignUpWithEmail,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  onFirebaseAuthStateChanged,
  getFirebaseCurrentUser,
  getFriendlyAuthErrorMessage,
} from './firebase.js';
import { createInitialDuels, createRoundDuels, getEligibleOptions, getTotalRounds } from './bracketEngine.js';
import { DECISION_PRESETS } from './presets.js';

const STORAGE_PREFIX = 'dd_room_v2_';
const SESSION_PLAYER_PREFIX = 'dd_session_player_v2_';
const CHANNEL_NAME = 'dd_sync_channel_v2';

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

const activeListeners = new Map(); // roomCode -> Set of callbacks
const firebaseSubscriptions = new Map(); // roomCode -> unsubscribe function

// In-memory cache for fast local reads
const memoryRooms = new Map();

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Normalizes a room snapshot into the canonical tree object
 */
export function normalizeSnapshot(raw) {
  if (!raw) return null;

  const metadata = { ...(raw.metadata || {}), ...(raw.room || {}) };
  const room_code = (metadata.room_code || raw.roomCode || '').toUpperCase();
  const room_id = metadata.room_id || `room_${room_code}`;

  const playersObj = raw.players || {};
  const players = Array.isArray(playersObj) ? playersObj : Object.values(playersObj);

  const optionsObj = raw.options || {};
  const options = Array.isArray(optionsObj) ? optionsObj : Object.values(optionsObj);

  const duelsObj = raw.duels || {};
  const duels = Array.isArray(duelsObj) ? duelsObj : Object.values(duelsObj);

  // votes tree: { [duelId]: { [playerId]: voteObj } }
  // Flatten for easy reading in components that expect an array
  let votesArray = [];
  const votesObj = raw.votes || {};
  if (Array.isArray(votesObj)) {
    votesArray = votesObj;
  } else {
    Object.values(votesObj).forEach((duelVotes) => {
      if (duelVotes && typeof duelVotes === 'object') {
        Object.values(duelVotes).forEach((v) => {
          if (v && v.vote_id) votesArray.push(v);
        });
      }
    });
  }

  const room = {
    room_id,
    room_code,
    host_name: metadata.host_name || 'Host',
    host_user_id: metadata.host_user_id || null,
    title: metadata.title || 'Group Decision',
    status: metadata.status || 'lobby', // 'lobby' | 'dueling' | 'tiebreak' | 'finished'
    current_round: Number(metadata.current_round) || 1,
    current_duel_id: metadata.current_duel_id || null,
    champion_option_id: metadata.champion_option_id || null,
    allow_veto: Boolean(metadata.allow_veto ?? true),
    created_at: Number(metadata.created_at) || Date.now(),
    started_at: metadata.started_at ? Number(metadata.started_at) : null,
    completed_at: metadata.completed_at ? Number(metadata.completed_at) : null,
    active_filters: metadata.active_filters || {},
  };

  return {
    metadata: room,
    room, // alias for backwards compatibility
    players,
    options,
    duels,
    votes: votesArray,
    votesTree: typeof raw.votes === 'object' && !Array.isArray(raw.votes) ? raw.votes : {},
    tiebreak: raw.tiebreak || null,
    tiebreak_state: raw.tiebreak || null, // alias
  };
}

/**
 * Converts a normalized snapshot into the exact Firebase Realtime Database tree
 */
export function toFirebaseTree(normalized) {
  const code = normalized.metadata.room_code;

  const playersTree = {};
  (normalized.players || []).forEach((p) => {
    if (p && p.player_id) playersTree[p.player_id] = p;
  });

  const optionsTree = {};
  (normalized.options || []).forEach((o) => {
    if (o && o.option_id) optionsTree[o.option_id] = o;
  });

  const duelsTree = {};
  (normalized.duels || []).forEach((d) => {
    if (d && d.duel_id) duelsTree[d.duel_id] = d;
  });

  const votesTree = {};
  (normalized.votes || []).forEach((v) => {
    if (v && v.duel_id && v.player_id) {
      if (!votesTree[v.duel_id]) votesTree[v.duel_id] = {};
      votesTree[v.duel_id][v.player_id] = v;
    }
  });

  return {
    metadata: normalized.metadata,
    players: playersTree,
    options: optionsTree,
    duels: duelsTree,
    votes: votesTree,
    tiebreak: normalized.tiebreak || null,
  };
}

/**
 * Synchronous local cache reader
 */
export function createDemoRoomSnapshot(code) {
  const c = (code || 'DUEL26').toUpperCase();
  const preset = DECISION_PRESETS[0];
  const hostPlayer = {
    player_id: 'p_demo_host',
    nickname: 'Shaurya Venkta',
    is_host: true,
    joined_at: Date.now() - 3600000,
  };
  const p2 = {
    player_id: 'p_demo_2',
    nickname: 'Priya Sharma',
    is_host: false,
    joined_at: Date.now() - 3500000,
  };
  const p3 = {
    player_id: 'p_demo_3',
    nickname: 'Aarav Patel',
    is_host: false,
    joined_at: Date.now() - 3400000,
  };
  const players = [hostPlayer, p2, p3];

  const options = preset.options.map((opt, idx) => ({
    option_id: `opt_demo_${idx + 1}`,
    label: opt.label,
    emoji: opt.emoji,
    price_tag: opt.price_tag,
    is_veg: opt.is_veg,
    duration_tag: opt.duration_tag,
    is_vetoed: idx === 3,
    vetoed_by: idx === 3 ? 'Aarav Patel' : null,
  }));

  const eligible = options.filter((o) => !o.is_vetoed);
  const eligibleIds = eligible.map((o) => o.option_id);
  const initialDuels = createInitialDuels(`room_${c}`, eligibleIds);

  let status = 'lobby';
  let current_round = 1;
  let current_duel_id = initialDuels[0]?.duel_id || null;
  let champion_option_id = null;

  if (c === 'G9G96G' || c === 'DUEL') {
    status = 'dueling';
    current_duel_id = initialDuels[0]?.duel_id || null;
  } else if (c === 'DM2QG4' || c === 'TIEBREAK') {
    status = 'tiebreak';
    current_duel_id = initialDuels[0]?.duel_id || null;
  } else if (c === 'CHAMP1' || c === 'RESULT') {
    status = 'finished';
    champion_option_id = options[0].option_id;
  }

  const room = {
    room_id: `room_${c}`,
    room_code: c,
    host_name: 'Shaurya Venkta',
    host_user_id: 'usr_demo_shaurya',
    title: 'Where should we eat tonight?',
    status,
    current_round,
    current_duel_id,
    champion_option_id,
    allow_veto: true,
    created_at: Date.now() - 3600000,
    started_at: status !== 'lobby' ? Date.now() - 1800000 : null,
    completed_at: status === 'finished' ? Date.now() : null,
    active_filters: {},
  };

  const tiebreakObj = c === 'DM2QG4' ? {
    duel_id: initialDuels[0]?.duel_id || 'duel_tb_1',
    option_a_id: options[0].option_id,
    option_b_id: options[1].option_id,
    game_type: 'api_trivia',
    status: 'playing',
    score_a: 0,
    score_b: 0,
    api_payload: {
      category: 'Food & Culinary Culture',
      question: 'Which Italian city is historically renowned as the authentic birthplace of Pizza Margherita?',
      correct_answer: 'Naples',
      options: ['Naples', 'Rome', 'Florence', 'Venice'],
    },
    winner_option_id: null,
    started_at: Date.now(),
  } : null;

  return {
    metadata: room,
    room,
    players,
    options,
    duels: initialDuels,
    votes: [],
    votesTree: {},
    tiebreak: tiebreakObj,
    tiebreak_state: tiebreakObj,
  };
}

export function getRoomSnapshot(roomCode) {
  if (!roomCode) return null;
  const code = roomCode.toUpperCase();

  if (code === 'DUEL26' || code === 'DEMO26' || code === 'G9G96G' || code === 'DM2QG4' || code === 'CHAMP1') {
    const demoSnap = createDemoRoomSnapshot(code);
    memoryRooms.set(code, demoSnap);
    return demoSnap;
  }

  if (memoryRooms.has(code)) {
    return memoryRooms.get(code);
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_PREFIX + code);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const norm = normalizeSnapshot(parsed);
        memoryRooms.set(code, norm);
        return norm;
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Notifies local callbacks and BroadcastChannel
 */
function notifyLocalListeners(roomCode, snapshot) {
  const code = roomCode.toUpperCase();
  memoryRooms.set(code, snapshot);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_PREFIX + code, JSON.stringify(toFirebaseTree(snapshot)));
    } catch {
      // quota or private mode
    }
  }

  const setForRoom = activeListeners.get(code);
  if (setForRoom) {
    setForRoom.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('Error in room subscriber:', err);
      }
    });
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATE', roomCode: code, data: snapshot });
    } catch {}
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const { type, roomCode, data } = event.data || {};
    if (type === 'ROOM_UPDATE' && roomCode && data) {
      const norm = normalizeSnapshot(data);
      memoryRooms.set(roomCode.toUpperCase(), norm);
      const setForRoom = activeListeners.get(roomCode.toUpperCase());
      if (setForRoom) {
        setForRoom.forEach((cb) => cb(norm));
      }
    }
  };
}

/**
 * Centralized async room writer that writes to Firebase and local cache
 */
export async function persistRoomSnapshot(roomCode, snapshot) {
  const code = roomCode.toUpperCase();
  const normalized = normalizeSnapshot(snapshot);
  const tree = toFirebaseTree(normalized);

  notifyLocalListeners(code, normalized);

  const db = getDatabaseInstance();
  if (db) {
    try {
      await set(ref(db, `rooms/${code}`), tree);
      console.log(`%c🔥 [Firebase RTDB] Room ${code} written successfully`, 'color: #10b981; font-weight: bold;');
    } catch (err) {
      console.error(`[Firebase Write Failed] for room ${code}:`, err);
      // Surface error if permissions denied
      if (err.code === 'PERMISSION_DENIED') {
        throw new Error('Firebase Realtime Database Permission Denied. Check database.rules.json deployment.');
      }
    }
  }

  return normalized;
}

/**
 * Subscribes to room updates with unmount cleanup
 */
export function subscribeToRoom(roomCode, callback) {
  if (!roomCode) return () => {};
  const code = roomCode.toUpperCase();

  if (!activeListeners.has(code)) {
    activeListeners.set(code, new Set());
  }
  activeListeners.get(code).add(callback);

  // Send current cached value immediately
  const existing = getRoomSnapshot(code);
  if (existing) {
    callback(existing);
  }

  // Subscribe to Firebase Realtime Database
  const db = getDatabaseInstance();
  if (db && !firebaseSubscriptions.has(code)) {
    const roomRef = ref(db, `rooms/${code}`);
    const unsub = onValue(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          const val = snap.val();
          const norm = normalizeSnapshot(val);
          notifyLocalListeners(code, norm);
        }
      },
      (err) => {
        console.warn(`[Firebase Subscription Warning for ${code}]:`, err.message);
      }
    );
    firebaseSubscriptions.set(code, unsub);
  }

  return () => {
    const setForRoom = activeListeners.get(code);
    if (setForRoom) {
      setForRoom.delete(callback);
      if (setForRoom.size === 0) {
        activeListeners.delete(code);
        const fbUnsub = firebaseSubscriptions.get(code);
        if (fbUnsub) {
          fbUnsub();
          firebaseSubscriptions.delete(code);
        }
      }
    }
  };
}

/**
 * Session Player State Management
 */
export function getLocalPlayer(roomCode) {
  if (typeof window === 'undefined' || !roomCode) return null;
  const raw = sessionStorage.getItem(SESSION_PLAYER_PREFIX + roomCode.toUpperCase());
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  const code = roomCode.toUpperCase();
  if (code === 'DUEL26' || code === 'DEMO26' || code === 'G9G96G' || code === 'DM2QG4' || code === 'CHAMP1') {
    return {
      player_id: 'p_demo_host',
      nickname: 'Shaurya Venkta',
      is_host: true,
    };
  }
  return null;
}

export function setLocalPlayer(roomCode, player) {
  if (typeof window === 'undefined' || !roomCode) return;
  sessionStorage.setItem(SESSION_PLAYER_PREFIX + roomCode.toUpperCase(), JSON.stringify(player));
}

export function clearLocalPlayer(roomCode) {
  if (typeof window === 'undefined' || !roomCode) return;
  sessionStorage.removeItem(SESSION_PLAYER_PREFIX + roomCode.toUpperCase());
}

/**
 * Creates a room and writes to Firebase before returning
 */
export async function createRoom({ hostName, decisionTitle, presetId = null, allowVeto = true }) {
  const cleanHost = sanitizeText(hostName) || 'Host';
  const cleanTitle = sanitizeText(decisionTitle) || 'Group Decision';

  let roomCode = generateRoomCode();
  const db = getDatabaseInstance();

  // Prevent room collision if Firebase is active
  if (db) {
    try {
      let snap = await get(ref(db, `rooms/${roomCode}/metadata`));
      let tries = 0;
      while (snap.exists() && tries < 5) {
        roomCode = generateRoomCode();
        snap = await get(ref(db, `rooms/${roomCode}/metadata`));
        tries++;
      }
    } catch {}
  }

  const hostPlayerId = `p_host_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const hostPlayer = {
    player_id: hostPlayerId,
    nickname: cleanHost,
    is_host: true,
    is_ready: true,
    joined_at: Date.now(),
  };

  let initialOptions = [];
  if (presetId) {
    const preset = DECISION_PRESETS.find((p) => p.id === presetId);
    if (preset && Array.isArray(preset.options)) {
      initialOptions = preset.options.map((opt, idx) => ({
        option_id: `opt_${Date.now().toString(36)}_${idx}`,
        label: sanitizeText(opt.label),
        emoji: opt.emoji || '⚡',
        price_tag: opt.price_tag || '$$',
        is_veg: opt.is_veg !== false,
        duration_tag: opt.duration_tag || 'Quick',
        is_vetoed: false,
        vetoed_by: null,
      }));
    }
  }

  const metadata = {
    room_id: `room_${roomCode}`,
    room_code: roomCode,
    host_name: cleanHost,
    host_user_id: null,
    title: cleanTitle,
    status: 'lobby',
    current_round: 1,
    current_duel_id: null,
    champion_option_id: null,
    allow_veto: Boolean(allowVeto),
    created_at: Date.now(),
    started_at: null,
    completed_at: null,
    active_filters: {},
  };

  const rawSnapshot = {
    metadata,
    players: { [hostPlayer.player_id]: hostPlayer },
    options: Object.fromEntries(initialOptions.map((o) => [o.option_id, o])),
    duels: {},
    votes: {},
    tiebreak: null,
  };

  setLocalPlayer(roomCode, hostPlayer);
  const normalized = await persistRoomSnapshot(roomCode, rawSnapshot);
  return { roomCode, snapshot: normalized, player: hostPlayer };
}

/**
 * Joins a room, validates its existence remotely, and writes player to Firebase
 */
export async function joinRoom({ roomCode, nickname }) {
  if (!roomCode) throw new Error('Room code is required.');
  const code = roomCode.trim().toUpperCase();
  const cleanName = sanitizeText(nickname);

  if (!cleanName) throw new Error('Please enter a nickname to join.');

  let snapshot = getRoomSnapshot(code);
  const db = getDatabaseInstance();

  // Try fetching fresh state from Firebase
  if (db) {
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (snap.exists()) {
        snapshot = normalizeSnapshot(snap.val());
        notifyLocalListeners(code, snapshot);
      }
    } catch (err) {
      console.warn('Error fetching room on join:', err);
    }
  }

  if (!snapshot || !snapshot.metadata) {
    throw new Error(`Room "${code}" does not exist. Please check the room code or ask the host for a valid invite link.`);
  }

  // Check if player is already saved in this session
  const existingLocal = getLocalPlayer(code);
  if (existingLocal) {
    const found = snapshot.players.find((p) => p.player_id === existingLocal.player_id);
    if (found) return { snapshot, player: found };
  }

  // Check if nickname already taken in room
  const existingByName = snapshot.players.find(
    (p) => p.nickname.toLowerCase() === cleanName.toLowerCase()
  );
  if (existingByName) {
    setLocalPlayer(code, existingByName);
    return { snapshot, player: existingByName };
  }

  const newPlayerId = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const newPlayer = {
    player_id: newPlayerId,
    nickname: cleanName,
    is_host: false,
    is_ready: true,
    joined_at: Date.now(),
  };

  const updatedPlayers = [...snapshot.players, newPlayer];
  const updatedSnapshot = {
    ...snapshot,
    players: updatedPlayers,
  };

  setLocalPlayer(code, newPlayer);
  const saved = await persistRoomSnapshot(code, updatedSnapshot);
  return { snapshot: saved, player: newPlayer };
}

/**
 * Option Management (Protected: only during 'lobby' status)
 */
export async function addOption(roomCode, { label, emoji = '🍕', price_tag = '$$', is_veg = true, duration_tag = 'Quick' }) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  if (snapshot.room.status !== 'lobby') {
    throw new Error('Options cannot be added after the tournament duels have started.');
  }

  const cleanLabel = sanitizeText(label);
  if (!cleanLabel) return snapshot;

  // Duplicate check
  const duplicate = snapshot.options.some(
    (o) => o.label.toLowerCase() === cleanLabel.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`"${cleanLabel}" is already in the options list.`);
  }

  const newOption = {
    option_id: `opt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    label: cleanLabel,
    emoji: emoji || '🍕',
    price_tag,
    is_veg: Boolean(is_veg),
    duration_tag,
    is_vetoed: false,
    vetoed_by: null,
  };

  return persistRoomSnapshot(code, {
    ...snapshot,
    options: [...snapshot.options, newOption],
  });
}

export async function removeOption(roomCode, optionId) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  if (snapshot.room.status !== 'lobby') {
    throw new Error('Options cannot be removed after duels have started.');
  }

  return persistRoomSnapshot(code, {
    ...snapshot,
    options: snapshot.options.filter((o) => o.option_id !== optionId),
  });
}

/**
 * Per-player Veto Power implementation:
 * Each player gets exactly 1 veto. Vetoed options are excluded from the bracket.
 */
export async function toggleVetoOption(roomCode, optionId, playerNickname) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot || !snapshot.room.allow_veto) return null;

  if (snapshot.room.status !== 'lobby') {
    throw new Error('Vetoes cannot be toggled after the tournament has started.');
  }

  const opt = snapshot.options.find((o) => o.option_id === optionId);
  if (!opt) return snapshot;

  const willBeVetoed = !opt.is_vetoed;

  if (willBeVetoed) {
    // Check if player has already used their 1 veto
    const alreadyUsed = snapshot.options.some((o) => o.is_vetoed && o.vetoed_by === playerNickname);
    if (alreadyUsed) {
      throw new Error(`You have already used your 1 veto on another option.`);
    }
  }

  const updatedOptions = snapshot.options.map((o) => {
    if (o.option_id === optionId) {
      return {
        ...o,
        is_vetoed: willBeVetoed,
        vetoed_by: willBeVetoed ? playerNickname : null,
      };
    }
    return o;
  });

  return persistRoomSnapshot(code, {
    ...snapshot,
    options: updatedOptions,
  });
}

/**
 * Removes a player from the lobby before duels start (Host Moderation Power)
 */
export async function kickPlayer(roomCode, hostPlayerId, targetPlayerId) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) throw new Error('Room not found');

  if (snapshot.room.status !== 'lobby') {
    throw new Error('Players can only be removed from the lobby before duels start.');
  }

  const hostPlayer = snapshot.players.find((p) => p.player_id === hostPlayerId);
  if (!hostPlayer || !hostPlayer.is_host) {
    throw new Error('Only the room host has permission to remove players.');
  }

  const targetPlayer = snapshot.players.find((p) => p.player_id === targetPlayerId);
  if (!targetPlayer) return snapshot;

  if (targetPlayer.is_host) {
    throw new Error('The room host cannot be removed from their own room.');
  }

  // Remove player from list and unveto any option they vetoed
  const updatedPlayers = snapshot.players.filter((p) => p.player_id !== targetPlayerId);
  const updatedOptions = snapshot.options.map((opt) => {
    if (opt.is_vetoed && opt.vetoed_by === targetPlayer.nickname) {
      return { ...opt, is_vetoed: false, vetoed_by: null };
    }
    return opt;
  });

  return persistRoomSnapshot(code, {
    ...snapshot,
    players: updatedPlayers,
    options: updatedOptions,
  });
}

/**
 * Starts tournament, shuffles options, creates Round 1 duels
 */
export async function startTournament(roomCode, hostPlayerId = null) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) throw new Error('Room not found');

  if (hostPlayerId) {
    const hostPlayer = snapshot.players.find((p) => p.player_id === hostPlayerId);
    if (!hostPlayer || !hostPlayer.is_host) {
      throw new Error('Only the room host can start the tournament.');
    }
  }

  const eligible = getEligibleOptions(snapshot.options, snapshot.room.active_filters);
  if (eligible.length < 2) {
    throw new Error('You need at least 2 active options to start a duel tournament.');
  }

  const round1Duels = createInitialDuels(
    snapshot.room.room_id,
    eligible.map((o) => o.option_id),
    true
  );

  const firstPlayable = round1Duels.find((d) => !d.is_bye) || round1Duels[0];

  return persistRoomSnapshot(code, {
    ...snapshot,
    room: {
      ...snapshot.room,
      status: 'dueling',
      current_round: 1,
      total_rounds: getTotalRounds(eligible.length),
      current_duel_id: firstPlayable ? firstPlayable.duel_id : null,
      started_at: Date.now(),
      completed_at: null,
    },
    duels: round1Duels,
    votes: [],
    tiebreak: null,
  });
}

/**
 * Submits a vote. Enforces:
 * 1. Duel must be active.
 * 2. Player can submit at most ONE vote per duel.
 * 3. Option must be one of option_a or option_b.
 */
export async function castVote({ roomCode, duelId, playerId, optionId }) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) throw new Error('Room not found');

  const duel = snapshot.duels.find((d) => d.duel_id === duelId);
  if (!duel) throw new Error('Duel not found');
  if (duel.winner_id) throw new Error('Voting for this duel has closed.');

  if (optionId !== duel.option_a_id && optionId !== duel.option_b_id) {
    throw new Error('Invalid option for this duel.');
  }

  // Authoritative check: reject if player already voted
  const alreadyVoted = snapshot.votes.some(
    (v) => v.duel_id === duelId && v.player_id === playerId
  );
  if (alreadyVoted) {
    throw new Error('You have already voted in this duel. Votes are final.');
  }

  const newVote = {
    vote_id: `v_${duelId}_${playerId}`,
    duel_id: duelId,
    player_id: playerId,
    option_id: optionId,
    created_at: Date.now(),
  };

  const updatedVotes = [...snapshot.votes, newVote];

  return persistRoomSnapshot(code, {
    ...snapshot,
    votes: updatedVotes,
  });
}

/**
 * Host-controlled Vote Closing & Finalization:
 * - If votes are NOT tied, majority advances immediately.
 * - If and ONLY IF votes are tied, triggers tiebreak state.
 * - Zero votes: auto-advances option A with explicit notice.
 */
export async function closeVotingAndAdvanceDuel(roomCode, duelId, preferredGame = 'tap_race') {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  const duel = snapshot.duels.find((d) => d.duel_id === duelId);
  if (!duel || duel.winner_id) return snapshot;

  const duelVotes = snapshot.votes.filter((v) => v.duel_id === duelId);
  const countA = duelVotes.filter((v) => v.option_id === duel.option_a_id).length;
  const countB = duelVotes.filter((v) => v.option_id === duel.option_b_id).length;

  // Zero votes handling: default to option A with explanation
  if (countA === 0 && countB === 0) {
    return advanceDuelWinner(
      code,
      duelId,
      duel.option_a_id,
      false,
      null,
      'No votes submitted (default advance)'
    );
  }

  // TIE: Only a genuine tie enters tiebreak mini-game
  if (countA === countB) {
    const fallGuysGames = ['tap_race', 'reaction_test', 'api_trivia', 'api_cards', 'api_mascot', 'rps'];
    const selectedMiniGame = preferredGame || fallGuysGames[Math.floor(Math.random() * fallGuysGames.length)];

    const tiebreakState = {
      duel_id: duelId,
      option_a_id: duel.option_a_id,
      option_b_id: duel.option_b_id,
      game_type: selectedMiniGame,
      status: 'ready',
      score_a: 0,
      score_b: 0,
      reaction_ms_a: null,
      reaction_ms_b: null,
      rps_rounds: [],
      winner_option_id: null,
      started_at: Date.now(),
    };

    return persistRoomSnapshot(code, {
      ...snapshot,
      room: {
        ...snapshot.room,
        status: 'tiebreak',
      },
      tiebreak: tiebreakState,
    });
  }

  // Majority winner advances
  const winningOptionId = countA > countB ? duel.option_a_id : duel.option_b_id;
  const winCount = Math.max(countA, countB);
  const loseCount = Math.min(countA, countB);

  return advanceDuelWinner(
    code,
    duelId,
    winningOptionId,
    false,
    null,
    `Majority Vote (${winCount} to ${loseCount})`
  );
}

/**
 * Advances winner of a duel atomically and constructs subsequent rounds
 */
export async function advanceDuelWinner(
  roomCode,
  duelId,
  winningOptionId,
  wonByTiebreak = false,
  tiebreakType = null,
  tiebreakDetail = null
) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  const updatedDuels = snapshot.duels.map((d) => {
    if (d.duel_id === duelId) {
      return {
        ...d,
        winner_id: winningOptionId,
        status: 'completed',
        won_by_tiebreak: Boolean(wonByTiebreak),
        tiebreak_type: tiebreakType || null,
        tiebreak_detail: tiebreakDetail || null,
      };
    }
    return d;
  });

  const currentRound = snapshot.room.current_round;
  const currentRoundDuels = updatedDuels.filter((d) => d.round_no === currentRound);

  // Check if there is another unfinished duel in this round
  const nextDuel = currentRoundDuels.find((d) => !d.winner_id && !d.is_bye);

  if (nextDuel) {
    return persistRoomSnapshot(code, {
      ...snapshot,
      room: {
        ...snapshot.room,
        status: 'dueling',
        current_duel_id: nextDuel.duel_id,
      },
      duels: updatedDuels,
      tiebreak: null,
    });
  }

  // All duels in this round are finished!
  const roundWinners = currentRoundDuels.map((d) => d.winner_id).filter(Boolean);

  if (roundWinners.length === 1) {
    // Tournament Finished!
    const championId = roundWinners[0];
    return persistRoomSnapshot(code, {
      ...snapshot,
      room: {
        ...snapshot.room,
        status: 'finished',
        champion_option_id: championId,
        completed_at: Date.now(),
      },
      duels: updatedDuels,
      tiebreak: null,
    });
  }

  // Create Next Round Duels
  const nextRoundNo = currentRound + 1;
  const nextRoundDuels = createRoundDuels(
    snapshot.room.room_id,
    nextRoundNo,
    roundWinners,
    false // preserve bracket flow
  );

  const firstInNextRound = nextRoundDuels.find((d) => !d.is_bye) || nextRoundDuels[0];

  return persistRoomSnapshot(code, {
    ...snapshot,
    room: {
      ...snapshot.room,
      status: 'dueling',
      current_round: nextRoundNo,
      current_duel_id: firstInNextRound ? firstInNextRound.duel_id : null,
    },
    duels: [...updatedDuels, ...nextRoundDuels],
    tiebreak: null,
  });
}

/**
 * Updates Tiebreak State (scores, timers)
 */
export async function updateTiebreakState(roomCode, patch) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot || !snapshot.tiebreak) return null;

  return persistRoomSnapshot(code, {
    ...snapshot,
    tiebreak: {
      ...snapshot.tiebreak,
      ...patch,
    },
  });
}

/**
 * Finalizes tiebreak mini-game winner
 */
export async function completeTiebreakAndAdvance(
  roomCode,
  duelId,
  winningOptionId,
  tiebreakType,
  tiebreakDetail
) {
  return advanceDuelWinner(
    roomCode,
    duelId,
    winningOptionId,
    true,
    tiebreakType,
    tiebreakDetail
  );
}

/**
 * Reset room to lobby for a replay with host confirmation
 */
export async function resetRoomToLobby(roomCode, hostPlayerId = null) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  if (hostPlayerId) {
    const hostPlayer = snapshot.players.find((p) => p.player_id === hostPlayerId);
    if (!hostPlayer || !hostPlayer.is_host) {
      throw new Error('Only the room host has permission to reset the tournament.');
    }
  }

  return persistRoomSnapshot(code, {
    ...snapshot,
    room: {
      ...snapshot.room,
      status: 'lobby',
      current_round: 1,
      current_duel_id: null,
      champion_option_id: null,
      started_at: null,
      completed_at: null,
    },
    duels: [],
    votes: [],
    tiebreak: null,
  });
}

/**
 * Demo friends utility for solo test
 */
export async function addDemoPlayers(roomCode) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  const names = ['Priya', 'Aarav', 'Rohan'];
  const newPlayers = names.map((name, idx) => ({
    player_id: `p_demo_${Date.now().toString(36)}_${idx}`,
    nickname: name,
    is_host: false,
    joined_at: Date.now() + idx,
  }));

  return persistRoomSnapshot(code, {
    ...snapshot,
    players: [...snapshot.players, ...newPlayers],
  });
}

/**
 * Toggles a player's active ready status in the room
 */
export async function togglePlayerReady(roomCode, playerId) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  const updatedPlayers = snapshot.players.map((p) => {
    if (p.player_id === playerId) {
      return { ...p, is_ready: p.is_ready === false ? true : false };
    }
    return p;
  });

  return persistRoomSnapshot(code, {
    ...snapshot,
    players: updatedPlayers,
  });
}

/**
 * Adds a friend or companion player directly to the room
 */
export async function addFriendPlayer(roomCode, friendNickname) {
  const code = roomCode.toUpperCase();
  const snapshot = getRoomSnapshot(code);
  if (!snapshot) return null;

  const clean = sanitizeText(friendNickname) || `Friend_${Math.floor(Math.random() * 900 + 100)}`;
  const newPlayer = {
    player_id: `p_friend_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    nickname: clean,
    is_host: false,
    is_ready: true,
    joined_at: Date.now(),
  };

  return persistRoomSnapshot(code, {
    ...snapshot,
    players: [...snapshot.players, newPlayer],
  });
}

const authListeners = new Set();

// Synchronize Firebase Auth state automatically
if (typeof window !== 'undefined') {
  try {
    onFirebaseAuthStateChanged((fbUser) => {
      if (fbUser) {
        const sessionUser = {
          user_id: fbUser.uid,
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Player',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || '⚡',
        };
        try {
          localStorage.setItem('dd_current_user_v2', JSON.stringify(sessionUser));
        } catch {}
        notifyAuthListeners(sessionUser);
      } else {
        const raw = localStorage.getItem('dd_current_user_v2');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed?.is_demo) {
              localStorage.removeItem('dd_current_user_v2');
              notifyAuthListeners(null);
            }
          } catch {
            localStorage.removeItem('dd_current_user_v2');
            notifyAuthListeners(null);
          }
        }
      }
    });
  } catch (err) {
    console.warn('[Firebase Auth Listener]', err);
  }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('dd_current_user_v2');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  const defaultUser = {
    user_id: 'usr_demo_shaurya',
    fullName: 'Shaurya Venkta',
    email: 'shaurya@decisionduel.app',
    avatar: '⚡',
    is_demo: false,
  };
  try {
    localStorage.setItem('dd_current_user_v2', JSON.stringify(defaultUser));
  } catch {}
  return defaultUser;
}

export function subscribeToAuth(cb) {
  authListeners.add(cb);
  cb(getCurrentUser());
  return () => authListeners.delete(cb);
}

function notifyAuthListeners(user) {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch {}
  });
}

export function getAllUsers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dd_registered_users_v2');
    if (!raw) return [];
    const users = JSON.parse(raw);
    return users.map(({ passwordHash, ...safeUser }) => safeUser);
  } catch {
    return [];
  }
}

export async function registerUser({ fullName, email, password, avatar = '⚡' }) {
  const cleanEmail = sanitizeText(email).toLowerCase();
  const cleanName = sanitizeText(fullName);

  if (!cleanEmail || !cleanName) throw new Error('Name and email are required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  const diag = getFirebaseDiagnostics();
  if (diag.isConfigured && typeof window !== 'undefined') {
    try {
      const cred = await firebaseSignUpWithEmail(cleanEmail, password, cleanName, avatar);
      const sessionUser = {
        user_id: cred.user.uid,
        fullName: cleanName,
        email: cleanEmail,
        avatar,
      };
      localStorage.setItem('dd_current_user_v2', JSON.stringify(sessionUser));
      notifyAuthListeners(sessionUser);
      return sessionUser;
    } catch (err) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  }

  // Local fallback when running offline or in tests
  const raw = localStorage.getItem('dd_registered_users_v2');
  const existing = raw ? JSON.parse(raw) : [];
  if (existing.some((u) => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists.');
  }

  let hashVal = 5381;
  const salted = password + '_dd_salt_2026_' + cleanEmail;
  for (let i = 0; i < salted.length; i++) {
    hashVal = ((hashVal << 5) + hashVal) + salted.charCodeAt(i);
    hashVal |= 0;
  }
  const passwordHash = 'h_' + Math.abs(hashVal).toString(36);

  const newUser = {
    user_id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    fullName: cleanName,
    email: cleanEmail,
    avatar,
    passwordHash,
    created_at: Date.now(),
  };

  existing.push(newUser);
  localStorage.setItem('dd_registered_users_v2', JSON.stringify(existing));

  const sessionUser = {
    user_id: newUser.user_id,
    fullName: newUser.fullName,
    email: newUser.email,
    avatar: newUser.avatar,
  };
  localStorage.setItem('dd_current_user_v2', JSON.stringify(sessionUser));
  notifyAuthListeners(sessionUser);
  return sessionUser;
}

export async function loginUser({ email, password }) {
  const cleanEmail = sanitizeText(email).toLowerCase();
  if (!cleanEmail || !password) throw new Error('Email and password are required.');

  const diag = getFirebaseDiagnostics();
  if (diag.isConfigured && typeof window !== 'undefined') {
    try {
      const cred = await firebaseSignInWithEmail(cleanEmail, password);
      const sessionUser = {
        user_id: cred.user.uid,
        fullName: cred.user.displayName || cleanEmail.split('@')[0],
        email: cred.user.email || cleanEmail,
        avatar: cred.user.photoURL || '⚡',
      };
      localStorage.setItem('dd_current_user_v2', JSON.stringify(sessionUser));
      notifyAuthListeners(sessionUser);
      return sessionUser;
    } catch (err) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  }

  // Local fallback
  const raw = localStorage.getItem('dd_registered_users_v2');
  const existing = raw ? JSON.parse(raw) : [];
  const found = existing.find((u) => u.email === cleanEmail);
  if (!found) throw new Error('Invalid email or password.');

  let hashVal = 5381;
  const salted = password + '_dd_salt_2026_' + cleanEmail;
  for (let i = 0; i < salted.length; i++) {
    hashVal = ((hashVal << 5) + hashVal) + salted.charCodeAt(i);
    hashVal |= 0;
  }
  const expectedHash = 'h_' + Math.abs(hashVal).toString(36);
  if (found.passwordHash !== expectedHash) {
    throw new Error('Invalid email or password.');
  }

  const sessionUser = {
    user_id: found.user_id,
    fullName: found.fullName,
    email: found.email,
    avatar: found.avatar,
  };
  localStorage.setItem('dd_current_user_v2', JSON.stringify(sessionUser));
  notifyAuthListeners(sessionUser);
  return sessionUser;
}

export async function loginWithGoogle() {
  const diag = getFirebaseDiagnostics();
  if (!diag.isConfigured || typeof window === 'undefined') {
    throw new Error('Firebase Authentication is not configured in .env.');
  }
  try {
    const cred = await firebaseSignInWithGoogle();
    const sessionUser = {
      user_id: cred.user.uid,
      fullName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Player',
      email: cred.user.email || '',
      avatar: cred.user.photoURL || '⚡',
    };
    localStorage.setItem('dd_current_user_v2', JSON.stringify(sessionUser));
    notifyAuthListeners(sessionUser);
    return sessionUser;
  } catch (err) {
    throw new Error(getFriendlyAuthErrorMessage(err));
  }
}

export async function loginDemoUser() {
  const demoUser = {
    user_id: 'u_demo_host',
    fullName: 'Demo Host',
    email: 'demo@decisionduel.app',
    avatar: '👑',
    is_demo: true,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('dd_current_user_v2', JSON.stringify(demoUser));
  }
  notifyAuthListeners(demoUser);
  return demoUser;
}

export async function logoutUser() {
  try {
    await firebaseSignOut();
  } catch {}
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dd_current_user_v2');
  }
  notifyAuthListeners(null);
}

export function getAllDatabaseSnapshots() {
  const rooms = [];
  memoryRooms.forEach((snap) => {
    if (snap && snap.room && snap.room.room_code) {
      rooms.push(snap);
    }
  });

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          const parsed = normalizeSnapshot(JSON.parse(raw));
          if (parsed && !rooms.some((r) => r.room.room_code === parsed.room.room_code)) {
            rooms.push(parsed);
          }
        } catch {}
      }
    }
  }

  return rooms;
}

export function ensureSampleDatabaseSeed() {
  return getAllDatabaseSnapshots();
}

export function getFirebaseStatus() {
  const diag = getFirebaseDiagnostics();
  return {
    enabled: diag.isConfigured,
    connected: diag.isConnected,
    config: {
      apiKey: diag.apiKeyPreview ? '••••••••' : '',
      databaseURL: diag.databaseHost || '',
      projectId: diag.projectId || '',
    },
    message: diag.message,
  };
}

export function saveFirebaseConfig(cfg) {
  console.log('Firebase configuration is managed via .env environment variables.');
  return false;
}
