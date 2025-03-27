const jwt = require('jsonwebtoken');
const redisManager = require('../utils/redisManager');

/**
 * Middleware para proteger rutas que requieren autenticación
 */
exports.protect = async (req, res, next) => {
  try {
    // Verificar que exista un token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado, token no proporcionado'
      });
    }

    // Verificar si el token está en la lista negra (fue invalidado)
    const isBlacklisted = await redisManager.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o caducado'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Agregar el usuario al objeto de solicitud
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 * @param {...string} roles - Roles permitidos
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        message: 'Prohibido: no tiene permisos para acceder a este recurso'
      });
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRole = req.user.roles.some(role => roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Prohibido: rol insuficiente para acceder a este recurso'
      });
    }

    next();
  };
};
