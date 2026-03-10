const mongoose = require('mongoose');

module.exports = new mongoose.Schema(
  {
    inserted_at: String,
    inserted_by: String,
    status: String,
    status_reason: String,
  },
  { _id: false }
);
