const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/db');
const setupIndexes = require('./config/db-indexes');
const { errorHandler } = require('./utils/api-response');
const { redirectToHttps } = require('./config/https');
const limiters = require('./middlewares/rate-limit.middleware');

// Rutas
const routes = require('./api/routes');

// Inicializar express
const app = express();

// Conectar a la base de datos
connectDB();

// Configurar índices después de conectar a la base de datos
setupIndexes().catch(console.error);

// Middlewares
app.use(helmet()); // Seguridad HTTP
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '1mb' })); // Parseo de JSON con límite
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Middleware para redirigir a HTTPS en producción
app.use(redirectToHttps);

// Aplicar rate limiters globales a ciertos endpoints
app.use('/api/auth', limiters.auth);
app.use('/api/songs/search', limiters.search);

// Rutas de la API
app.use('/api', routes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ 
    message: 'KaraokeKaribu API - Servidor activo',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de manejo global de errores
app.use(errorHandler);

module.exports = app;
