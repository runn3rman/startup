const { existsSync } = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const config = loadDatabaseConfig();
const mongoUrl = process.env.MONGO_URL || buildMongoUrl(config);
const client = new MongoClient(mongoUrl);
const db = client.db(process.env.MONGO_DB_NAME || 'inkspace');

const collections = {
  users: db.collection('users'),
  sessions: db.collection('sessions'),
  attempts: db.collection('attempts'),
};

const seedAttempts = [
  buildSeedAttempt({ id: 'a1', player: 'Avery', word: 'velocity', timeSeconds: 6.2, date: '2026-01-20' }),
  buildSeedAttempt({ id: 'a2', player: 'Jay', word: 'orbit', timeSeconds: 6.7, date: '2026-01-19' }),
  buildSeedAttempt({ id: 'a3', player: 'Grant', word: 'echo', timeSeconds: 6.9, date: '2026-01-18' }),
  buildSeedAttempt({ id: 'a4', player: 'Sky', word: 'glide', timeSeconds: 7.1, date: '2026-01-22' }),
  buildSeedAttempt({ id: 'a5', player: 'Mia', word: 'nova', timeSeconds: 7.6, date: '2026-01-20' }),
];

let isConnected = false;
let indexesEnsured = false;

function loadDatabaseConfig() {
  const configPath = path.join(__dirname, 'dbConfig.json');
  if (!existsSync(configPath)) {
    return {};
  }

  return require(configPath);
}

function buildMongoUrl(dbConfig) {
  if (!dbConfig || (!dbConfig.hostname && !process.env.MONGO_URL)) {
    throw new Error('Mongo configuration is missing. Provide service/dbConfig.json or MONGO_URL.');
  }

  if (String(dbConfig.hostname || '').startsWith('mongodb+srv://')) {
    return dbConfig.hostname;
  }

  return `mongodb+srv://${dbConfig.userName}:${dbConfig.password}@${dbConfig.hostname}`;
}

function buildSeedAttempt({ id, player, word, timeSeconds, date }) {
  const durationMs = Math.round(Number(timeSeconds) * 1000);

  return {
    id,
    userId: null,
    player,
    word,
    targetWord: word,
    predictedWord: '',
    isCorrect: true,
    accuracy: 100,
    durationMs,
    timeSeconds: Number(timeSeconds),
    source: 'seed',
    createdAt: `${date}T00:00:00.000Z`,
    date,
  };
}

async function connectToDatabase() {
  if (isConnected) {
    return { client, db, collections };
  }

  await client.connect();
  await db.command({ ping: 1 });
  await ensureDatabaseIndexes();
  await seedDatabase();
  isConnected = true;
  return { client, db, collections };
}

async function ensureDatabaseIndexes() {
  if (indexesEnsured) {
    return collections;
  }

  await collections.users.createIndexes([
    { key: { email: 1 }, name: 'users_email_unique', unique: true },
    { key: { id: 1 }, name: 'users_id_unique', unique: true },
  ]);

  await collections.sessions.createIndexes([
    { key: { token: 1 }, name: 'sessions_token_unique', unique: true },
    { key: { userId: 1 }, name: 'sessions_userId' },
  ]);

  await collections.attempts.createIndexes([
    { key: { id: 1 }, name: 'attempts_id_unique', unique: true },
    { key: { userId: 1 }, name: 'attempts_userId' },
    { key: { isCorrect: 1, timeSeconds: 1 }, name: 'attempts_correct_time' },
    { key: { word: 1 }, name: 'attempts_word' },
    { key: { player: 1 }, name: 'attempts_player' },
    { key: { createdAt: 1 }, name: 'attempts_createdAt' },
  ]);

  indexesEnsured = true;
  return collections;
}

async function seedDatabase() {
  const attemptCount = await collections.attempts.countDocuments({}, { limit: 1 });
  if (attemptCount > 0) {
    return collections;
  }

  await collections.attempts.insertMany(seedAttempts);
  return collections;
}

module.exports = {
  client,
  collections,
  connectToDatabase,
  db,
  ensureDatabaseIndexes,
  mongoUrl,
  seedDatabase,
};
