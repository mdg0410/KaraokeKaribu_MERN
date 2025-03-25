const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const redisService = require('../../services/redis.service');

/**
 * Registrar un nuevo usuario
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si el nombre de usuario ya existe
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear el usuario
    user = await User.create({
      username,
      email,
      passwordHash
    });

    // Generar token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Iniciar sesión
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si la contraseña coincide
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Cerrar sesión
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token);
    
    // Calcular el tiempo de expiración restante
    const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);
    
    // Añadir el token a la blacklist
    await redisService.addToBlacklist(token, expiryTime > 0 ? expiryTime : 3600);

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Obtener información del usuario actual
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Función para generar token JWT
 */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    console.error('ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno');
    throw new Error('Error de configuración del servidor: JWT_SECRET no definido');
  }

  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};
