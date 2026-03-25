const { execFile } = require('child_process');
const express = require('express');
const { existsSync } = require('fs');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const { connectToDatabase, db, collections } = require('./database');

const execFileAsync = promisify(execFile);
const app = express();
const port = process.argv.length > 2 ? Number(process.argv[2]) : 4000;
const AUTH_COOKIE_NAME = 'token';
const SALT_ROUNDS = 10;
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const PREDICT_SCRIPT = path.join(process.cwd(), 'model', 'predict_word.py');
const SPA_CANDIDATE_DIRS = ['public', 'dist'];

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
app.locals.db = db;
app.locals.collections = collections;

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

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

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

function sendUnauthorized(res) {
  sendError(res, 401, 'Unauthorized');
}

async function resolveAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      req.authToken = null;
      req.authSession = null;
      req.user = null;
      next();
      return;
    }

    const session = await collections.sessions.findOne({ token });
    if (!session) {
      clearAuthCookie(res);
      req.authToken = null;
      req.authSession = null;
      req.user = null;
      next();
      return;
    }

    const user = await collections.users.findOne({ id: session.userId });
    if (!user) {
      await collections.sessions.deleteOne({ token });
      clearAuthCookie(res);
      req.authToken = null;
      req.authSession = null;
      req.user = null;
      next();
      return;
    }

    req.authToken = token;
    req.authSession = session;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    sendUnauthorized(res);
    return;
  }

  next();
}

function pickRandomWord(words) {
  if (!Array.isArray(words) || words.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * words.length);
  return words[index];
}

function rankAttempts(attempts, limit) {
  const ranked = [...attempts]
    .filter((attempt) => attempt.isCorrect)
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
    .map((attempt, index) => ({ rank: index + 1, ...attempt }));

  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
}

function getFriendsAttempts() {
  const friendNames = new Set(['Grant', 'Sky', 'Mia']);
  return store.attempts.filter((attempt) => friendNames.has(attempt.player));
}

function getBestAttemptsByWord() {
  const bestMap = new Map();

  store.attempts
    .filter((attempt) => attempt.isCorrect)
    .forEach((attempt) => {
      const current = bestMap.get(attempt.word);
      if (!current || attempt.timeSeconds < current.timeSeconds) {
        bestMap.set(attempt.word, attempt);
      }
    });

  return rankAttempts(Array.from(bestMap.values()));
}

function getAttemptsByUser(userId) {
  return store.attempts.filter((attempt) => attempt.userId === userId);
}

function summarizeAttemptsByWord(attempts) {
  const byWordMap = new Map();

  attempts.forEach((attempt) => {
    const current = byWordMap.get(attempt.word);
    if (!current) {
      byWordMap.set(attempt.word, {
        word: attempt.word,
        attempts: 1,
        correctAttempts: attempt.isCorrect ? 1 : 0,
        bestTime: attempt.isCorrect ? attempt.timeSeconds : null,
        latestTime: attempt.timeSeconds,
      });
      return;
    }

    current.attempts += 1;
    current.correctAttempts += attempt.isCorrect ? 1 : 0;
    current.latestTime = attempt.timeSeconds;
    if (attempt.isCorrect && (current.bestTime === null || attempt.timeSeconds < current.bestTime)) {
      current.bestTime = attempt.timeSeconds;
    }
  });

  return Array.from(byWordMap.values()).sort((a, b) => a.word.localeCompare(b.word));
}

function parseImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') {
    throw new Error('imageDataUrl is required');
  }

  const match = imageDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error('imageDataUrl must be a PNG data URL');
  }

  return Buffer.from(match[1], 'base64');
}

async function runPrediction(imageDataUrl) {
  let tempDir = '';

  try {
    const imageBuffer = parseImageDataUrl(imageDataUrl);

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ink-predict-'));
    const imagePath = path.join(tempDir, 'input.png');
    await fs.writeFile(imagePath, imageBuffer);

    const { stdout, stderr } = await execFileAsync(PYTHON_BIN, [PREDICT_SCRIPT, imagePath], {
      cwd: process.cwd(),
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });

    const predictedWord = String(stdout).trim().split('\n').pop() || '';
    if (!predictedWord) {
      throw new Error(stderr || 'No prediction returned by Python script');
    }

    return predictedWord;
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}

function resolveSpaDirectory() {
  return SPA_CANDIDATE_DIRS.map((dir) => path.join(process.cwd(), dir)).find((dir) =>
    existsSync(path.join(dir, 'index.html'))
  );
}

const spaDirectory = resolveSpaDirectory();

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(resolveAuth);

if (spaDirectory) {
  app.use(express.static(spaDirectory));
} else {
  app.use(express.static('public'));
}

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

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password) {
      sendError(res, 400, 'username, email, and password are required');
      return;
    }

    const existingUser = await collections.users.findOne({ email: normalizedEmail });
    if (existingUser) {
      sendError(res, 409, 'Email already registered');
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const user = {
      id: uuidv4(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await collections.users.insertOne(user);

    // Temporary mirror until login/session auth reads are moved off in-memory storage.
    store.users.push(user);

    const token = uuidv4();
    const session = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await collections.sessions.insertOne(session);

    // Temporary mirror until auth/session reads are moved off in-memory storage.
    store.sessions.set(token, session);

    setAuthCookie(res, token);
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      sendError(res, 400, 'email and password are required');
      return;
    }

    const user = store.users.find((item) => item.email === normalizedEmail);
    if (!user) {
      sendError(res, 401, 'Invalid credentials');
      return;
    }

    const matches = await bcrypt.compare(String(password), user.passwordHash);
    if (!matches) {
      sendError(res, 401, 'Invalid credentials');
      return;
    }

    const token = uuidv4();
    const session = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await collections.sessions.insertOne(session);

    // Temporary mirror until auth/session reads are moved off in-memory storage.
    store.sessions.set(token, session);

    setAuthCookie(res, token);
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    if (req.authToken) {
      await collections.sessions.deleteOne({ token: req.authToken });
    }

    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.get('/api/words/next', (_req, res) => {
  const word = pickRandomWord(store.wordPools.live);
  if (!word) {
    sendError(res, 500, 'No live words available');
    return;
  }

  res.json({
    word,
    fetchedAt: new Date().toISOString(),
    source: 'service-word-pool',
  });
});

app.get('/api/words/practice', (req, res) => {
  const requestedLevel = String(req.query.level || 'easy').toLowerCase();
  const resolvedLevel = store.wordPools.practice[requestedLevel] ? requestedLevel : 'easy';
  const words = store.wordPools.practice[resolvedLevel];

  res.json({
    level: resolvedLevel,
    words,
    fetchedAt: new Date().toISOString(),
  });
});

app.post('/api/predict', async (req, res, next) => {
  try {
    const predictedWord = await runPrediction(req.body?.imageDataUrl);
    res.json({ predictedWord });
  } catch (error) {
    next(error);
  }
});

app.post('/api/attempts', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const targetWord = String(payload.targetWord || payload.word || '').trim();

    if (!targetWord) {
      sendError(res, 400, 'targetWord is required');
      return;
    }

    const savedAttempt = normalizeAttempt({
      id: uuidv4(),
      userId: req.user.id,
      player: req.user.username,
      word: targetWord,
      targetWord,
      predictedWord: String(payload.predictedWord || '').trim(),
      isCorrect: payload.isCorrect,
      accuracy: payload.accuracy,
      durationMs: payload.durationMs ?? (payload.timeSeconds ? Number(payload.timeSeconds) * 1000 : 0),
      source: payload.source || 'submitted',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
    });

    await collections.attempts.insertOne(savedAttempt);
    res.status(201).json({ attempt: savedAttempt });
  } catch (error) {
    next(error);
  }
});

app.get('/api/attempts/me', requireAuth, async (req, res, next) => {
  try {
    const attempts = await collections.attempts
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const bestScores = rankAttempts(attempts, 10);
    const byWord = summarizeAttemptsByWord(attempts);

    res.json({
      attempts,
      bestScores,
      byWord,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/leaderboards/global', (_req, res) => {
  res.json(rankAttempts(store.attempts, 10));
});

app.get('/api/leaderboards/friends', (_req, res) => {
  res.json(rankAttempts(getFriendsAttempts(), 10));
});

app.get('/api/leaderboards/words', (_req, res) => {
  res.json(getBestAttemptsByWord());
});

app.use('/api', (_req, res) => {
  sendNotFound(res);
});

if (spaDirectory) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(spaDirectory, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  sendServerError(res, error);
});

async function start() {
  try {
    await connectToDatabase();
    // eslint-disable-next-line no-console
    console.log('DB connected');
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Service listening on http://localhost:${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Connection failed to MongoDB because ${error.message}`);
    process.exit(1);
  }
}

start();
