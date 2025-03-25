# Karaoke Karibu

Karaoke Karibu es una aplicación web que permite a los usuarios disfrutar de sesiones de karaoke en línea. Este proyecto está estructurado utilizando el stack MERN (MongoDB, Express, React, Node.js) y está diseñado para ser modular y escalable.

## Estructura del Proyecto

El proyecto está organizado en varias carpetas para separar las diferentes partes de la aplicación:

- **client/**: Contiene el frontend de la aplicación, construido con React.
- **server/**: Contiene el backend de la aplicación, construido con Express y MongoDB.
- **shared/**: Contiene código y configuraciones compartidas entre el frontend y el backend.
- **infrastructure/**: Contiene archivos relacionados con DevOps, como Dockerfiles y scripts de orquestación.

## Instalación

Para instalar y ejecutar el proyecto, sigue estos pasos:

1. Clona el repositorio:
   ```
   git clone https://github.com/tu_usuario/karaoke-karibu.git
   cd karaoke-karibu
   ```

2. Instala las dependencias del frontend:
   ```
   cd client
   npm install
   ```

3. Instala las dependencias del backend:
   ```
   cd ../server
   npm install
   ```

4. Configura las variables de entorno:
   - Crea un archivo `.env` en la carpeta `server/` y define las variables necesarias (por ejemplo, `MONGO_URL`, `REDIS_URL`, etc.).

5. Inicia el servidor backend:
   ```
   cd server
   node src/index.js
   ```

6. Inicia el frontend:
   ```
   cd client
   npm start
   ```

## Uso

Una vez que el servidor y el cliente estén en funcionamiento, puedes acceder a la aplicación a través de tu navegador en `http://localhost:3000`.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir a este proyecto, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.