const mongoose = require('mongoose');

module.exports = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    episodeId: { type: String, required: true },

    // 1) encounter (1 object)
    encounter: {
      encounterId: { type: String, required: true },
      status: String,
      class: String, // AMB
      period: { start: String, end: String },
      episodeId: String,
      performerId: String, // employee uuid
      diagnoses: {
        type: [
          {
            code: String, // E10.9
            conditionId: String, // uuid
            rank: Number,
            role: String, // primary
          },
        ],
        default: [],
      },
    },

    // 2) separate arrays per entity
    conditions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    observations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    immunizations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    diagnostic_reports: { type: [mongoose.Schema.Types.Mixed], default: [] },
    procedures: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // далі ще будуть сутності

    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
