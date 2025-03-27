const socketIO = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('redis');

// Mapa para seguimiento de conexiones activas
const activeConnections = new Map();

let io;

/**
 * Inicializa Socket.IO con el servidor HTTP
 * @param {Object} server - Servidor HTTP/HTTPS
 */
exports.initSocket = (server) => {
  // Opciones para Socket.IO
  const options = {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // Timeout más bajo para detectar conexiones muertas más rápido
    maxHttpBufferSize: 5e6 // Limitar el tamaño del buffer para prevenir ataques DoS
  };

  io = socketIO(server, options);

  // Configurar Redis como adaptador para escalabilidad (si está configurado)
  if (process.env.REDIS_URL) {
    const pubClient = redis.createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO: Redis adapter configured');
    });
  }

  // Middleware de autenticación para Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    // Aquí puedes verificar el token JWT
    // jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { ... });
    
    // Para este ejemplo, simplemente pasamos
    next();
  });

  // Manejo de conexiones
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Guardar la conexión con timestamp
    activeConnections.set(socket.id, {
      connectedAt: new Date(),
      userId: socket.handshake.auth.userId || 'anonymous'
    });
    
    // Informar al cliente que está conectado
    socket.emit('connection_established', { id: socket.id });
    
    // Unir el socket a salas según su perfil
    if (socket.handshake.auth.role === 'admin') {
      socket.join('admins');
    }
    
    // Manejar eventos específicos
    socket.on('join_table', (tableId) => {
      if (tableId) socket.join(`table:${tableId}`);
    });
    
    socket.on('leave_table', (tableId) => {
      if (tableId) socket.leave(`table:${tableId}`);
    });
    
    // Manejo de desconexiones - IMPORTANTE para evitar memory leaks
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
      
      // Limpiar cualquier estado o timeouts asociados con este socket
      activeConnections.delete(socket.id);
      
      // Notificar a otros usuarios si es necesario (por ejemplo, en una app de chat)
      // io.to('some_room').emit('user_disconnected', { userId: socket.handshake.auth.userId });
    });
    
    // Limpiar explícitamente listeners al desconectar para evitar memory leaks
    socket.on('disconnecting', () => {
      socket.removeAllListeners();
    });
  });

  // Programar limpieza periódica de conexiones antiguas
  setInterval(() => {
    const now = new Date();
    for (const [socketId, connection] of activeConnections.entries()) {
      // Limpiar conexiones de más de 12 horas
      if (now - connection.connectedAt > 12 * 60 * 60 * 1000) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          console.log(`Cleaning up old connection: ${socketId}`);
          socket.disconnect(true);
        }
        activeConnections.delete(socketId);
      }
    }
  }, 30 * 60 * 1000); // Cada 30 minutos
};

/**
 * Emite un evento a todos los clientes conectados
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
exports.emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Emite un evento a una sala específica
 * @param {string} room - Nombre de la sala
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
exports.emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

/**
 * Emite un evento a un cliente específico
 * @param {string} socketId - ID del socket
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
exports.emitToClient = (socketId, event, data) => {
  if (io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }
};

/**
 * Cierra correctamente todas las conexiones Socket.IO
 */
exports.close = () => {
  if (io) {
    io.close();
    console.log('Socket.IO server closed');
  }
};

module.exports.io = io;
