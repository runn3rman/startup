const ATTEMPTS_KEY = 'ink_mock_attempts';

const SEED_ATTEMPTS = [
  { id: 'a1', player: 'Avery', word: 'velocity', accuracy: 98, timeSeconds: 6.2, score: 980, date: '2026-01-20' },
  { id: 'a2', player: 'Jay', word: 'orbit', accuracy: 97, timeSeconds: 6.7, score: 955, date: '2026-01-19' },
  { id: 'a3', player: 'Grant', word: 'echo', accuracy: 96, timeSeconds: 6.9, score: 942, date: '2026-01-18' },
  { id: 'a4', player: 'Sky', word: 'glide', accuracy: 95, timeSeconds: 7.1, score: 920, date: '2026-01-22' },
  { id: 'a5', player: 'Mia', word: 'nova', accuracy: 93, timeSeconds: 7.6, score: 890, date: '2026-01-20' },
];

function ensureAttempts() {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (raw) {
    return JSON.parse(raw);
  }

  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(SEED_ATTEMPTS));
  return SEED_ATTEMPTS;
}

function saveAttempts(attempts) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

function ranked(attempts) {
  return [...attempts]
    .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
    .map((attempt, index) => ({ rank: index + 1, ...attempt }));
}

export async function getGlobalTop(limit = 10) {
  return ranked(ensureAttempts()).slice(0, limit);
}

export async function getFriendsTop(limit = 10) {
  const friendNames = new Set(['Grant', 'Sky', 'Mia']);
  return ranked(ensureAttempts().filter((a) => friendNames.has(a.player))).slice(0, limit);
}

export async function getBestByWord() {
  const attempts = ensureAttempts();
  const bestMap = new Map();

  attempts.forEach((attempt) => {
    const current = bestMap.get(attempt.word);
    if (!current || attempt.timeSeconds < current.timeSeconds) {
      bestMap.set(attempt.word, attempt);
    }
  });

  return ranked(Array.from(bestMap.values()));
}

export async function addAttempt({ player, word, accuracy, durationMs, score }) {
  const attempts = ensureAttempts();
  const item = {
    id: `a_${Date.now()}`,
    player,
    word,
    accuracy,
    timeSeconds: Number((durationMs / 1000).toFixed(1)),
    score,
    date: new Date().toISOString().slice(0, 10),
  };

  attempts.push(item);
  saveAttempts(attempts);
  return item;
}

export async function getAttempts() {
  return ensureAttempts();
}
