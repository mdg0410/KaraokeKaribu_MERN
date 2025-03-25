# Karaoke Karibu - Backend Documentation

## Introducción

Karaoke Karibu es una aplicación que permite a los usuarios disfrutar de una experiencia de karaoke en línea. Este documento proporciona información sobre la configuración y el uso del backend de la aplicación.

## Estructura del Proyecto

El backend está construido utilizando Node.js y Express, y se organiza de la siguiente manera:

```
server/
├── src/
│   ├── api/
│   │   ├── routes/         # Definiciones de las rutas de la API
│   │   └── controllers/    # Controladores que manejan la lógica de las rutas
│   ├── models/             # Modelos de datos para la base de datos
│   ├── services/           # Lógica de negocio del backend
│   ├── middlewares/        # Middlewares de Express
│   ├── config/             # Configuraciones específicas (ej. conexión a la base de datos)
│   └── index.js            # Punto de entrada del backend
├── package.json             # Configuración de npm para el backend
```

## Instalación

Para instalar las dependencias del backend, navega a la carpeta `server` y ejecuta:

```
npm install
```

## Configuración

Antes de ejecutar la aplicación, asegúrate de configurar las variables de entorno necesarias. Crea un archivo `.env` en la carpeta `server` y define las siguientes variables:

```
MONGO_URL=<tu_url_de_mongodb>
PORT=<puerto_en_el_que_ejecutar>
JWT_SECRET=<clave_secreta_para_jwt>
```

## Ejecución

Para iniciar el servidor, ejecuta el siguiente comando en la carpeta `server`:

```
npm start
```

Esto iniciará la aplicación en el puerto especificado en las variables de entorno.

## Pruebas

Para verificar que el backend está funcionando correctamente, puedes realizar las siguientes pruebas:

### Pruebas manuales con Postman o cURL

A continuación, se presentan algunos ejemplos de cómo probar las principales rutas de la API:

#### Autenticación

1. Registrar un nuevo usuario:
```
POST http://localhost:5000/api/auth/register
Body: {
  "username": "usuario_prueba",
  "email": "usuario@test.com",
  "password": "contraseña123"
}
```

2. Iniciar sesión:
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "usuario@test.com",
  "password": "contraseña123"
}
```
Guarda el token JWT recibido para usarlo en las siguientes solicitudes.

#### Productos

1. Crear un nuevo producto (requiere autenticación de administrador):
```
POST http://localhost:5000/api/products
Headers: Authorization: Bearer <tu_token_jwt>
Body: {
  "name": "Cerveza",
  "description": "Cerveza nacional",
  "price": 4.50,
  "category": "bebidas",
  "stock": 50
}
```

2. Obtener todos los productos:
```
GET http://localhost:5000/api/products
```

#### Canciones

1. Buscar canciones:
```
GET http://localhost:5000/api/songs/search?query=despacito
```

2. Obtener todas las canciones:
```
GET http://localhost:5000/api/songs
```

### Pruebas automatizadas

El proyecto incluye pruebas unitarias e integración. Para ejecutarlas:

```
npm test
```

Para ejecutar pruebas específicas:

```
npm test -- --grep "Auth API"  # Ejecuta solo las pruebas de autenticación
```

### Verificación de estado del servidor

Para comprobar que el servidor está funcionando correctamente:

```
GET http://localhost:5000/api/health
```

Debería devolver un estado 200 y un mensaje indicando que el servidor está en funcionamiento.

## Rutas de la API

### Autenticación

- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener información del usuario actual

### Pedidos (Orders)

- `POST /api/orders` - Crear un nuevo pedido
- `GET /api/orders` - Obtener todos los pedidos
- `GET /api/orders/:id` - Obtener un pedido específico
- `PUT /api/orders/:id` - Actualizar un pedido
- `DELETE /api/orders/:id` - Eliminar un pedido

### Mesas (Tables)

- `POST /api/tables` - Crear una nueva mesa
- `GET /api/tables` - Obtener todas las mesas
- `GET /api/tables/:id` - Obtener una mesa específica
- `PUT /api/tables/:id` - Actualizar una mesa
- `DELETE /api/tables/:id` - Eliminar una mesa

### Canciones (Songs)

- `POST /api/songs` - Crear una nueva canción
- `GET /api/songs` - Obtener todas las canciones
- `GET /api/songs/search` - Buscar canciones
- `GET /api/songs/:id` - Obtener una canción específica
- `PUT /api/songs/:id` - Actualizar una canción
- `DELETE /api/songs/:id` - Eliminar una canción

### Productos (Products)

- `POST /api/products` - Crear un nuevo producto
- `GET /api/products` - Obtener todos los productos
- `GET /api/products/inventory/report` - Generar informe de inventario
- `GET /api/products/:id` - Obtener un producto específico
- `PUT /api/products/:id` - Actualizar un producto
- `PATCH /api/products/:id/stock` - Actualizar el stock de un producto
- `DELETE /api/products/:id` - Eliminar un producto

## Autenticación y Autorización

La mayoría de los endpoints requieren autenticación mediante token JWT. Para acceder a estos endpoints, incluye el token en el encabezado de la solicitud:

```
Authorization: Bearer <tu_token_jwt>
```

Algunos endpoints también requieren roles específicos (como 'admin') para acceder a ellos.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir al proyecto, por favor abre un issue o un pull request en el repositorio.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.