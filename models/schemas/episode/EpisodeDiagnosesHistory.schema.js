const mongoose = require('mongoose');
const EpisodeDiagnosisSchema = require('./EpisodeDiagnosis.schema');

// ---------- Ref ----------
const RefSchema = new mongoose.Schema({ display_value: String, value: String }, { _id: false });

module.exports = new mongoose.Schema(
  {
    date: String,
    diagnoses: { type: [EpisodeDiagnosisSchema], default: [] },
    evidence: RefSchema,
    is_active: Boolean,
  },
  { _id: false }
);
