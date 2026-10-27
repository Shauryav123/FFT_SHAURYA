import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory mock localStorage for Node test runner
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

import {
  getCurrentUser,
  saveUserSession,
  SESSION_DURATION_MS,
  leaveRoom,
  createRoom,
  joinRoom,
  startTournament,
  getRoomSnapshot,
} from '../src/services/realtimeStore.js';

test('1. New visitor has no default auto-login session (returns null)', () => {
  globalThis.localStorage.clear();
  const user = getCurrentUser();
  assert.equal(user, null, 'Unauthenticated visitor should not be auto-logged in');
});

test('2. User session persists for 5 days with correct expiresAt timestamp', () => {
  globalThis.localStorage.clear();
  const fakeUser = {
    user_id: 'test_u_123',
    fullName: 'Alex River',
    email: 'alex@example.com',
  };

  const beforeTime = Date.now();
  const saved = saveUserSession(fakeUser);
  const afterTime = Date.now();

  assert.ok(saved.expiresAt >= beforeTime + SESSION_DURATION_MS);
  assert.ok(saved.expiresAt <= afterTime + SESSION_DURATION_MS);
  assert.equal(saved.fullName, 'Alex River');

  // Verify getCurrentUser retrieves the active session
  const current = getCurrentUser();
  assert.ok(current);
  assert.equal(current.email, 'alex@example.com');
});

test('3. Expired session (> 5 days) is automatically discarded and returns null', () => {
  globalThis.localStorage.clear();
  const expiredUser = {
    user_id: 'test_u_expired',
    fullName: 'Old Session',
    email: 'old@example.com',
    expiresAt: Date.now() - 1000, // Expired 1 second ago
  };

  globalThis.localStorage.setItem('dd_current_user_v2', JSON.stringify(expiredUser));
  const current = getCurrentUser();
  assert.equal(current, null, 'Expired session must return null');
  assert.equal(globalThis.localStorage.getItem('dd_current_user_v2'), null, 'Expired session must be cleaned up');
});

test('4. leaveRoom removes player from lobby and promotes new host if host leaves', async () => {
  const { roomCode, player: hostPlayer } = await createRoom({
    title: 'Dinner Choice',
    hostName: 'Host Player',
    presetId: 'friends_eat',
  });

  const p2 = await joinRoom({ roomCode, nickname: 'Friend Two' });
  let snap = getRoomSnapshot(roomCode);
  assert.equal(snap.players.length, 2);
  assert.equal(snap.room.host_name, 'Host Player');

  // Host leaves the room
  await leaveRoom(roomCode, hostPlayer.player_id);
  snap = getRoomSnapshot(roomCode);

  assert.equal(snap.players.length, 1);
  assert.equal(snap.players[0].nickname, 'Friend Two');
  assert.equal(snap.players[0].is_host, true, 'Friend Two must be promoted to host');
  assert.equal(snap.room.host_name, 'Friend Two');
});

test('5. Midgame leave adjusts match progression when 1 player remains', async () => {
  const { roomCode, player: hostPlayer } = await createRoom({
    title: 'Movie Night',
    hostName: 'Player One',
    presetId: 'friends_eat',
  });

  const { player: p2Player } = await joinRoom({ roomCode, nickname: 'Player Two' });
  await startTournament(roomCode, hostPlayer.player_id);

  let snap = getRoomSnapshot(roomCode);
  assert.equal(snap.room.status, 'dueling');
  assert.ok(snap.duels.length > 0);

  // Player Two leaves midgame
  await leaveRoom(roomCode, p2Player.player_id);
  snap = getRoomSnapshot(roomCode);

  assert.equal(snap.players.length, 1);
  // Match should auto-advance for the sole remaining player
  assert.ok(snap.duels[0].winner_id, 'Active duel must be resolved');
});
