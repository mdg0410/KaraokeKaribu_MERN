const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: [true, 'El número de mesa es obligatorio'],
    unique: true,
    min: [1, 'El número de mesa debe ser mayor a 0']
  },
  status: {
    type: String,
    enum: ['free', 'occupied', 'reserved', 'maintenance'],
    default: 'free'
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  capacity: {
    type: Number,
    required: [true, 'La capacidad de la mesa es obligatoria'],
    min: [1, 'La capacidad mínima es 1 persona']
  },
  location: {
    type: String,
    default: 'main'
  }
}, {
  timestamps: true
});

// Índice para búsquedas por número de mesa
TableSchema.index({ number: 1 });

module.exports = mongoose.model('Table', TableSchema);
