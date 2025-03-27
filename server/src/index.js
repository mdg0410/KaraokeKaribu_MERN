const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const redisManager = require('./utils/redisManager');
const { errorHandler } = require('./middlewares/error.middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const http = require('http');
const socketManager = require('./utils/socketManager');

// Cargar variables de entorno
const result = dotenv.config();
if (result.error) {
  console.error('Error al cargar el archivo .env:', result.error);
}

// Verificar variables críticas
if (!process.env.JWT_SECRET) {
  console.error('ADVERTENCIA: JWT_SECRET no está definido. La autenticación no funcionará correctamente.');
  // En producción, podrías querer detener el servidor aquí con process.exit(1)
}

// Definir PORT antes de usarlo en la configuración de Swagger
const PORT = process.env.PORT || 5000;

// Importar rutas
const authRoutes = require('./api/routes/auth.routes');
const orderRoutes = require('./api/routes/order.routes');
const tableRoutes = require('./api/routes/table.routes');
const songRoutes = require('./api/routes/song.routes');
const productRoutes = require('./api/routes/product.routes');

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Karaoke Karibu API',
      version: '1.0.0',
      description: 'API RESTful para la aplicación Karaoke Karibu',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'info@karaokekaribu.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/api/routes/*.js', './src/api/routes/api.docs.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const app = express();

// Middleware
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.IO
socketManager.init(server);

// Inicializar servicios
const initServices = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Inicializar Redis (con manejo de errores interno)
    await redisManager.init();
    
    // Iniciar el servidor
    server.listen(PORT, () => {
      console.log(`Servidor en ejecución en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error crítico de inicialización:', err);
    process.exit(1);
  }
};

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/products', productRoutes);

// Añadir la ruta de health check (sin autenticación)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'El servidor está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal
app.get('/', (req, res) => {
    res.send('Welcome to the Karaoke Karibu API');
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Middleware centralizado para manejo de errores
app.use(errorHandler);

// Iniciar servicios
initServices();