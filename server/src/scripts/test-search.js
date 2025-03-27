/**
 * Script para probar la funcionalidad de búsqueda
 * 
 * Uso: node src/scripts/test-search.js <término-de-búsqueda>
 * 
 * Ejemplo: node src/scripts/test-search.js amor
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Song = require('../models/Song');

// Validar argumentos
if (process.argv.length < 3) {
  console.error('Uso: node src/scripts/test-search.js <término-de-búsqueda>');
  process.exit(1);
}

// Obtener el término de búsqueda
const searchQuery = process.argv[2];

console.log(`\n🔍 Buscando canciones con término: "${searchQuery}"`);
console.log('------------------------------------------------');

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Conexión a MongoDB establecida');

    // Verificar si Atlas Search está habilitado
    const atlasSearchEnabled = process.env.ATLAS_SEARCH_ENABLED === 'true';
    console.log(`Atlas Search ${atlasSearchEnabled ? '✓ HABILITADO' : '✗ DESHABILITADO'}`);
    
    try {
      let searchResults;
      
      // Ejecutar la búsqueda con Atlas Search si está habilitado
      if (atlasSearchEnabled) {
        console.log('\n📊 Realizando búsqueda con Atlas Search...');
        try {
          // Consulta simplificada para mayor compatibilidad
          searchResults = await Song.aggregate([
            {
              $search: {
                index: 'Index_Songs',
                text: {
                  query: searchQuery,
                  path: ['title', 'artist', 'genre']
                }
              }
            },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                code: 1,
                title: 1,
                artist: 1,
                genre: 1,
                score: { $meta: "searchScore" }
              }
            }
          ]);
          
          if (searchResults.length === 0) {
            console.log('\n⚠️ No se encontraron resultados con Atlas Search. Probando con consulta alternativa...');
            
            // Probar con una consulta más simple si la primera no retorna resultados
            searchResults = await Song.aggregate([
              {
                $search: {
                  index: 'Index_Songs',
                  text: {
                    query: searchQuery,
                    path: 'title'
                  }
                }
              },
              { $limit: 10 }
            ]);
          }
        } catch (error) {
          console.error('\n❌ Error al usar Atlas Search:', error);
          console.log('Usando búsqueda de respaldo...');
          
          // Fallback a búsqueda regular
          searchResults = await Song.find({
            title: { $regex: searchQuery, $options: 'i' }
          })
          .limit(10)
          .select('code title artist genre');
        }
      } else {
        // Búsqueda fallback usando RegEx
        console.log('\n📊 Realizando búsqueda con RegEx (fallback)...');
        searchResults = await Song.find({
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { artist: { $regex: searchQuery, $options: 'i' } },
            { code: isNaN(searchQuery) ? null : parseInt(searchQuery) }
          ]
        })
        .limit(10)
        .select('code title artist genre');
      }
      
      // Mostrar resultados
      console.log(`\n📋 Resultados (${searchResults.length} canciones encontradas):\n`);
      
      if (searchResults.length === 0) {
        console.log('   No se encontraron canciones con ese término.');
      } else {
        searchResults.forEach((song, index) => {
          console.log(`${index + 1}. [${song.code}] ${song.title} - ${song.artist}`);
          if (song.genre && song.genre.length > 0) {
            console.log(`   Género: ${song.genre.join(', ')}`);
          }
          if (song.score) {
            console.log(`   Puntuación: ${song.score.toFixed(2)}`);
          }
          console.log('');
        });
      }
      
    } catch (error) {
      console.error('\n❌ Error al realizar la búsqueda:', error);
    }
    
    // Cerrar conexión
    mongoose.connection.close();
    console.log('\n👋 Conexión a MongoDB cerrada');
  })
  .catch((error) => {
    console.error('\n❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  });
