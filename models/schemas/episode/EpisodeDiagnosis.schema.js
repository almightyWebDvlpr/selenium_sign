const mongoose = require('mongoose');

// ---------- Ref ----------
const RefSchema = new mongoose.Schema({ display_value: String, value: String }, { _id: false });

// ---------- Coding ----------
const CodingSchema = new mongoose.Schema({ code: String, system: String }, { _id: false });

module.exports = new mongoose.Schema(
  {
    code: CodingSchema,
    condition: RefSchema,
    rank: Number,
    role: CodingSchema,
  },
  { _id: false }
);
