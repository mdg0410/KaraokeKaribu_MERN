const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const songController = require('../controllers/song.controller');
const csvController = require('../controllers/csv.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Middleware de validación para crear/actualizar canciones
const songValidation = [
  body('title')
    .optional()
    .notEmpty().withMessage('El título es requerido')
    .isString().withMessage('El título debe ser un texto'),
  body('artist')
    .optional()
    .notEmpty().withMessage('El artista es requerido')
    .isString().withMessage('El artista debe ser un texto'),
  body('code')
    .optional()
    .isInt({ min: 1, max: 8000 }).withMessage('El código debe ser un número entre 1 y 8000'),
  body('duration')
    .optional()
    .isInt({ min: 1 }).withMessage('La duración debe ser mayor a 0 segundos'),
  body('genre')
    .optional()
    .isArray().withMessage('Los géneros deben ser un array'),
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
    .isURL().withMessage('La URL del audio debe ser válida')
];

// Rutas para canciones
router.post(
  '/',
  protect,
  authorize('admin'),
  songValidation,
  songController.createSong
);

router.get(
  '/',
  songController.getSongs
);

router.get(
  '/search',
  songController.searchSongs
);

router.get(
  '/code/:code',
  songController.getSongByCode
);

router.get(
  '/:id',
  songController.getSongById
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  songValidation,
  songController.updateSong
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  songController.deleteSong
);

// Ruta para importar canciones desde CSV
router.post(
  '/import-csv',
  protect,
  authorize('admin'),
  [
    body('filePath')
      .notEmpty().withMessage('La ruta del archivo CSV es requerida')
      .isString().withMessage('La ruta debe ser un texto')
  ],
  csvController.importSongsFromCSV
);

module.exports = router;
