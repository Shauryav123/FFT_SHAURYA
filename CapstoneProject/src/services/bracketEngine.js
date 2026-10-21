/**
 * Module 3: Bracket Engine
 * Implements tournament shuffle, power-of-two bracket calculation,
 * automatic byes for non-power-of-two counts, round & duel generation,
 * and deterministic simulation.
 */

export function shuffleArray(items, randomFn = Math.random) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns smallest power of 2 >= n.
 */
export function getNextPowerOfTwo(n) {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
}

/**
 * Calculates bracket statistics for N options:
 * - powerOfTwo: bracket bracket size (e.g. 8 for 5 options)
 * - byes: number of options that bypass the preliminary round
 * - prelimDuels: number of preliminary duels in Round 1
 * - totalDuels: exact number of duels to decide the champion (N - 1)
 * - totalRounds: ceil(log2(N))
 */
export function getBracketStats(optionCount) {
  if (optionCount <= 0) {
    return { optionCount: 0, powerOfTwo: 0, byes: 0, prelimDuels: 0, totalDuels: 0, totalRounds: 0 };
  }
  if (optionCount === 1) {
    return { optionCount: 1, powerOfTwo: 1, byes: 0, prelimDuels: 0, totalDuels: 0, totalRounds: 1 };
  }
  const powerOfTwo = getNextPowerOfTwo(optionCount);
  const byes = powerOfTwo - optionCount;
  const prelimDuels = optionCount - powerOfTwo / 2;
  const totalDuels = optionCount - 1;
  const totalRounds = Math.ceil(Math.log2(optionCount));
  return {
    optionCount,
    powerOfTwo,
    byes,
    prelimDuels,
    totalDuels,
    totalRounds,
  };
}

/**
 * Calculates total expected rounds for N initial options.
 * For 0 options: 0
 * For 1 option: 1
 * For N >= 2: ceil(log2(N))
 */
export function getTotalRounds(optionCount) {
  if (optionCount <= 0) return 0;
  if (optionCount === 1) return 1;
  return Math.ceil(Math.log2(optionCount));
}

/**
 * Generates Round 1 duels with standard single-elimination bye seeding.
 * If N is not a power of 2, (powerOfTwo - N) options receive Round 1 byes,
 * and the remaining 2*(N - powerOfTwo/2) options compete in preliminary duels.
 */
export function createInitialDuels(roomId, optionIds, shouldShuffle = false, randomFn = Math.random) {
  if (!optionIds || optionIds.length === 0) return [];

  const orderedIds = shouldShuffle ? shuffleArray(optionIds, randomFn) : [...optionIds];
  const n = orderedIds.length;

  if (n === 1) {
    const optionA = orderedIds[0];
    return [
      {
        duel_id: `duel_${roomId}_r1_d1`,
        room_id: roomId,
        round_no: 1,
        duel_index: 1,
        option_a_id: optionA,
        option_b_id: null,
        winner_id: optionA,
        is_bye: true,
        status: 'completed',
        won_by_tiebreak: false,
        tiebreak_type: null,
        tiebreak_detail: 'Sole Option Champion',
      },
    ];
  }

  const p = getNextPowerOfTwo(n);
  const byesCount = p - n;
  const prelimDuelsCount = n - p / 2;
  const prelimOptionsCount = prelimDuelsCount * 2;

  const duels = [];
  let duelIndex = 1;

  // 1. Create preliminary playable duels
  for (let i = 0; i < prelimOptionsCount; i += 2) {
    const optionA = orderedIds[i];
    const optionB = orderedIds[i + 1];
    duels.push({
      duel_id: `duel_${roomId}_r1_d${duelIndex}`,
      room_id: roomId,
      round_no: 1,
      duel_index: duelIndex,
      option_a_id: optionA,
      option_b_id: optionB,
      winner_id: null,
      is_bye: false,
      status: 'pending',
      won_by_tiebreak: false,
      tiebreak_type: null,
      tiebreak_detail: null,
    });
    duelIndex++;
  }

  // 2. Create byes for remaining options
  for (let i = prelimOptionsCount; i < n; i++) {
    const byeOption = orderedIds[i];
    duels.push({
      duel_id: `duel_${roomId}_r1_d${duelIndex}`,
      room_id: roomId,
      round_no: 1,
      duel_index: duelIndex,
      option_a_id: byeOption,
      option_b_id: null,
      winner_id: byeOption,
      is_bye: true,
      status: 'completed',
      won_by_tiebreak: false,
      tiebreak_type: null,
      tiebreak_detail: 'Preliminary Round Bye',
    });
    duelIndex++;
  }

  return duels;
}

/**
 * Generates duels for subsequent rounds from an array of advancing option IDs.
 */
export function createRoundDuels(roomId, roundNo, optionIds, shouldShuffle = false, randomFn = Math.random) {
  if (!optionIds || optionIds.length === 0) return [];

  const orderedIds = shouldShuffle ? shuffleArray(optionIds, randomFn) : [...optionIds];
  const duels = [];
  let duelIndex = 1;

  if (orderedIds.length === 1) {
    const optionA = orderedIds[0];
    return [
      {
        duel_id: `duel_${roomId}_r${roundNo}_d1`,
        room_id: roomId,
        round_no: roundNo,
        duel_index: 1,
        option_a_id: optionA,
        option_b_id: null,
        winner_id: optionA,
        is_bye: true,
        status: 'completed',
        won_by_tiebreak: false,
        tiebreak_type: null,
        tiebreak_detail: 'Sole Option Auto-Advance',
      },
    ];
  }

  for (let i = 0; i < orderedIds.length; i += 2) {
    const optionA = orderedIds[i];
    const optionB = orderedIds[i + 1] || null;
    const duelId = `duel_${roomId}_r${roundNo}_d${duelIndex}`;

    if (optionB === null) {
      duels.push({
        duel_id: duelId,
        room_id: roomId,
        round_no: roundNo,
        duel_index: duelIndex,
        option_a_id: optionA,
        option_b_id: null,
        winner_id: optionA,
        is_bye: true,
        status: 'completed',
        won_by_tiebreak: false,
        tiebreak_type: null,
        tiebreak_detail: 'Automatic Bye',
      });
    } else {
      duels.push({
        duel_id: duelId,
        room_id: roomId,
        round_no: roundNo,
        duel_index: duelIndex,
        option_a_id: optionA,
        option_b_id: optionB,
        winner_id: null,
        is_bye: false,
        status: 'pending',
        won_by_tiebreak: false,
        tiebreak_type: null,
        tiebreak_detail: null,
      });
    }
    duelIndex++;
  }

  return duels;
}

/**
 * Simulates an entire tournament single-elimination progression from start to champion.
 * Returns { champion, allDuels, playedDuels, byes, rounds }
 */
export function simulateTournament(roomId, optionIds, pickWinnerFn = (duel) => duel.option_a_id, shouldShuffle = false, randomFn = Math.random) {
  if (!optionIds || optionIds.length === 0) {
    return { champion: null, allDuels: [], playedDuels: [], byes: 0, totalRounds: 0 };
  }
  if (optionIds.length === 1) {
    return { champion: optionIds[0], allDuels: [], playedDuels: [], byes: 0, totalRounds: 1 };
  }

  let currentRoundDuels = createInitialDuels(roomId, optionIds, shouldShuffle, randomFn);
  const allDuels = [...currentRoundDuels];
  let currentRound = 1;
  const totalRounds = getTotalRounds(optionIds.length);

  while (true) {
    // Resolve any pending duels
    for (const duel of currentRoundDuels) {
      if (!duel.winner_id && !duel.is_bye) {
        duel.winner_id = pickWinnerFn(duel);
        duel.status = 'completed';
      }
    }

    const roundWinners = currentRoundDuels.map((d) => d.winner_id).filter(Boolean);
    if (roundWinners.length <= 1) {
      return {
        champion: roundWinners[0] || null,
        allDuels,
        playedDuels: allDuels.filter((d) => !d.is_bye),
        byes: allDuels.filter((d) => d.is_bye).length,
        totalRounds,
      };
    }

    currentRound++;
    currentRoundDuels = createRoundDuels(roomId, currentRound, roundWinners, false);
    allDuels.push(...currentRoundDuels);
  }
}

/**
 * Returns a human-readable round label
 */
export function getRoundLabel(roundNo, totalRounds, activeDuelCount) {
  if (roundNo === totalRounds || activeDuelCount === 1) {
    return 'Grand Finale';
  }
  if (roundNo === totalRounds - 1 || activeDuelCount === 2) {
    return 'Semi-Finals';
  }
  if (roundNo === totalRounds - 2 || activeDuelCount === 4) {
    return 'Quarter-Finals';
  }
  return `Round ${roundNo}`;
}

/**
 * Filters options based on veto status and active room criteria filters
 */
export function getEligibleOptions(options, activeFilters = {}) {
  if (!Array.isArray(options)) return [];
  return options.filter((opt) => {
    if (!opt) return false;
    if (opt.is_vetoed) return false;
    if (activeFilters.vegOnly && !opt.is_veg) return false;
    if (activeFilters.maxPrice && opt.price_tag) {
      const priceOrder = { '$': 1, '$$': 2, '$$$': 3 };
      if ((priceOrder[opt.price_tag] || 1) > (priceOrder[activeFilters.maxPrice] || 3)) {
        return false;
      }
    }
    if (activeFilters.quickOnly && opt.duration_tag !== 'Quick') return false;
    return true;
  });
}
