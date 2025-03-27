# KaraokeKaribu - Sistema de Gestión para Karaoke

KaraokeKaribu es una aplicación completa para la gestión de un negocio de karaoke, incluyendo:
- Gestión de mesas y pedidos
- Catálogo de canciones con búsqueda avanzada
- Inventario de productos
- Sistema de usuarios con diferentes roles
- Actualizaciones en tiempo real

## Tecnologías principales

- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Frontend**: React, Redux, Material-UI
- **Seguridad**: JWT, HTTPS, validación de datos
- **Tiempo real**: Socket.IO con adaptador Redis para escalabilidad

## Instalación y configuración

### Requisitos previos

- Node.js (v14 o superior)
- MongoDB (v4 o superior)
- Redis (opcional, para Socket.IO en cluster y rate limiting)

### Configuración del backend

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/usuario/KaraokeKaribu_MERN.git
   cd KaraokeKaribu_MERN/server
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear archivo `.env` en la carpeta server con las siguientes variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/karaokekaribu
   JWT_SECRET=tu_clave_secreta_aqui
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   USE_HTTPS=false
   REDIS_URL=redis://localhost:6379    # Opcional
   ATLAS_SEARCH_ENABLED=false          # Activar para usar MongoDB Atlas Search
   ```

4. Iniciar el servidor:
   ```bash
   npm run dev
   ```

5. Para producción:
   ```bash
   npm start
   ```

## Documentación de API

El backend de KaraokeKaribu ofrece una API RESTful para todas las operaciones del sistema.

### Autenticación

#### Registro de usuario