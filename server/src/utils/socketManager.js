const { Server } = require('socket.io');

let io;

/**
 * Inicializa Socket.IO con el servidor HTTP
 * @param {Object} server - Servidor HTTP de Express
 */
function init(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  console.log('Socket.IO inicializado');
  return io;
}

/**
 * Emite un evento cuando se actualizan las canciones
 * @param {Array} songs - Lista de canciones actualizadas
 */
function emitSongsUpdated(songs) {
  if (io) {
    io.emit('songsUpdated', { songs, timestamp: new Date() });
  }
}

module.exports = {
  init,
  emitSongsUpdated,
  getIO: () => io
};
