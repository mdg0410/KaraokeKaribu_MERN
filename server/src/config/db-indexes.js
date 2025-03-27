const mongoose = require('mongoose');
const Song = require('../models/Song');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Table = require('../models/Table');
const User = require('../models/User');

/**
 * Configura todos los índices necesarios para optimizar el rendimiento de MongoDB
 */
const setupIndexes = async () => {
  try {
    console.log('Setting up database indexes...');
    
    // Índices para Song
    await Song.collection.createIndexes([
      { key: { title: 1 }, name: 'title_idx' },
      { key: { artist: 1 }, name: 'artist_idx' },
      { key: { code: 1 }, name: 'code_idx', unique: true },
      { key: { genre: 1 }, name: 'genre_idx' },
      { key: { language: 1 }, name: 'language_idx' },
      // Índice compuesto para búsquedas comunes
      { key: { title: 1, artist: 1 }, name: 'title_artist_idx' }
    ]);
    
    // Índices para Product
    await Product.collection.createIndexes([
      { key: { name: 1 }, name: 'name_idx', unique: true },
      { key: { category: 1 }, name: 'category_idx' },
      { key: { isAvailable: 1 }, name: 'available_idx' },
      { key: { price: 1 }, name: 'price_idx' },
      // Índice compuesto para filtros comunes
      { key: { category: 1, isAvailable: 1 }, name: 'cat_avail_idx' }
    ]);
    
    // Índices para Order
    await Order.collection.createIndexes([
      { key: { userId: 1 }, name: 'userId_idx' },
      { key: { tableId: 1 }, name: 'tableId_idx' },
      { key: { status: 1 }, name: 'status_idx' },
      { key: { createdAt: -1 }, name: 'created_idx' },
      // Índice para búsqueda de órdenes con ciertas canciones
      { key: { 'songs': 1 }, name: 'songs_idx' },
      // Índice para búsqueda de órdenes con ciertos productos
      { key: { 'products.productId': 1 }, name: 'products_idx' }
    ]);
    
    // Índices para Table
    await Table.collection.createIndexes([
      { key: { number: 1 }, name: 'number_idx', unique: true },
      { key: { status: 1 }, name: 'table_status_idx' },
      { key: { currentOrderId: 1 }, name: 'currentOrder_idx', sparse: true }
    ]);
    
    // Índices para User
    await User.collection.createIndexes([
      { key: { email: 1 }, name: 'email_idx', unique: true },
      { key: { username: 1 }, name: 'username_idx', unique: true },
      { key: { role: 1 }, name: 'role_idx' }
    ]);
    
    console.log('Database indexes setup complete');
  } catch (error) {
    console.error('Error setting up database indexes:', error);
    throw error;
  }
};

module.exports = setupIndexes;
