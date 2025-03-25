const { getRedisClient } = require('../config/redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.useMemoryFallback = false;
    this.memoryBlacklist = new Map(); // Fallback en memoria si Redis no está disponible
  }

  async connect() {
    if (this.isConnected) return true;
    
    try {
      this.client = getRedisClient();
      
      if (!this.client) {
        console.log('Usando implementación en memoria para tokens revocados (sin Redis)');
        this.useMemoryFallback = true;
        this.isConnected = true;
        return true;
      }

      try {
        await this.client.connect();
        this.isConnected = true;
        console.log('Redis service conectado correctamente');
        return true;
      } catch (error) {
        console.error('Error al conectar a Redis:', error.message);
        console.log('Usando implementación en memoria para tokens revocados');
        this.client = null;
        this.useMemoryFallback = true;
        this.isConnected = true;
        return true;
      }
    } catch (error) {
      console.error('Error general en servicio Redis:', error.message);
      this.useMemoryFallback = true;
      this.isConnected = true;
      return true; // Retornamos true para no interrumpir el inicio de la aplicación
    }
  }

  async addToBlacklist(token, expiryInSeconds) {
    if (!this.isConnected) await this.connect();
    
    try {
      if (this.useMemoryFallback) {
        const expiryTime = Date.now() + (expiryInSeconds * 1000);
        this.memoryBlacklist.set(token, expiryTime);
        
        // Configurar un timeout para eliminar el token de la blacklist cuando expire
        setTimeout(() => {
          this.memoryBlacklist.delete(token);
        }, expiryInSeconds * 1000);
        
        return true;
      }
      
      await this.client.set(`blacklist:${token}`, 'revoked', {
        EX: expiryInSeconds
      });
      return true;
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      return false;
    }
  }

  async isBlacklisted(token) {
    if (!this.isConnected) await this.connect();
    
    try {
      if (this.useMemoryFallback) {
        const expiryTime = this.memoryBlacklist.get(token);
        if (!expiryTime) return false;
        
        // Verificar si el token ha expirado
        if (Date.now() > expiryTime) {
          this.memoryBlacklist.delete(token);
          return false;
        }
        
        return true;
      }
      
      const result = await this.client.get(`blacklist:${token}`);
      return result === 'revoked';
    } catch (error) {
      console.error('Error checking token in blacklist:', error);
      return false;
    }
  }
}

module.exports = new RedisService();
