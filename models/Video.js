const mongoose = require('mongoose');

// Video uchun schema
const videoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Modelni eksport qilish
module.exports = mongoose.model('Video', videoSchema);
