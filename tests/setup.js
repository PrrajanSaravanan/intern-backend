require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Redirect to a dedicated test database — never touches the production database
process.env.MONGO_URI = process.env.MONGO_URI.replace(/\/(\?|$)/, '/devhire-test$1');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  const cols = Object.values(mongoose.connection.collections);
  await Promise.all(cols.map((c) => c.deleteMany({})));
});
