/**
 * Live Public REST APIs for Decision Duel Interactive Games
 * 1. Open Trivia Database API (https://opentdb.com/api.php) — Speed Trivia Battle
 * 2. Datamuse Word & Clue API (https://api.datamuse.com/words) — Word Scramble Rush
 * 3. Deck of Cards API (https://deckofcardsapi.com/api/deck) — Blackjack 21 / High-Card Duel
 * 4. PokéAPI (https://pokeapi.co/api/v2/pokemon) — Champion Mascot Boss Battle
 */

function decodeHtmlEntities(str) {
  if (!str) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

const FALLBACK_TRIVIA = [
  {
    category: 'Food & Dining',
    question: 'Which Italian city is widely credited as the birthplace of modern Neapolitan pizza?',
    correct_answer: 'Naples',
    options: ['Rome', 'Naples', 'Milan', 'Florence'],
  },
  {
    category: 'Entertainment & Film',
    question: 'Which animated film won the Oscar for Best Animated Feature in 2019?',
    correct_answer: 'Spider-Man: Into the Spider-Verse',
    options: [
      'Incredibles 2',
      'Spider-Man: Into the Spider-Verse',
      'Isle of Dogs',
      'Toy Story 4',
    ],
  },
  {
    category: 'Pop Culture',
    question: 'What spice gives traditional curry dishes their bright golden-yellow color?',
    correct_answer: 'Turmeric',
    options: ['Saffron', 'Turmeric', 'Cardamom', 'Paprika'],
  },
];

export async function fetchTriviaQuestion() {
  const endpoint = 'https://opentdb.com/api.php?amount=1&type=multiple';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('Trivia HTTP error');
    const data = await res.json();
    const item = data?.results?.[0];
    if (!item) throw new Error('Empty trivia response');

    const correct = decodeHtmlEntities(item.correct_answer);
    const incorrect = (item.incorrect_answers || []).map(decodeHtmlEntities);
    const allOptions = [...incorrect, correct].sort(() => Math.random() - 0.5);

    return {
      isLiveApi: true,
      category: decodeHtmlEntities(item.category),
      question: decodeHtmlEntities(item.question),
      correct_answer: correct,
      options: allOptions,
    };
  } catch {
    const fb = FALLBACK_TRIVIA[Math.floor(Math.random() * FALLBACK_TRIVIA.length)];
    return { isLiveApi: false, ...fb };
  }
}

/**
 * Fetch a live word + definition clue from Datamuse API (https://api.datamuse.com)
 * for the Interactive Word Scramble Rush game
 */
const TOPICS = ['food', 'cinema', 'adventure', 'festival', 'dessert', 'music'];
const FALLBACK_WORDS = [
  { word: 'PIZZERIA', clue: 'A restaurant where pizzas are baked and served' },
  { word: 'POPCORN', clue: 'Classic theatre snack made from heated corn kernels' },
  { word: 'FESTIVAL', clue: 'A lively celebration or special entertainment event' },
  { word: 'ESPRESSO', clue: 'Rich, concentrated Italian coffee brewed under pressure' },
  { word: 'CHAMPION', clue: 'The ultimate winner of a tournament or duel' },
];

function scrambleWord(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const joined = arr.join('');
  return joined === word ? arr.reverse().join('') : joined;
}

export async function fetchWordScrambleChallenge() {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const endpoint = `https://api.datamuse.com/words?ml=${topic}&md=d&max=25`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Datamuse error');
    const list = await res.json();
    const valid = list.filter(
      (item) =>
        item.word &&
        /^[a-zA-Z]{5,9}$/.test(item.word) &&
        Array.isArray(item.defs) &&
        item.defs.length > 0
    );
    if (valid.length === 0) throw new Error('No valid words');
    const chosen = valid[Math.floor(Math.random() * valid.length)];
    const upper = chosen.word.toUpperCase();
    const rawDef = chosen.defs[0].split('\t')[1] || `Related to ${topic}`;

    return {
      isLiveApi: true,
      word: upper,
      scrambled: scrambleWord(upper),
      clue: rawDef.charAt(0).toUpperCase() + rawDef.slice(1),
      topic,
    };
  } catch {
    const fb = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
    return {
      isLiveApi: false,
      word: fb.word,
      scrambled: scrambleWord(fb.word),
      clue: fb.clue,
      topic: 'decision',
    };
  }
}

const CARD_BJ_VALUE = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  JACK: 10,
  QUEEN: 10,
  KING: 10,
  ACE: 11,
};

/**
 * Draw cards from Deck of Cards API (https://deckofcardsapi.com)
 */
export async function fetchDeckCards(count = 4) {
  const endpoint = `https://deckofcardsapi.com/api/deck/new/draw/?count=${count}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Deck API error');
    const data = await res.json();
    const cards = (data.cards || []).map((c) => ({
      code: c.code,
      image: c.image,
      value: c.value,
      suit: c.suit,
      points: CARD_BJ_VALUE[c.value] || 10,
    }));
    if (cards.length < count) throw new Error('Insufficient cards');
    return { isLiveApi: true, cards };
  } catch {
    return {
      isLiveApi: false,
      cards: [
        { code: 'AS', image: 'https://deckofcardsapi.com/static/img/AS.png', value: 'ACE', suit: 'SPADES', points: 11 },
        { code: '9H', image: 'https://deckofcardsapi.com/static/img/9H.png', value: '9', suit: 'HEARTS', points: 9 },
        { code: 'KD', image: 'https://deckofcardsapi.com/static/img/KD.png', value: 'KING', suit: 'DIAMONDS', points: 10 },
        { code: '8C', image: 'https://deckofcardsapi.com/static/img/8C.png', value: '8', suit: 'CLUBS', points: 8 },
        { code: '5S', image: 'https://deckofcardsapi.com/static/img/5S.png', value: '5', suit: 'SPADES', points: 5 },
        { code: '7D', image: 'https://deckofcardsapi.com/static/img/7D.png', value: '7', suit: 'DIAMONDS', points: 7 },
      ],
    };
  }
}

export async function fetchHighCardDuel() {
  const res = await fetchDeckCards(2);
  const cardA = res.cards[0];
  const cardB = res.cards[1];
  return {
    isLiveApi: res.isLiveApi,
    cardA,
    cardB,
    winnerSide: cardA.points >= cardB.points ? 'A' : 'B',
  };
}

export async function fetchMascotClash() {
  const idA = Math.floor(Math.random() * 150) + 1;
  let idB = Math.floor(Math.random() * 150) + 1;
  if (idB === idA) idB = (idA % 150) + 1;

  try {
    const [resA, resB] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${idA}`),
      fetch(`https://pokeapi.co/api/v2/pokemon/${idB}`),
    ]);
    if (!resA.ok || !resB.ok) throw new Error('PokeAPI error');
    const [pokeA, pokeB] = await Promise.all([resA.json(), resB.json()]);

    const parseMascot = (p) => {
      const hp = p.stats?.find((s) => s.stat.name === 'hp')?.base_stat || 60;
      const atk = p.stats?.find((s) => s.stat.name === 'attack')?.base_stat || 65;
      const spd = p.stats?.find((s) => s.stat.name === 'speed')?.base_stat || 70;
      return {
        name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
        sprite: p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default,
        hp,
        atk,
        spd,
        totalPower: hp + atk + spd,
      };
    };

    const mascotA = parseMascot(pokeA);
    const mascotB = parseMascot(pokeB);
    return {
      isLiveApi: true,
      mascotA,
      mascotB,
      winnerSide: mascotA.totalPower >= mascotB.totalPower ? 'A' : 'B',
    };
  } catch {
    return {
      isLiveApi: false,
      mascotA: {
        name: 'Charizard',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
        hp: 78,
        atk: 84,
        spd: 100,
        totalPower: 262,
      },
      mascotB: {
        name: 'Blastoise',
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
        hp: 79,
        atk: 83,
        spd: 78,
        totalPower: 240,
      },
      winnerSide: 'A',
    };
  }
}

export async function fetchTiebreakChallengePrompt() {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    const data = await res.json();
    return { isLiveApi: true, fact: data.text };
  } catch {
    return {
      isLiveApi: false,
      fact: 'Groups settle decisions 5x faster when playing interactive head-to-head rounds!',
    };
  }
}
