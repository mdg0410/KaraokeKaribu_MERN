/**
 * Utilidad para estandarizar las respuestas de la API
 */

/**
 * Envía una respuesta exitosa
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Object|Array} data - Datos a enviar
 * @param {Object} options - Opciones adicionales (status, message, pagination)
 * @returns {Object} Respuesta HTTP JSON
 */
exports.success = (res, data = null, options = {}) => {
  const { status = 200, message = null, pagination = null } = options;
  
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    message: message
  };
  
  // Solo incluir datos si no son null
  if (data !== null) {
    response.data = data;
  }
  
  // Solo incluir paginación si se proporciona
  if (pagination) {
    response.pagination = pagination;
  }
  
  return res.status(status).json(response);
};

/**
 * Envía una respuesta de error
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de error
 * @param {Object} options - Opciones adicionales (status, errors)
 * @returns {Object} Respuesta HTTP JSON
 */
exports.error = (res, message = 'Error del servidor', options = {}) => {
  const { status = 500, errors = null, code = null } = options;
  
  const response = {
    success: false,
    timestamp: new Date().toISOString(),
    message
  };
  
  // Solo incluir errores detallados si se proporcionan
  if (errors) {
    response.errors = errors;
  }
  
  // Incluir código de error si se proporciona
  if (code) {
    response.code = code;
  }
  
  return res.status(status).json(response);
};

/**
 * Middleware para manejar errores y dar formato estándar
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.name, err.message);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error del servidor';
  let errors = err.errors || null;
  
  // Manejar errores específicos de Mongoose/MongoDB
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) { // Duplicate key error
      statusCode = 409;
      message = 'Ya existe un registro con ese valor';
      const field = Object.keys(err.keyValue)[0];
      errors = [{
        field,
        message: `Ya existe un registro con este ${field}`
      }];
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Formato de datos inválido';
    errors = [{
      field: err.path,
      message: `Valor inválido para ${err.path}`
    }];
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }
  
  return res.status(statusCode).json({
    success: false,
    timestamp: new Date().toISOString(),
    message,
    errors,
    code: err.code
  });
};

/**
 * Wrap para controladores asíncronos que captura excepciones automáticamente
 * @param {Function} fn - Función controladora asíncrona
 * @returns {Function} Función controladora con manejo de excepciones
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
