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

async function connectToDatabase() {
  if (isConnected) {
    return { client, db, collections };
  }

  await client.connect();
  await db.command({ ping: 1 });
  await ensureDatabaseIndexes();
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

module.exports = {
  client,
  collections,
  connectToDatabase,
  db,
  ensureDatabaseIndexes,
  mongoUrl,
};
