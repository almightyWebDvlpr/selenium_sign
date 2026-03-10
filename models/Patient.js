const mongoose = require('mongoose');

const {
  PhoneSchema,
  AddressSchema,
  DocumentSchema,
  EmergencyContactSchema,
  PersonRequestHistorySchema,
  NameSchema,
} = require('./schemas/common');

const EpisodeSchema = require('./schemas/episode/Episode.schema');
const CompositionSchema = require('./schemas/composition/Composition.schema');
const EncounterPackege = require('./schemas/encounter/EncounterPackage.schema');

const PatientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      // unique прибираємо звідси
    },

    environment: { type: String, required: false },

    // 👇 новий флаг
    type: {
      type: String,
      enum: ['PERSON', 'PREPERSON'],
      required: false,
    },

    personRequests: { type: [PersonRequestHistorySchema], default: [] },

    // v3: як приходить
    names: { type: [NameSchema], default: undefined },

    // v2-compatible “плоскі” поля (залишаємо)
    first_name: String,
    second_name: String,
    last_name: String,

    birth_date: String,
    birth_country: String,
    birth_settlement: String,

    gender: String,
    email: String,

    tax_id: String,
    no_tax_id: Boolean,
    unzr: String,

    preferred_way_communication: String,
    secret: String,

    phones: { type: [PhoneSchema], default: [] },
    addresses: { type: [AddressSchema], default: [] },
    documents: { type: [DocumentSchema], default: [] },
    emergency_contact: { type: EmergencyContactSchema, default: null },

    authentication_methods: { type: [{ type: { type: String } }], default: [] },

    episodes: { type: [EpisodeSchema], default: [] },
    encounter_packages: { type: [EncounterPackege], default: [] },
    carePlans: { type: Array, default: [] },
    procedures: { type: Array, default: [] },
    diagnostic_reports: { type: Array, default: [] },
    compositions: { type: [CompositionSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ унікальність в межах env + типу (щоб PERSON і PREPERSON з однаковим UUID не зіштовхнулись)
PatientSchema.index(
  { environment: 1, type: 1, patientId: 1, 'compositions.compositionId': 1 },
  { unique: false }
);

module.exports = mongoose.model('Patient', PatientSchema);
