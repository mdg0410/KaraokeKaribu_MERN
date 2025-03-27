const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  code: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: false,
    default: 'OTROS'
  },
  duration: {
    type: Number,
    default: 180 // duración predeterminada en segundos
  },
  language: {
    type: String,
    default: 'spanish'
  },
  year: {
    type: Number,
    default: null
  },
  lyrics: {
    type: String,
    default: null
  },
  pdfUrl: {
    type: String,
    default: null
  },
  audioPreviewUrl: {
    type: String,
    default: null
  },
  indexed: {
    type: Boolean,
    default: false
  },
  popularity: {
    type: Number,
    default: 0
  },
  playCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
SongSchema.index({ title: 1, artist: 1 });
SongSchema.index({ code: 1 }, { unique: true });
SongSchema.index({ genre: 1 });
SongSchema.index({ popularity: -1 });

module.exports = mongoose.model('Song', SongSchema);
