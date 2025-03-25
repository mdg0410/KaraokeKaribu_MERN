const jwt = require('jsonwebtoken');
const redisService = require('../services/redis.service');
const { ApiError } = require('./error.middleware');

/**
 * Middleware para verificar el token JWT
 */
exports.protect = async (req, res, next) => {
  let token;

  // Verificar si el token está en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar si el token existe
  if (!token) {
    return next(new ApiError('No está autorizado para acceder a este recurso', 401));
  }

  try {
    // Verificar si el token está en la blacklist
    const isBlacklisted = await redisService.isBlacklisted(token);
    if (isBlacklisted) {
      return next(new ApiError('Token revocado, por favor inicie sesión nuevamente', 401));
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Añadir el usuario decodificado al request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token expirado, por favor inicie sesión nuevamente', 401));
    }
    return next(new ApiError('No está autorizado para acceder a este recurso', 401));
  }
};

/**
 * Middleware para verificar roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('No está autenticado', 401));
    }

    // Soporte tanto para roles como string único o como array
    const userRoles = Array.isArray(req.user.roles) 
      ? req.user.roles 
      : req.user.role 
        ? [req.user.role] 
        : [];
    
    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRole = userRoles.some(role => roles.includes(role));
    
    if (!hasRole) {
      return next(
        new ApiError(
          `Rol ${userRoles.join(', ')} no autorizado para acceder a este recurso`,
          403
        )
      );
    }

    next();
  };
};
