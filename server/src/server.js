const http = require('http');
const app = require('./app');
const { createHttpsServer } = require('./config/https');
const { initSocket } = require('./utils/socket');

// Variables de entorno
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Crear servidor HTTP o HTTPS
let server;
if (USE_HTTPS) {
  server = createHttpsServer(app);
} else {
  server = http.createServer(app);
}

// Inicializar Socket.IO con el servidor
initSocket(server);

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor ${USE_HTTPS ? 'HTTPS' : 'HTTP'} ejecutándose en modo ${NODE_ENV} en puerto ${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no controlado:', err);
});

// Manejo de cierre limpio
process.on('SIGINT', () => {
  console.log('Señal SIGINT recibida. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Señal SIGTERM recibida. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});
