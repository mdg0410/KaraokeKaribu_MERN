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
```

## Ejecución

Para iniciar el servidor, ejecuta el siguiente comando en la carpeta `server`:

```
npm start
```

Esto iniciará la aplicación en el puerto especificado en las variables de entorno.

## Rutas de la API

Las rutas de la API se definen en la carpeta `src/api/routes`. Cada ruta está asociada a un controlador que maneja la lógica correspondiente.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir al proyecto, por favor abre un issue o un pull request en el repositorio.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.