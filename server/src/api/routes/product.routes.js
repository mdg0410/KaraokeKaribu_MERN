const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Middleware de validación para crear/actualizar productos
const productValidation = [
  body('name')
    .optional()
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser un texto'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser mayor o igual a 0'),
  body('description')
    .optional()
    .isString().withMessage('La descripción debe ser un texto'),
  body('category')
    .optional()
    .isIn(['bebidas', 'comidas', 'snacks', 'otros'])
    .withMessage('Categoría inválida'),
  body('imageUrl')
    .optional()
    .isURL().withMessage('La URL de la imagen debe ser válida'),
  body('options')
    .optional()
    .isArray().withMessage('Las opciones deben ser un array')
];

// Middleware de validación para actualizar stock
const stockValidation = [
  body('quantity')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt().withMessage('La cantidad debe ser un número entero')
];

// Rutas para productos
router.post(
  '/',
  protect,
  authorize('admin', 'trabajador'),
  productValidation,
  productController.createProduct
);

router.get(
  '/',
  productController.getProducts
);

router.get(
  '/inventory/report',
  protect,
  authorize('admin'),
  productController.generateInventoryReport
);

router.get(
  '/:id',
  productController.getProductById
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  productValidation,
  productController.updateProduct
);

router.patch(
  '/:id/stock',
  protect,
  authorize('admin'),
  stockValidation,
  productController.updateStock
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  productController.deleteProduct
);

module.exports = router;
