const redis = require('redis');
let client;
let isDisabled = false;
let memoryCache = new Map();

/**
 * Inicializa la conexión con Redis
 */
async function init() {
  // Si Redis ya fue deshabilitado, no intentar reconectar
  if (isDisabled) {
    console.log('Redis está deshabilitado. Usando caché en memoria.');
    return;
  }

  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          // Limitar los reintentos para evitar bucles infinitos
          if (retries >= 3) {
            console.warn(`Demasiados intentos de reconexión a Redis (${retries}). Deshabilitando Redis.`);
            isDisabled = true;
            return false; // detener reintentos
          }
          // Esperar más tiempo entre cada reintento (exponential backoff)
          return Math.min(retries * 100, 3000); // máximo 3 segundos
        }
      }
    });

    client.on('error', (err) => {
      if (!isDisabled) {
        console.error('Error en Redis:', err.message);
      }
    });

    client.on('connect', () => {
      console.log('Conectado a Redis');
    });

    client.on('reconnecting', () => {
      console.log('Intentando reconectar a Redis...');
    });

    await client.connect();
  } catch (error) {
    console.error('Error al conectar con Redis. Usando caché en memoria:', error.message);
    isDisabled = true;
    client = null;
  }
}

// Funciones auxiliares para usar caché en memoria cuando Redis no está disponible
function getMemoryCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  
  // Verificar expiración
  if (item.expiry && item.expiry < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value;
}

function setMemoryCache(key, value, expirySeconds) {
  const expiry = expirySeconds ? Date.now() + (expirySeconds * 1000) : null;
  memoryCache.set(key, { value, expiry });
}

function deleteMemoryCache(key) {
  return memoryCache.delete(key);
}

function clearMemoryCacheByPattern(pattern) {
  const regex = new RegExp(pattern.replace('*', '.*'));
  let count = 0;
  
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      count++;
    }
  }
  
  return count;
}

/**
 * Guarda en caché los resultados de una búsqueda
 * @param {string} query - Consulta de búsqueda
 * @param {Array} results - Resultados de la búsqueda
 * @param {number} expirySeconds - Tiempo de expiración en segundos (por defecto 1 hora)
 */
async function cacheSearchResults(query, results, expirySeconds = 3600) {
  const key = `search:${query.toLowerCase()}`;
  
  if (client && !isDisabled) {
    try {
      await client.setEx(key, expirySeconds, JSON.stringify(results));
    } catch (error) {
      console.error('Error al guardar en caché Redis:', error.message);
      // Fallback a memoria
      setMemoryCache(key, JSON.stringify(results), expirySeconds);
    }
  } else {
    // Usar caché en memoria
    setMemoryCache(key, JSON.stringify(results), expirySeconds);
  }
}

/**
 * Obtiene resultados en caché para una consulta
 * @param {string} query - Consulta de búsqueda
 * @returns {Array|null} - Resultados en caché o null si no existen
 */
async function getCachedSearchResults(query) {
  const key = `search:${query.toLowerCase()}`;
  
  if (client && !isDisabled) {
    try {
      const cachedResults = await client.get(key);
      if (cachedResults) {
        return JSON.parse(cachedResults);
      }
    } catch (error) {
      console.error('Error al obtener de caché Redis:', error.message);
      // Fallback a memoria
      const memResult = getMemoryCache(key);
      return memResult ? JSON.parse(memResult) : null;
    }
  } else {
    // Usar caché en memoria
    const memResult = getMemoryCache(key);
    return memResult ? JSON.parse(memResult) : null;
  }
  
  return null;
}

/**
 * Invalida la caché cuando se actualizan las canciones
 */
async function invalidateSearchCache() {
  if (client && !isDisabled) {
    try {
      const keys = await client.keys('search:*');
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`Caché Redis invalidada: ${keys.length} entradas eliminadas`);
      }
    } catch (error) {
      console.error('Error al invalidar caché Redis:', error.message);
    }
  }
  
  // También limpiar caché en memoria
  const count = clearMemoryCacheByPattern('search:*');
  if (count > 0) {
    console.log(`Caché en memoria invalidada: ${count} entradas eliminadas`);
  }
}

/**
 * Almacena un token de usuario
 * @param {string} userId - ID del usuario
 * @param {string} token - Token JWT
 * @param {number} expirySeconds - Tiempo de expiración en segundos
 */
async function setToken(userId, token, expirySeconds = 86400) {
  const key = `token:${userId}`;
  
  if (client && !isDisabled) {
    try {
      await client.setEx(key, expirySeconds, token);
      return true;
    } catch (error) {
      console.error('Error al guardar token en Redis:', error.message);
      // Fallback a memoria
      setMemoryCache(key, token, expirySeconds);
      return true;
    }
  } else {
    // Usar caché en memoria
    setMemoryCache(key, token, expirySeconds);
    return true;
  }
}

/**
 * Obtiene un token almacenado para un usuario
 * @param {string} userId - ID del usuario
 * @returns {string|null} - Token JWT o null si no existe
 */
async function getToken(userId) {
  const key = `token:${userId}`;
  
  if (client && !isDisabled) {
    try {
      return await client.get(key);
    } catch (error) {
      console.error('Error al obtener token de Redis:', error.message);
      // Fallback a memoria
      return getMemoryCache(key);
    }
  } else {
    // Usar caché en memoria
    return getMemoryCache(key);
  }
}

/**
 * Elimina un token almacenado para un usuario
 * @param {string} userId - ID del usuario
 * @returns {boolean} - True si se eliminó correctamente
 */
async function deleteToken(userId) {
  const key = `token:${userId}`;
  
  if (client && !isDisabled) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar token de Redis:', error.message);
      // Fallback a memoria
      return deleteMemoryCache(key);
    }
  } else {
    // Usar caché en memoria
    return deleteMemoryCache(key);
  }
}

/**
 * Añade un token a la lista negra
 * @param {string} token - Token JWT para bloquear
 * @param {number} expirySeconds - Tiempo de expiración en segundos
 * @returns {boolean} - True si se añadió correctamente
 */
async function addToBlacklist(token, expirySeconds = 3600) {
  const key = `blacklist:${token}`;
  
  if (client && !isDisabled) {
    try {
      await client.setEx(key, expirySeconds, '1');
      return true;
    } catch (error) {
      console.error('Error al añadir token a la lista negra en Redis:', error.message);
      // Fallback a memoria
      setMemoryCache(key, '1', expirySeconds);
      return true;
    }
  } else {
    // Usar caché en memoria
    setMemoryCache(key, '1', expirySeconds);
    return true;
  }
}

/**
 * Verifica si un token está en la lista negra
 * @param {string} token - Token JWT para verificar
 * @returns {boolean} - True si el token está en la lista negra
 */
async function isTokenBlacklisted(token) {
  const key = `blacklist:${token}`;
  
  if (client && !isDisabled) {
    try {
      const result = await client.get(key);
      return result !== null;
    } catch (error) {
      console.error('Error al verificar token en lista negra Redis:', error.message);
      // Fallback a memoria
      return getMemoryCache(key) !== null;
    }
  } else {
    // Usar caché en memoria
    return getMemoryCache(key) !== null;
  }
}

module.exports = {
  init,
  cacheSearchResults,
  getCachedSearchResults,
  invalidateSearchCache,
  setToken,
  getToken,
  deleteToken,
  addToBlacklist,
  isTokenBlacklisted
};
