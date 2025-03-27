const fs = require('fs');
const csv = require('csv-parser');
const Song = require('../models/Song');

/**
 * Importa canciones desde un archivo CSV
 * @param {string} filePath - Ruta al archivo CSV
 * @returns {Promise<Object>} - Resultado de la importación
 */
exports.importSongsFromCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let processed = 0;
    let imported = 0;
    let skipped = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',' }))
      .on('data', (data) => {
        // Limpiar y transformar datos
        const songData = {
          code: parseInt(data.NUM?.trim() || '0'),
          title: data.TITULO?.trim() || '',
          artist: data.ARTISTA?.trim() || '',
          genre: data.GENERO?.trim() || 'OTROS'
        };
        
        // Validación básica
        if (!songData.code || !songData.title || !songData.artist) {
          errors.push({
            line: processed + 1,
            error: 'Datos incompletos',
            data: songData
          });
          skipped++;
        } else {
          results.push(songData);
          imported++;
        }
        
        processed++;
      })
      .on('end', async () => {
        try {
          // Manejar los datos importados en lotes para mejor rendimiento
          const batchSize = 100;
          const totalBatches = Math.ceil(results.length / batchSize);
          
          console.log(`Procesando ${results.length} canciones en ${totalBatches} lotes`);
          
          const importErrors = [];
          let importedCount = 0;
          
          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            
            // Crear operaciones de upsert para cada canción
            const bulkOps = batch.map(song => ({
              updateOne: {
                filter: { code: song.code },
                update: { $set: song },
                upsert: true
              }
            }));
            
            // Ejecutar operaciones en masa
            try {
              const result = await Song.bulkWrite(bulkOps, { ordered: false });
              importedCount += (result.upsertedCount + result.modifiedCount);
              console.log(`Lote ${Math.floor(i/batchSize) + 1}/${totalBatches} procesado: ${result.upsertedCount} nuevos, ${result.modifiedCount} actualizados`);
            } catch (bulkError) {
              // Capturar errores pero continuar con el siguiente lote
              console.error(`Error en lote ${Math.floor(i/batchSize) + 1}:`, bulkError.message);
              if (bulkError.writeErrors) {
                bulkError.writeErrors.forEach(err => {
                  importErrors.push({
                    code: err.err.op.code,
                    error: err.err.errmsg
                  });
                });
              }
            }
          }
          
          resolve({
            success: true,
            processed,
            imported: importedCount,
            skipped: processed - importedCount,
            errors: [...errors, ...importErrors]
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
