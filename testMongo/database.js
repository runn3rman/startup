const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = config.hostname.startsWith('mongodb+srv://')
  ? config.hostname
  : `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;

const client = new MongoClient(url);
const db = client.db('rental');
const collection = db.collection('house');

async function main() {
  try {
    await db.command({ ping: 1 });
    console.log('DB connected');

    const house = {
      name: 'Beachfront views',
      summary: 'From your bedroom to the beach, no shoes required',
      property_type: 'Condo',
      beds: 1,
    };

    await collection.insertOne(house);

    const query = { property_type: 'Condo', beds: { $lt: 2 } };
    const rentals = await collection.find(query).toArray();
    rentals.forEach((rental) => console.log(rental));

    await collection.deleteMany(query);
  } catch (error) {
    console.log(`Database error: ${error.message}`);
  } finally {
    await client.close();
  }
}

main();
