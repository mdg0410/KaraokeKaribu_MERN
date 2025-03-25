const fs = require('fs');
const path = require('path');

// Función para crear directorios de forma recursiva
function createDirectories(baseDir, structure) {
  Object.keys(structure).forEach(dir => {
    const currentDir = path.join(baseDir, dir);
    
    // Crear directorio actual
    if (!fs.existsSync(currentDir)) {
      fs.mkdirSync(currentDir, { recursive: true });
      console.log(`Directorio creado: ${currentDir}`);
    }
    
    // Si hay subdirectorios, crearlos de forma recursiva
    if (structure[dir] && typeof structure[dir] === 'object') {
      createDirectories(currentDir, structure[dir]);
    }
  });
}

// Estructura completa del proyecto
const projectStructure = {
  client: {
    src: {
      components: {},
      hooks: {},
      pages: {},
      services: {},
      state: {}
    },
    public: {}
  },
  server: {
    src: {
      api: {},
      models: {},
      services: {},
      middlewares: {},
      config: {}
    }
  },
  shared: {
    utils: {},
    types: {},
    constants: {}
  },
  infrastructure: {
    docker: {},
    'ci-cd': {},
    scripts: {}
  }
};

// Crear la estructura de directorios
const rootDir = process.cwd();
createDirectories(rootDir, projectStructure);

console.log('\n✅ Estructura de carpetas creada con éxito.');