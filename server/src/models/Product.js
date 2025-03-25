const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: ['bebidas', 'comidas', 'combos', 'varios']
  },
  imageUrl: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  options: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Índices para búsquedas comunes
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Product', ProductSchema);
