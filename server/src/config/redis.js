/**
 * Configuración de conexión a Redis
 */
const getRedisClient = () => {
  let redis;
  try {
    redis = require('redis');
  } catch (error) {
    console.warn('Módulo Redis no encontrado. Funcionando sin Redis.');
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Si estamos en un entorno de desarrollo y no se ha configurado REDIS_URL específicamente
    // usamos directamente el fallback en memoria
    if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
      console.warn('Omitiendo conexión a Redis en entorno de desarrollo. Usando fallback en memoria.');
      return null;
    }
    
    const client = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000, // 5 segundos de timeout para la conexión
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn(`Redis: máximo número de reintentos (${retries}) alcanzado. Usando fallback en memoria.`);
            return null; // Dejar de reintentar después de 3 intentos
          }
          return Math.min(retries * 100, 3000); // Aumentar tiempo entre reintentos
        }
      }
    });

    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('Redis conectado correctamente');
    });

    return client;
  } catch (error) {
    console.warn('Error al configurar Redis. Usando fallback en memoria:', error.message);
    return null;
  }
};

module.exports = {
  getRedisClient
};
