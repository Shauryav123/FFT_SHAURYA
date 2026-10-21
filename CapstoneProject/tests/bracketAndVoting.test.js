import test from 'node:test';
import assert from 'node:assert/strict';

import {
  shuffleArray,
  getNextPowerOfTwo,
  getBracketStats,
  getTotalRounds,
  createInitialDuels,
  createRoundDuels,
  simulateTournament,
  getRoundLabel,
  getEligibleOptions,
} from '../src/services/bracketEngine.js';

import {
  createRoom,
  addOption,
  startTournament,
  castVote,
  closeVotingAndAdvanceDuel,
  getRoomSnapshot,
} from '../src/services/realtimeStore.js';

function makeOptions(count) {
  return Array.from({ length: count }, (_, i) => `opt_${i + 1}`);
}

function createSeededRandom(seed = 42) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test('1. Bracket generation with 0 options throws or returns empty tournament safely', () => {
  const stats = getBracketStats(0);
  assert.equal(stats.totalDuels, 0);
  assert.equal(stats.totalRounds, 0);

  const initialDuels = createInitialDuels('r0', []);
  assert.deepEqual(initialDuels, []);

  const sim = simulateTournament('r0', []);
  assert.equal(sim.champion, null);
  assert.equal(sim.playedDuels.length, 0);
  assert.equal(sim.allDuels.length, 0);
});

test('2. Bracket generation with 1 option marks it as champion without duels', () => {
  const stats = getBracketStats(1);
  assert.equal(stats.totalDuels, 0);
  assert.equal(stats.totalRounds, 1);

  const sim = simulateTournament('r1', ['OnlyChoice']);
  assert.equal(sim.champion, 'OnlyChoice');
  assert.equal(sim.playedDuels.length, 0);
});

test('3. Bracket generation with 2 options produces exactly 1 duel', () => {
  const stats = getBracketStats(2);
  assert.equal(stats.powerOfTwo, 2);
  assert.equal(stats.byes, 0);
  assert.equal(stats.totalDuels, 1);
  assert.equal(stats.totalRounds, 1);

  const sim = simulateTournament('r2', makeOptions(2));
  assert.equal(sim.playedDuels.length, 1);
  assert.equal(sim.byes, 0);
  assert.ok(sim.champion);
});

test('4. Bracket generation with 3 options produces 1 bye and 2 duels total', () => {
  const stats = getBracketStats(3);
  assert.equal(stats.powerOfTwo, 4);
  assert.equal(stats.byes, 1);
  assert.equal(stats.prelimDuels, 1);
  assert.equal(stats.totalDuels, 2);
  assert.equal(stats.totalRounds, 2);

  const duelsR1 = createInitialDuels('r3', makeOptions(3));
  const byesR1 = duelsR1.filter((d) => d.is_bye);
  const prelimR1 = duelsR1.filter((d) => !d.is_bye);
  assert.equal(byesR1.length, 1);
  assert.equal(prelimR1.length, 1);

  const sim = simulateTournament('r3', makeOptions(3));
  assert.equal(sim.playedDuels.length, 2);
  assert.equal(sim.byes, 1);
  assert.ok(sim.champion);
});

test('5. Bracket generation with 4 options produces 3 duels across 2 rounds', () => {
  const stats = getBracketStats(4);
  assert.equal(stats.powerOfTwo, 4);
  assert.equal(stats.byes, 0);
  assert.equal(stats.prelimDuels, 2);
  assert.equal(stats.totalDuels, 3);
  assert.equal(stats.totalRounds, 2);

  const sim = simulateTournament('r4', makeOptions(4));
  assert.equal(sim.playedDuels.length, 3);
  assert.equal(sim.totalRounds, 2);
  assert.equal(sim.byes, 0);
});

test('6. Bracket generation with 5 options produces 3 byes, 1 preliminary duel, and 4 duels total', () => {
  const stats = getBracketStats(5);
  assert.equal(stats.powerOfTwo, 8);
  assert.equal(stats.byes, 3);
  assert.equal(stats.prelimDuels, 1);
  assert.equal(stats.totalDuels, 4);
  assert.equal(stats.totalRounds, 3);

  const duelsR1 = createInitialDuels('r5', makeOptions(5));
  const prelimDuels = duelsR1.filter((d) => !d.is_bye);
  const byes = duelsR1.filter((d) => d.is_bye);
  assert.equal(prelimDuels.length, 1);
  assert.equal(byes.length, 3);

  const sim = simulateTournament('r5', makeOptions(5));
  assert.equal(sim.playedDuels.length, 4);
  assert.equal(sim.byes, 3);
});

test('7. Bracket generation with 7 options produces 1 bye and 6 duels total', () => {
  const stats = getBracketStats(7);
  assert.equal(stats.powerOfTwo, 8);
  assert.equal(stats.byes, 1);
  assert.equal(stats.prelimDuels, 3);
  assert.equal(stats.totalDuels, 6);
  assert.equal(stats.totalRounds, 3);

  const duelsR1 = createInitialDuels('r7', makeOptions(7));
  const byes = duelsR1.filter((d) => d.is_bye);
  assert.equal(byes.length, 1);

  const sim = simulateTournament('r7', makeOptions(7));
  assert.equal(sim.playedDuels.length, 6);
  assert.equal(sim.byes, 1);
});

test('8. Bracket generation with 8 options produces 7 duels across 3 rounds', () => {
  const stats = getBracketStats(8);
  assert.equal(stats.powerOfTwo, 8);
  assert.equal(stats.byes, 0);
  assert.equal(stats.totalDuels, 7);
  assert.equal(stats.totalRounds, 3);

  const sim = simulateTournament('r8', makeOptions(8));
  assert.equal(sim.playedDuels.length, 7);
  assert.equal(sim.totalRounds, 3);
  assert.equal(sim.byes, 0);
});

test('9. Bracket generation with 9 options produces 7 byes and 8 duels total', () => {
  const stats = getBracketStats(9);
  assert.equal(stats.powerOfTwo, 16);
  assert.equal(stats.byes, 7);
  assert.equal(stats.prelimDuels, 1);
  assert.equal(stats.totalDuels, 8);
  assert.equal(stats.totalRounds, 4);

  const duelsR1 = createInitialDuels('r9', makeOptions(9));
  const byes = duelsR1.filter((d) => d.is_bye);
  const prelim = duelsR1.filter((d) => !d.is_bye);
  assert.equal(byes.length, 7);
  assert.equal(prelim.length, 1);

  const sim = simulateTournament('r9', makeOptions(9));
  assert.equal(sim.playedDuels.length, 8);
  assert.equal(sim.byes, 7);
});

test('10. Bracket generation with 16 options produces 15 duels across 4 rounds', () => {
  const stats = getBracketStats(16);
  assert.equal(stats.powerOfTwo, 16);
  assert.equal(stats.byes, 0);
  assert.equal(stats.totalDuels, 15);
  assert.equal(stats.totalRounds, 4);

  const sim = simulateTournament('r16', makeOptions(16));
  assert.equal(sim.playedDuels.length, 15);
  assert.equal(sim.totalRounds, 4);
  assert.equal(sim.byes, 0);
});

test('11. Every completed single-elimination tournament of size n produces exactly n - 1 played duels', () => {
  const testSizes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 25, 32];
  for (const n of testSizes) {
    const stats = getBracketStats(n);
    assert.equal(stats.totalDuels, n - 1, `Failed stats totalDuels for n=${n}`);

    const sim = simulateTournament(`rn_${n}`, makeOptions(n));
    assert.equal(sim.playedDuels.length, n - 1, `Failed simulate playedDuels for n=${n}`);
    assert.ok(sim.champion, `Failed champion for n=${n}`);
  }
});

test('12. Deterministic shuffling: identical seed yields identical bracket matchups', () => {
  const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const run1 = shuffleArray(options, createSeededRandom(99999));
  const run2 = shuffleArray(options, createSeededRandom(99999));
  assert.deepEqual(run1, run2, 'Identical seed must produce identical order');

  const run3 = shuffleArray(options, createSeededRandom(11111));
  assert.notDeepEqual(run1, run3, 'Different seed should produce different order');

  const duelsA = createInitialDuels('det', options, true, createSeededRandom(54321));
  const duelsB = createInitialDuels('det', options, true, createSeededRandom(54321));
  assert.deepEqual(duelsA, duelsB, 'Matchups with identical seed must match completely');
});

test('13. Duplicate option rejection: adding existing option name (case-insensitive) fails', async () => {
  const { roomCode } = await createRoom({ hostNickname: 'Host13', title: 'Food Duel', presetId: 'friends_eat' });
  const snapshot = getRoomSnapshot(roomCode);
  const firstOption = snapshot.options[0].label;

  await assert.rejects(
    async () => {
      await addOption(roomCode, { label: firstOption.toUpperCase() });
    },
    (err) => {
      assert.match(err.message, /already in the options list/i);
      return true;
    }
  );
});

test('14. Single vote enforcement: duplicate castVote for same player in same duel is rejected', async () => {
  const { roomCode } = await createRoom({ hostNickname: 'Host14', title: 'Vote Duel', presetId: 'friends_eat' });
  const started = await startTournament(roomCode);
  const activeDuel = started.duels.find((d) => !d.is_bye);

  assert.ok(activeDuel, 'Must have active duel');

  // First vote succeeds
  await castVote({
    roomCode,
    duelId: activeDuel.duel_id,
    playerId: 'player_test_1',
    optionId: activeDuel.option_a_id,
  });

  // Second vote from same player fails
  await assert.rejects(
    async () => {
      await castVote({
        roomCode,
        duelId: activeDuel.duel_id,
        playerId: 'player_test_1',
        optionId: activeDuel.option_b_id,
      });
    },
    (err) => {
      assert.match(err.message, /already voted/i);
      return true;
    }
  );
});

test('15. Majority vote resolution: 3-1 vote advances majority choice without mini-game', async () => {
  const { roomCode } = await createRoom({ hostNickname: 'Host15', title: 'Majority Duel', presetId: 'friends_eat' });
  const started = await startTournament(roomCode);
  const activeDuel = started.duels.find((d) => !d.is_bye);

  // 3 votes for Option A, 1 vote for Option B
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p1', optionId: activeDuel.option_a_id });
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p2', optionId: activeDuel.option_a_id });
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p3', optionId: activeDuel.option_a_id });
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p4', optionId: activeDuel.option_b_id });

  const resolved = await closeVotingAndAdvanceDuel(roomCode, activeDuel.duel_id);
  const finishedDuel = resolved.duels.find((d) => d.duel_id === activeDuel.duel_id);

  assert.equal(finishedDuel.winner_id, activeDuel.option_a_id);
  assert.equal(finishedDuel.won_by_tiebreak, false);
  assert.equal(resolved.room.status !== 'tiebreak', true);
  assert.equal(resolved.tiebreak, null);
});

test('16. Tied vote resolution: 2-2 vote triggers tiebreak mini-game', async () => {
  const { roomCode } = await createRoom({ hostNickname: 'Host16', title: 'Tie Duel', presetId: 'friends_eat' });
  const started = await startTournament(roomCode);
  const activeDuel = started.duels.find((d) => !d.is_bye);

  // 2 votes for Option A, 2 votes for Option B
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p1', optionId: activeDuel.option_a_id });
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p2', optionId: activeDuel.option_a_id });
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p3', optionId: activeDuel.option_b_id });
  await castVote({ roomCode, duelId: activeDuel.duel_id, playerId: 'p4', optionId: activeDuel.option_b_id });

  const resolved = await closeVotingAndAdvanceDuel(roomCode, activeDuel.duel_id);

  assert.equal(resolved.room.status, 'tiebreak');
  assert.ok(resolved.tiebreak);
  assert.equal(resolved.tiebreak.duel_id, activeDuel.duel_id);
  assert.equal(resolved.tiebreak.status, 'ready');
});

test('17. Zero votes resolution: coin-toss or host choice without crash when timer expires with 0 votes', async () => {
  const { roomCode } = await createRoom({ hostNickname: 'Host17', title: 'Zero Vote Duel', presetId: 'friends_eat' });
  const started = await startTournament(roomCode);
  const activeDuel = started.duels.find((d) => !d.is_bye);

  // Advance without any votes
  const resolved = await closeVotingAndAdvanceDuel(roomCode, activeDuel.duel_id);
  const finishedDuel = resolved.duels.find((d) => d.duel_id === activeDuel.duel_id);

  assert.ok(finishedDuel.winner_id, 'Winner should be set even with zero votes');
  assert.equal(finishedDuel.won_by_tiebreak, false);
  assert.equal(resolved.room.status !== 'tiebreak', true);
  assert.match(finishedDuel.tiebreak_detail, /default advance/i);
});
