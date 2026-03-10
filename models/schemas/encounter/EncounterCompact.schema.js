const mongoose = require('mongoose');

module.exports = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },

    status: String,
    inserted_at: String,
    updated_at: String,

    episodeId: String,
    patientId: String,

    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);
