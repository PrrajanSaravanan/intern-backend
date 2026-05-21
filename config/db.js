const dns = require('dns');
const mongoose = require('mongoose');

// Some Windows DNS setups refuse SRV lookups that mongodb+srv requires.
if (process.env.MONGO_URI?.startsWith('mongodb+srv://')) {
  const servers = (process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) dns.setServers(servers);
}

const connectDB = async () => {
  const poolSize = parseInt(process.env.MONGO_POOL_SIZE, 10) || 10;

  // tlsInsecure bypasses corporate SSL proxy certificate interception in dev.
  // NEVER set MONGO_TLS_INSECURE in production.
  const tlsInsecure = process.env.MONGO_TLS_INSECURE === 'true';

  await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: poolSize,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    ...(tlsInsecure && { tlsInsecure: true }),
  });
};

mongoose.connection.on('connected', () => {
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

module.exports = connectDB;
