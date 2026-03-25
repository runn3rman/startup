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
  isConnected = true;
  return { client, db, collections };
}

module.exports = {
  client,
  collections,
  connectToDatabase,
  db,
  mongoUrl,
};
