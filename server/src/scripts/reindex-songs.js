/**
 * Script para reindexar todas las canciones
 * 
 * Uso: node src/scripts/reindex-songs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Song = require('../models/Song');

console.log('\n🔄 REINDEXACIÓN DE CANCIONES PARA ATLAS SEARCH');
console.log('=============================================');

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Conexión a MongoDB establecida');
    
    try {
      // Contar canciones antes de actualizar
      const totalSongs = await Song.countDocuments();
      const indexedBefore = await Song.countDocuments({ indexed: true });
      
      console.log(`\n📊 Total de canciones: ${totalSongs}`);
      console.log(`📊 Canciones indexadas antes: ${indexedBefore}`);
      
      // Actualizar todas las canciones para marcarlas como indexadas
      const updateResult = await Song.updateMany(
        {}, // Todas las canciones
        { indexed: true } // Marcar como indexadas
      );
      
      // Contar canciones indexadas después de la actualización
      const indexedAfter = await Song.countDocuments({ indexed: true });
      
      console.log(`\n✅ Actualización completada:`);
      console.log(`- Documentos encontrados: ${updateResult.matchedCount}`);
      console.log(`- Documentos actualizados: ${updateResult.modifiedCount}`);
      console.log(`- Canciones indexadas después: ${indexedAfter}`);
      
      if (indexedAfter === totalSongs) {
        console.log('\n🟢 ÉXITO: Todas las canciones están ahora marcadas como indexadas.');
      } else {
        console.log('\n🟠 ADVERTENCIA: No todas las canciones pudieron ser marcadas como indexadas.');
      }
      
      console.log('\n⚠️ IMPORTANTE: Espere unos minutos para que Atlas Search actualice el índice');
      console.log('   después de marcar los documentos como indexados.');
      
    } catch (error) {
      console.error('\n❌ Error durante la reindexación:', error);
    } finally {
      // Cerrar conexión
      mongoose.connection.close();
      console.log('\n👋 Conexión a MongoDB cerrada');
    }
  })
  .catch((error) => {
    console.error('\n❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  });
