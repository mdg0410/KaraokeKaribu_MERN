const jwt = require('jsonwebtoken');
const redisService = require('../services/redis.service');

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
    return res.status(401).json({
      success: false,
      message: 'No está autorizado para acceder a este recurso'
    });
  }

  try {
    // Verificar si el token está en la blacklist
    const isBlacklisted = await redisService.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token revocado, por favor inicie sesión nuevamente'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Añadir el usuario decodificado al request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No está autorizado para acceder a este recurso'
    });
  }
};

/**
 * Middleware para verificar roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
    }

    next();
  };
};
