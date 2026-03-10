const mongoose = require('mongoose');

// ---------- Phone ----------
const PhoneSchema = new mongoose.Schema({ number: String, type: String }, { _id: false });

// ---------- Address ----------
const AddressSchema = new mongoose.Schema(
  {
    area: String,
    building: String,
    country: String,
    region: String,
    settlement: String,
    settlement_id: String,
    settlement_type: String,
    street: String,
    street_type: String,
    type: String,
    zip: String,
  },
  { _id: false }
);

// ---------- Document ----------
const DocumentSchema = new mongoose.Schema(
  {
    expiration_date: String,
    issued_at: String,
    issued_by: String,
    number: String,
    type: String,
  },
  { _id: false }
);

// ---------- EmergencyContact ----------
const EmergencyContactSchema = new mongoose.Schema(
  {
    first_name: String,
    last_name: String,
    second_name: String,
    phones: { type: [PhoneSchema], default: [] },
  },
  { _id: false }
);

// ---------- PersonRequestHistory ----------
const PersonRequestHistorySchema = new mongoose.Schema(
  {
    requestId: String,
    operation: String, // create | update
    signedAt: Date,
  },
  { _id: false }
);

// ---------- Name (v3) ----------
const NameSchema = new mongoose.Schema(
  {
    first_name: String,
    second_name: String,
    last_name: String,
    language: String,
    no_last_name: Boolean,
  },
  { _id: false }
);

module.exports = {
  PhoneSchema,
  AddressSchema,
  DocumentSchema,
  EmergencyContactSchema,
  PersonRequestHistorySchema,
  NameSchema,
};
