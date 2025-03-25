/**
 * Middleware para manejar errores de forma centralizada
 */

// Clase personalizada para errores de la API
class ApiError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  // Errores de Mongoose - ID no válido
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = new ApiError(message, 404);
  }

  // Errores de Mongoose - Errores de validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ApiError('Error de validación', 400, message);
  }

  // Errores de Mongoose - Duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `El valor '${err.keyValue[field]}' para el campo ${field} ya está en uso`;
    error = new ApiError(message, 400);
  }

  // Respuesta
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error del servidor',
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  ApiError,
  errorHandler
};
