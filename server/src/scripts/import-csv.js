/**
 * Script para importar canciones desde un archivo CSV
 * 
 * Uso: node src/scripts/import-csv.js <ruta-del-archivo-csv>
 * 
 * Ejemplo: node src/scripts/import-csv.js ./tabula-ListadoCompletoEcuakaraoke.csv
 */

require('dotenv').config();
const mongoose = require('mongoose');
const csvService = require('../services/csv.service');
const path = require('path');

// Validar argumentos
if (process.argv.length < 3) {
  console.error('Uso: node src/scripts/import-csv.js <ruta-del-archivo-csv>');
  process.exit(1);
}

// Función para actualizar la barra de progreso
function updateProgressBar(progress, total) {
  const barLength = 30;
  const filledLength = Math.round(barLength * progress / total);
  const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
  const percentage = Math.round(100 * progress / total);
  process.stdout.write(`\r[${bar}] ${percentage}% | ${progress}/${total}`);
}

// Función para mostrar el progreso de importación
function progressCallback(data) {
  const { stage, message, progress, total, percentage, stats, timing, error } = data;
  
  // Limpiar línea actual
  process.stdout.clearLine ? process.stdout.clearLine() : null;
  process.stdout.cursorTo ? process.stdout.cursorTo(0) : null;
  
  switch (stage) {
    case 'starting':
      console.log('🚀 ' + message);
      break;
      
    case 'parsing':
      if (progress && total) {
        updateProgressBar(progress, total);
      } else {
        console.log('📄 ' + message);
      }
      break;
      
    case 'importing':
      if (progress && total) {
        updateProgressBar(progress, total);
        if (timing) {
          process.stdout.write(` | Transcurrido: ${timing.elapsed} | Restante: ${timing.remaining}`);
        }
        if (stats) {
          process.stdout.write(` | Añadidas: ${stats.imported} | Actualizadas: ${stats.updated} | Errores: ${stats.errors}`);
        }
      } else {
        console.log('💾 ' + message);
      }
      break;
      
    case 'error':
      console.error('\n❌ Error: ' + message);
      if (error) console.error('   Detalle: ' + error);
      break;
      
    case 'completed':
      console.log('\n✅ ' + message);
      if (timing) console.log(`   Tiempo total: ${timing.total}`);
      if (stats) {
        console.log('   Resumen:');
        console.log(`   - Total de registros: ${stats.total}`);
        console.log(`   - Canciones importadas: ${stats.imported}`);
        console.log(`   - Canciones actualizadas: ${stats.updated}`);
        console.log(`   - Errores: ${stats.errors}`);
      }
      break;
      
    default:
      console.log(message);
  }
}

// Obtener la ruta del archivo CSV
const filePath = path.resolve(process.argv[2]);

// Validar que el archivo existe antes de continuar
if (!require('fs').existsSync(filePath)) {
  console.error(`\n❌ Error: El archivo ${filePath} no existe`);
  process.exit(1);
}

console.log(`\n📂 Archivo a importar: ${filePath}`);
console.log('⏳ Iniciando importación...\n');

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conexión a MongoDB establecida');
    
    // Importar canciones con seguimiento de progreso
    return csvService.importSongsFromCSV(filePath, progressCallback);
  })
  .then((results) => {
    // El resumen ya se muestra en progressCallback
    if (results.errors > 0) {
      console.log('\n⚠️ Detalles de errores:');
      results.errorDetails.forEach((detail, index) => {
        console.log(`\n   Error ${index + 1}:`);
        console.log(`   - Canción: ${detail.song.title} - ${detail.song.artist}`);
        console.log(`   - Error: ${detail.error}`);
      });
    }
    
    // Cerrar conexión
    mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
  })
  .catch((error) => {
    console.error('\n❌ Error crítico:', error);
    mongoose.connection.close();
    process.exit(1);
  });

// Mostrar información de diagnóstico si se presiona Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🔍 Diagnóstico:');
  console.log('- La importación puede tardar dependiendo del tamaño del archivo y la velocidad de conexión a la base de datos');
  console.log('- Si estás viendo este mensaje, el script estaba en ejecución pero ha sido interrumpido');
  console.log('- Algunas canciones podrían haberse importado parcialmente');
  
  mongoose.connection.close();
  console.log('\n👋 Conexión a MongoDB cerrada');
  process.exit(0);
});
