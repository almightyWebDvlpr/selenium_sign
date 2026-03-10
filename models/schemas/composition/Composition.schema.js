const mongoose = require('mongoose');
const CompositionRefSchema = require('./CompositionRef.schema');

// ---------- Period ----------
const PeriodSchema = new mongoose.Schema({ start: String, end: String }, { _id: false });

module.exports = new mongoose.Schema(
  {
    episodeId: { type: String, required: true, index: true },
    encounterId: { type: String, default: null, index: true },

    compositionId: { type: String, required: true },

    status: String,
    date: String,
    title: String,

    category: String,
    composition_type: String,

    author: CompositionRefSchema,
    legal_entity: CompositionRefSchema,
    encounter: CompositionRefSchema,

    subject: CompositionRefSchema,
    focus: CompositionRefSchema,

    // ⚠️ у тебе було помилково CompositionRefSchema — треба Period
    event_validity_period: PeriodSchema,

    extension: { valueCode: String, valueUuid: String },

    relatesTo: {
      type: [
        {
          code: String,
          target: {
            type: { type: String },
            id: String,
          },
        },
      ],
      default: undefined,
    },

    sourceRequestId: String,
  },
  { _id: false }
);
