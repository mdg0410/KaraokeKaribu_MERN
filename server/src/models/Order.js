const mongoose = require('mongoose');

const OrderProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La cantidad mínima es 1']
  },
  options: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo']
  }
});

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  products: {
    type: [OrderProductSchema],
    default: []
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  }
}, {
  timestamps: true
});

// Método para calcular el total automáticamente
OrderSchema.methods.calculateTotal = function() {
  this.total = this.products.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
};

// Middleware para calcular el total antes de guardar
OrderSchema.pre('save', function(next) {
  if (this.isModified('products')) {
    this.calculateTotal();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
