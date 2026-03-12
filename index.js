const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { loadEnv, requireEnv } = require('./utils/env');
const { requireServiceToken } = require('./middlewares/auth.middleware');

loadEnv();

mongoose.connect(requireEnv('MONGODB_URI'));

const app = express();
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

// Middleware
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));
app.use(requireServiceToken);
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// app.use(bodyParser.json());
// app.use(bodyParser.text({ type: "*/*" }));
// Routes
app.use(require('./routes/health'));
app.use(require('./routes/logLegalEntityUpdate'));
app.use(require('./routes/htmlFileHandler'));
app.use(require('./routes/signContent'));
app.use(require('./routes/logs'));
app.use(require('./routes/confluenceSecret'));
app.use(require('./routes/confluenceSecretAll'));
app.use(require('./routes/updateConfluenceSecret'));
app.use(require('./routes/careTeams'));
app.use('/patient', require('./routes/patient.routes'));
app.use(require('./routes/uploadJpeg'));
// Start server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
