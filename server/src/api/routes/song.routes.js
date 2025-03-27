const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const songController = require('../controllers/song.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const { asyncHandler } = require('../../utils/api-response');
const limiters = require('../../middlewares/rate-limit.middleware');

// Validación para crear/actualizar canciones
const songValidation = [
  body('title')
    .notEmpty().withMessage('El título es obligatorio')
    .trim().isLength({ max: 100 }).withMessage('El título no puede exceder los 100 caracteres'),
  body('artist')
    .notEmpty().withMessage('El artista es obligatorio')
    .trim().isLength({ max: 100 }).withMessage('El artista no puede exceder los 100 caracteres'),
  body('code')
    .optional()
    .isInt({ min: 1, max: 9999 }).withMessage('El código debe ser un número entre 1 y 9999'),
  body('duration')
    .optional()
    .isInt({ min: 1 }).withMessage('La duración debe ser un número positivo'),
  body('genre')
    .optional()
    .isArray().withMessage('El género debe ser un array'),
  body('genre.*')
    .optional()
    .isString().withMessage('Cada género debe ser un texto'),
  body('language')
    .optional()
    .isString().withMessage('El idioma debe ser un texto'),
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`El año debe estar entre 1900 y ${new Date().getFullYear()}`),
  body('pdfUrl')
    .optional()
    .isURL().withMessage('La URL del PDF debe ser válida'),
  body('audioPreviewUrl')
    .optional()
    .isURL().withMessage('La URL de la vista previa debe ser válida')
];

// Validación para las consultas de búsqueda
const searchValidation = [
  query('q')
    .notEmpty().withMessage('El término de búsqueda es obligatorio')
    .isLength({ min: 2 }).withMessage('El término de búsqueda debe tener al menos 2 caracteres'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('El límite debe ser un número entre 1 y 50')
    .toInt()
];

// Validación para las consultas de listado
const listValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número positivo')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('El límite debe ser un número entre 1 y 50')
    .toInt(),
  query('sort')
    .optional()
    .isIn(['title', 'artist', 'year', 'duration']).withMessage('Ordenamiento no válido'),
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Orden no válido')
];

// Validación para parámetros de ID
const idValidation = [
  param('id')
    .isMongoId().withMessage('ID de canción no válido')
];

// Validación para código de canción
const codeValidation = [
  param('code')
    .isInt({ min: 1, max: 9999 }).withMessage('El código debe ser un número entre 1 y 9999')
    .toInt()
];

// Rutas
router.post(
  '/',
  protect,
  authorize('admin'),
  songValidation,
  asyncHandler(songController.createSong)
);

router.get(
  '/',
  listValidation,
  asyncHandler(songController.getSongs)
);

router.get(
  '/search',
  limiters.search,
  searchValidation,
  asyncHandler(songController.searchSongs)
);

router.get(
  '/code/:code',
  codeValidation,
  asyncHandler(songController.getSongByCode)
);

router.get(
  '/:id',
  idValidation,
  asyncHandler(songController.getSongById)
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  idValidation,
  songValidation,
  asyncHandler(songController.updateSong)
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  idValidation,
  asyncHandler(songController.deleteSong)
);

module.exports = router;
