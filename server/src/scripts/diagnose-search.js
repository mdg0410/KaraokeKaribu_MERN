/**
 * Script para diagnosticar problemas con Atlas Search
 * 
 * Uso: node src/scripts/diagnose-search.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Song = require('../models/Song');

console.log('\n🔍 DIAGNÓSTICO DE ATLAS SEARCH');
console.log('=================================');

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Conexión a MongoDB establecida');
    
    try {
      // 1. Verificar configuración del entorno
      console.log('\n📋 VERIFICACIÓN DE CONFIGURACIÓN:');
      console.log(`- Atlas Search habilitado en .env: ${process.env.ATLAS_SEARCH_ENABLED === 'true' ? '✓ SÍ' : '✗ NO'}`);
      console.log(`- Cadena de conexión MongoDB: ${process.env.MONGO_URI.substring(0, 25)}...`);
      
      // 2. Contar documentos en la colección songs
      const totalSongs = await Song.countDocuments();
      const indexedSongs = await Song.countDocuments({ indexed: true });
      
      console.log('\n📊 ESTADÍSTICAS DE DOCUMENTOS:');
      console.log(`- Total de canciones: ${totalSongs}`);
      console.log(`- Canciones indexadas: ${indexedSongs} (${Math.round((indexedSongs/totalSongs)*100)}%)`);
      
      // 3. Probar una búsqueda básica con regex (sin Atlas Search)
      const regexResults = await Song.find({ 
        title: { $regex: 'amor', $options: 'i' } 
      }).limit(5);
      
      console.log('\n🔎 PRUEBA DE BÚSQUEDA BÁSICA (REGEX):');
      console.log(`- Resultados encontrados: ${regexResults.length}`);
      if (regexResults.length > 0) {
        console.log('- Primer resultado: ', regexResults[0].title, ' - ', regexResults[0].artist);
      }
      
      // 4. Intentar una búsqueda simple con Atlas Search
      console.log('\n🔎 PRUEBA DE BÚSQUEDA CON ATLAS SEARCH:');
      try {
        const searchResults = await Song.aggregate([
          {
            $search: {
              index: 'Index_Songs',
              text: {
                query: 'amor',
                path: ['title', 'artist']
              }
            }
          },
          { $limit: 5 }
        ]);
        
        console.log(`- Resultados encontrados: ${searchResults.length}`);
        if (searchResults.length > 0) {
          console.log('- Primer resultado: ', searchResults[0].title, ' - ', searchResults[0].artist);
        } else {
          console.log('- No se encontraron resultados con Atlas Search');
        }
      } catch (error) {
        console.error('❌ Error en la consulta de Atlas Search:', error.message);
        console.log('   Esto puede indicar que el índice no existe o está mal configurado.');
      }
      
      // 5. Verificar la estructura del índice
      console.log('\n📝 PASOS PARA VERIFICAR EL ÍNDICE EN MONGODB ATLAS:');
      console.log('1. Inicie sesión en MongoDB Atlas (https://cloud.mongodb.com)');
      console.log('2. Seleccione su cluster');
      console.log('3. Vaya a la pestaña "Search"');
      console.log('4. Verifique que existe un índice llamado "Index_Songs"');
      console.log('5. Si no existe, créelo usando la configuración de atlas-search.js');
      console.log('6. Si existe pero no funciona, elimínelo y vuelva a crearlo');
      
      // 6. Sugerir soluciones
      console.log('\n💡 POSIBLES SOLUCIONES:');
      console.log('1. Verificar que el índice "songs_search" existe en MongoDB Atlas');
      console.log('2. Ejecutar script para reindexar todas las canciones: npm run reindex-songs');
      console.log('3. Simplificar la consulta de búsqueda (ver modificaciones propuestas)');
      console.log('4. Verificar que ATLAS_SEARCH_ENABLED=true en su archivo .env');
      
    } catch (error) {
      console.error('\n❌ Error durante el diagnóstico:', error);
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
