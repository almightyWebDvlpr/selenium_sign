const { createLogger, format, transports } = require('winston');
const { MongoDB } = require('winston-mongodb');
const { requireEnv } = require('./env');

const mongoUri = requireEnv('MONGODB_URI');

module.exports = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new MongoDB({
      db: mongoUri,
      collection: 'demo',
      options: { useUnifiedTopology: true },
      tryReconnect: true,
    }),
  ],
});
