const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Mocha will require this file before running tests thanks to --file
before(async function () {
  this.timeout(20000); // allow time for in-memory server startup
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // Set env var expected by the application/tests
  process.env.MONGO_URI_REST = uri;

  // Connect mongoose so tests and app can use the same connection
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('In-memory MongoDB started for tests at', uri);
});

after(async function () {
  this.timeout(10000);
  try {
    await mongoose.disconnect();
  } catch (err) {
    // ignore
  }
  if (mongoServer) await mongoServer.stop();
  console.log('In-memory MongoDB stopped.');
});
