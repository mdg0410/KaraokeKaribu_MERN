const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Middleware de validación para crear/actualizar órdenes
const orderValidation = [
  body('tableId')
    .optional()
    .isMongoId().withMessage('ID de mesa inválido'),
  body('products')
    .optional()
    .isArray().withMessage('Los productos deben ser un array'),
  body('products.*.productId')
    .optional()
    .isMongoId().withMessage('ID de producto inválido'),
  body('products.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('songs')
    .optional()
    .isArray().withMessage('Las canciones deben ser un array'),
  body('songs.*')
    .optional()
    .isMongoId().withMessage('ID de canción inválido'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Estado de pedido inválido')
];

// Rutas para pedidos
router.post(
  '/',
  protect,
  orderValidation,
  orderController.createOrder
);

router.get(
  '/',
  protect,
  orderController.getOrders
);

router.get(
  '/:id',
  protect,
  orderController.getOrderById
);

router.put(
  '/:id',
  protect,
  orderValidation,
  orderController.updateOrder
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  orderController.deleteOrder
);

module.exports = router;
