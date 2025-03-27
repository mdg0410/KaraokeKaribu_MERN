const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título de la canción es obligatorio'],
    trim: true,
    index: true
  },
  artist: {
    type: String,
    required: [true, 'El artista es obligatorio'],
    trim: true,
    index: true
  },
  code: {
    type: Number,
    required: [true, 'El código de la canción es obligatorio'],
    unique: true,
    min: [1, 'El código debe ser mayor o igual a 1'],
    max: [8000, 'El código debe ser menor o igual a 8000']
  },
  duration: {
    type: Number,
    required: [true, 'La duración es obligatoria'],
    min: [1, 'La duración debe ser mayor a 0 segundos']
  },
  genre: {
    type: [String],
    default: []
  },
  language: {
    type: String,
    default: 'spanish',
    enum: ['spanish', 'english', 'portuguese', 'french', 'italian', 'other']
  },
  year: {
    type: Number,
    min: [1900, 'El año debe ser posterior a 1900']
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
  }
}, {
  timestamps: true
});

// Índices compuestos para búsquedas comunes
SongSchema.index({ title: 'text', artist: 'text' });
SongSchema.index({ artist: 1, title: 1 });
SongSchema.index({ genre: 1 });
SongSchema.index({ language: 1 });
SongSchema.index({ code: 1 }); // Índice para búsquedas por código

module.exports = mongoose.model('Song', SongSchema);
