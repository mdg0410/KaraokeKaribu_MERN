const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const redisService = require('./services/redis.service');

// Cargar variables de entorno
const result = dotenv.config();
if (result.error) {
  console.error('Error al cargar el archivo .env:', result.error);
}

// Verificar variables críticas
if (!process.env.JWT_SECRET) {
  console.error('ADVERTENCIA: JWT_SECRET no está definido. La autenticación no funcionará correctamente.');
  // En producción, podrías querer detener el servidor aquí con process.exit(1)
}

// Importar rutas
const authRoutes = require('./api/routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Inicializar servicios
const initServices = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Conectar a Redis o usar fallback en memoria
    // Si falla, no interrumpirá el inicio de la aplicación
    try {
      await redisService.connect();
    } catch (error) {
      console.warn('Redis no disponible, usando implementación en memoria:', error.message);
    }
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error crítico de inicialización:', err);
    process.exit(1);
  }
};

// Rutas API
app.use('/api/auth', authRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.send('Welcome to the Karaoke Karibu API');
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servicios
initServices();