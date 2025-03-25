const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Middleware de validación para registro
const registerValidation = [
  body('username')
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Por favor ingrese un email válido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Middleware de validación para login
const loginValidation = [
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Por favor ingrese un email válido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
];

// Rutas de autenticación
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
