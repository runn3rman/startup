const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.argv.length > 2 ? Number(process.argv[2]) : 4000;

const PLAYABLE_WORD_POOLS = {
  live: ['planet', 'orbit', 'echo', 'velocity', 'glide', 'nova', 'flux'],
  practice: {
    easy: ['cat', 'dog', 'sun'],
    medium: ['planet', 'window', 'garden'],
    hard: ['velocity', 'synchronize', 'trajectory'],
  },
};

function normalizeAttempt(item) {
  const durationMs = Number(item.durationMs ?? (item.timeSeconds || 0) * 1000);
  const timeSeconds = Number((durationMs / 1000).toFixed(1));
  const isCorrect = item.isCorrect ?? Boolean((item.accuracy || 0) >= 90);

  return {
    id: item.id,
    userId: item.userId || null,
    player: item.player || item.username || 'Guest',
    word: item.word || item.targetWord || 'word',
    targetWord: item.targetWord || item.word || 'word',
    predictedWord: item.predictedWord || '',
    isCorrect,
    accuracy: Number(item.accuracy ?? (isCorrect ? 100 : 0)),
    durationMs,
    timeSeconds,
    source: item.source || 'seed',
    createdAt: item.createdAt || new Date().toISOString(),
    date: item.date || new Date().toISOString().slice(0, 10),
  };
}

const seedAttempts = [
  { id: 'a1', player: 'Avery', word: 'velocity', isCorrect: true, timeSeconds: 6.2, date: '2026-01-20' },
  { id: 'a2', player: 'Jay', word: 'orbit', isCorrect: true, timeSeconds: 6.7, date: '2026-01-19' },
  { id: 'a3', player: 'Grant', word: 'echo', isCorrect: true, timeSeconds: 6.9, date: '2026-01-18' },
  { id: 'a4', player: 'Sky', word: 'glide', isCorrect: true, timeSeconds: 7.1, date: '2026-01-22' },
  { id: 'a5', player: 'Mia', word: 'nova', isCorrect: true, timeSeconds: 7.6, date: '2026-01-20' },
].map(normalizeAttempt);

// This service currently stores everything in memory. Restarting the process resets all data.
const store = {
  users: [],
  sessions: new Map(),
  attempts: [...seedAttempts],
  leaderboardSeed: [...seedAttempts],
  wordPools: {
    live: [...PLAYABLE_WORD_POOLS.live],
    practice: {
      easy: [...PLAYABLE_WORD_POOLS.practice.easy],
      medium: [...PLAYABLE_WORD_POOLS.practice.medium],
      hard: [...PLAYABLE_WORD_POOLS.practice.hard],
    },
  },
};

app.locals.store = store;
app.locals.models = {
  normalizeAttempt,
};

function sendError(res, statusCode, message, extra = {}) {
  res.status(statusCode).json({ error: message, ...extra });
}

function sendNotFound(res, message = 'Not found') {
  sendError(res, 404, message);
}

function sendServerError(res, error, fallbackMessage = 'Internal server error') {
  sendError(res, 500, fallbackMessage, {
    details: error?.message || fallbackMessage,
  });
}

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'inkspace-service',
    storage: {
      mode: 'in-memory',
      resetsOnRestart: true,
      counts: {
        users: store.users.length,
        sessions: store.sessions.size,
        attempts: store.attempts.length,
      },
    },
  });
});

app.use('/api', (_req, res) => {
  sendNotFound(res);
});

app.use((error, _req, res, _next) => {
  sendServerError(res, error);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Service listening on http://localhost:${port}`);
});
