const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Crear cliente Redis si está configurado
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: attempts => Math.min(attempts * 100, 3000)
    }
  });
  
  redisClient.connect().catch(console.error);
  
  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });
}

// Límites según el tipo de ruta
const limiters = {
  // Para rutas de autenticación (más restrictivo)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
      success: false, 
      message: 'Demasiados intentos de autenticación. Por favor inténtalo más tarde.' 
    },
    store: process.env.REDIS_URL ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:auth:'
    }) : undefined
  }),
  
  // Para rutas de API general
  api: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 100, // 100 solicitudes por ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
      success: false, 
      message: 'Demasiadas solicitudes. Por favor inténtalo más tarde.' 
    },
    store: process.env.REDIS_URL ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:api:'
    }) : undefined
  }),
  
  // Para búsquedas (más permisivo pero aún limitado)
  search: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 búsquedas por minuto
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
      success: false, 
      message: 'Demasiadas búsquedas. Por favor inténtalo más tarde.' 
    },
    store: process.env.REDIS_URL ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:search:'
    }) : undefined
  })
};

module.exports = limiters;
