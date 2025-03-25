const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Middleware de validación para crear/actualizar mesas
const tableValidation = [
  body('number')
    .optional()
    .isInt({ min: 1 }).withMessage('El número de mesa debe ser mayor a 0'),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('La capacidad debe ser al menos 1 persona'),
  body('location')
    .optional()
    .isString().withMessage('La ubicación debe ser un texto'),
  body('status')
    .optional()
    .isIn(['free', 'occupied', 'reserved', 'maintenance'])
    .withMessage('Estado de mesa inválido')
];

// Rutas para mesas
router.post(
  '/',
  protect,
  authorize('admin'),
  tableValidation,
  tableController.createTable
);

router.get(
  '/',
  protect,
  tableController.getTables
);

router.get(
  '/:id',
  protect,
  tableController.getTableById
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  tableValidation,
  tableController.updateTable
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  tableController.deleteTable
);

module.exports = router;
