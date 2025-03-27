const fs = require('fs');
const path = require('path');
const https = require('https');
const selfsigned = require('selfsigned');

/**
 * Genera o carga certificados SSL para habilitar HTTPS
 * @returns {Object} Opciones HTTPS con certificados
 */
exports.getHttpsOptions = () => {
  const certPath = path.join(__dirname, '../../ssl/server.cert');
  const keyPath = path.join(__dirname, '../../ssl/server.key');
  
  // Si existen certificados, cargarlos
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('Using existing SSL certificates');
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
  }
  
  // Si no existen, generar certificados auto-firmados para desarrollo
  console.log('Generating self-signed SSL certificates for development');
  
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'organizationName', value: 'KaraokeKaribu Development' }
  ];
  
  const pems = selfsigned.generate(attrs, {
    days: 365,
    algorithm: 'sha256',
    keySize: 2048,
    extensions: [
      { name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }] }
    ]
  });
  
  // Crear directorio ssl si no existe
  const sslDir = path.join(__dirname, '../../ssl');
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
  }
  
  // Guardar certificados para uso futuro
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  
  return {
    cert: pems.cert,
    key: pems.private
  };
};

/**
 * Crea un servidor HTTPS
 * @param {Object} app - Aplicación Express
 * @returns {Object} Servidor HTTPS
 */
exports.createHttpsServer = (app) => {
  const httpsOptions = this.getHttpsOptions();
  return https.createServer(httpsOptions, app);
};

// Middleware para redirigir HTTP a HTTPS
exports.redirectToHttps = (req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};
