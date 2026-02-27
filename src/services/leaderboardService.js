const ATTEMPTS_KEY = 'ink_mock_attempts';

const SEED_ATTEMPTS = [
  { id: 'a1', player: 'Avery', word: 'velocity', isCorrect: true, timeSeconds: 6.2, date: '2026-01-20' },
  { id: 'a2', player: 'Jay', word: 'orbit', isCorrect: true, timeSeconds: 6.7, date: '2026-01-19' },
  { id: 'a3', player: 'Grant', word: 'echo', isCorrect: true, timeSeconds: 6.9, date: '2026-01-18' },
  { id: 'a4', player: 'Sky', word: 'glide', isCorrect: true, timeSeconds: 7.1, date: '2026-01-22' },
  { id: 'a5', player: 'Mia', word: 'nova', isCorrect: true, timeSeconds: 7.6, date: '2026-01-20' },
];

function normalizeAttempt(item) {
  const timeSeconds = item.timeSeconds ?? Number(((item.durationMs || 0) / 1000).toFixed(1));
  const isCorrect = item.isCorrect ?? Boolean((item.accuracy || 0) >= 90);

  return {
    id: item.id || `a_${Date.now()}`,
    player: item.player || 'Guest',
    word: item.word || 'word',
    isCorrect,
    timeSeconds: Number(timeSeconds || 0),
    date: item.date || new Date().toISOString().slice(0, 10),
  };
}

function ensureAttempts() {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (raw) {
    const normalized = JSON.parse(raw).map(normalizeAttempt);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(SEED_ATTEMPTS));
  return SEED_ATTEMPTS;
}

function saveAttempts(attempts) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

function ranked(attempts) {
  return [...attempts]
    .filter((a) => a.isCorrect)
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
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
  const attempts = ensureAttempts().filter((a) => a.isCorrect);
  const bestMap = new Map();

  attempts.forEach((attempt) => {
    const current = bestMap.get(attempt.word);
    if (!current || attempt.timeSeconds < current.timeSeconds) {
      bestMap.set(attempt.word, attempt);
    }
  });

  return ranked(Array.from(bestMap.values()));
}

export async function addAttempt({ player, word, isCorrect, durationMs }) {
  const attempts = ensureAttempts();
  const item = {
    id: `a_${Date.now()}`,
    player,
    word,
    isCorrect,
    timeSeconds: Number((durationMs / 1000).toFixed(1)),
    date: new Date().toISOString().slice(0, 10),
  };

  attempts.push(item);
  saveAttempts(attempts);
  return item;
}

export async function getAttempts() {
  return ensureAttempts();
}
