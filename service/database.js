const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const mongoUrl = process.env.MONGO_URL || buildMongoUrl(config);
const client = new MongoClient(mongoUrl);
const db = client.db(process.env.MONGO_DB_NAME || 'inkspace');

const collections = {
  users: db.collection('users'),
  sessions: db.collection('sessions'),
  attempts: db.collection('attempts'),
};

let isConnected = false;

function buildMongoUrl(dbConfig) {
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
