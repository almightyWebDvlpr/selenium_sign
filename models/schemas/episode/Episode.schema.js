const mongoose = require('mongoose');

const EpisodeDiagnosisSchema = require('./EpisodeDiagnosis.schema');
const EpisodeDiagnosesHistorySchema = require('./EpisodeDiagnosesHistory.schema');
const EpisodeStatusHistorySchema = require('./EpisodeStatusHistory.schema');
const EncounterPackageSchema = require('../encounter/EncounterPackage.schema');

// ---------- Ref ----------
const RefSchema = new mongoose.Schema({ display_value: String, value: String }, { _id: false });

module.exports = new mongoose.Schema(
  {
    episodeId: { type: String, required: true },

    name: String,
    status: String,
    status_reason: String,

    type: String,

    period: { start: String, end: String },

    inserted_at: String,
    updated_at: String,

    care_manager: RefSchema,
    care_team: RefSchema,
    managing_organization: RefSchema,
    part_of: RefSchema,

    closing_summary: String,
    explanatory_letter: String,

    current_diagnoses: { type: [EpisodeDiagnosisSchema], default: [] },
    diagnoses_history: { type: [EpisodeDiagnosesHistorySchema], default: [] },
    status_history: { type: [EpisodeStatusHistorySchema], default: [] },

    encounter_packages: { type: [EncounterPackageSchema], default: [] },
  },
  { _id: false }
);
