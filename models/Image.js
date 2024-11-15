const mongoose = require('mongoose');

// Tasvir uchun schema
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Image', imageSchema);
