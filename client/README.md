# Karaoke Karibu - Frontend

Este proyecto contiene el frontend para la aplicación Karaoke Karibu, desarrollado con React, TypeScript y Vite.

## Tecnologías utilizadas

- React + TypeScript
- Vite como bundler
- Redux Toolkit para manejo de estado
- React Router para navegación
- TailwindCSS para estilos
- Axios para peticiones HTTP

## Estructura del proyecto

```
client/
  ├── public/          # Activos estáticos y archivos públicos
  ├── src/             # Código fuente
  │   ├── components/  # Componentes reutilizables
  │   ├── hooks/       # Hooks personalizados
  │   ├── pages/       # Componentes de página/ruta
  │   ├── services/    # Servicios para API y lógica de negocio
  │   ├── state/       # Estado global con Redux
  │   ├── utils/       # Utilidades y funciones auxiliares
  │   ├── App.tsx      # Componente principal
  │   └── main.tsx     # Punto de entrada
  ├── index.html       # HTML base
  ├── tailwind.config.js # Configuración de Tailwind
  └── vite.config.ts   # Configuración de Vite
```

## Instalación

1. Clona el repositorio
2. Navega a la carpeta `client`
3. Instala las dependencias:

```bash
npm install
```

4. Crea un archivo `.env` basado en `.env.example` y configura las variables de entorno:

```
VITE_API_URL=http://localhost:5000/api
```

## Comandos disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción localmente
- `npm run lint` - Ejecuta el linter para encontrar problemas en el código

## Convenciones de código

Este proyecto usa ESLint y Prettier para mantener un estilo de código consistente. Por favor, asegúrate de que tu editor esté configurado para usar estos archivos de configuración.
