const fs = require('fs');
const { parse } = require('csv-parse');
const Song = require('../models/Song');

class CSVService {
  /**
   * Procesa el archivo CSV y devuelve un arreglo de objetos
   * @param {string} filePath - Ruta al archivo CSV
   * @param {Function} progressCallback - Función para reportar progreso
   * @returns {Promise<Array>} - Arreglo de objetos con los datos del CSV
   */
  async parseCSVFile(filePath, progressCallback = null) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      // Verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`El archivo ${filePath} no existe`));
      }

      // Obtener el tamaño del archivo para calcular progreso
      const fileSize = fs.statSync(filePath).size;
      let bytesRead = 0;
      
      if (progressCallback) {
        progressCallback({
          stage: 'parsing',
          message: 'Comenzando a leer el archivo CSV',
          progress: 0,
          total: fileSize
        });
      }

      fs.createReadStream(filePath)
        .on('data', (chunk) => {
          bytesRead += chunk.length;
          
          if (progressCallback) {
            progressCallback({
              stage: 'parsing',
              message: 'Leyendo archivo CSV',
              progress: bytesRead,
              total: fileSize,
              percentage: Math.round((bytesRead / fileSize) * 100)
            });
          }
        })
        .pipe(parse({
          delimiter: ',',
          columns: false,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => {
          // Ignorar la primera fila si es un comentario (comienza con //)
          if (data[0].startsWith('//')) return;
          
          // Procesar cada fila
          results.push({
            code: parseInt(data[0]),
            title: data[1],
            artist: data[2],
            genre: data[3]
          });
        })
        .on('end', () => {
          if (progressCallback) {
            progressCallback({
              stage: 'parsing',
              message: 'Archivo CSV leído completamente',
              progress: fileSize,
              total: fileSize,
              percentage: 100
            });
          }
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Importa canciones desde un archivo CSV a la base de datos
   * @param {string} filePath - Ruta al archivo CSV
   * @param {Function} progressCallback - Función para reportar progreso
   * @returns {Promise<Object>} - Resultados de la importación
   */
  async importSongsFromCSV(filePath, progressCallback = null) {
    try {
      const startTime = Date.now();

      if (progressCallback) {
        progressCallback({
          stage: 'starting',
          message: 'Iniciando proceso de importación'
        });
      }

      const songs = await this.parseCSVFile(filePath, progressCallback);
      
      const results = {
        total: songs.length,
        imported: 0,
        updated: 0,
        errors: 0,
        errorDetails: []
      };

      if (progressCallback) {
        progressCallback({
          stage: 'importing',
          message: `Comenzando a importar ${songs.length} canciones a la base de datos`,
          progress: 0,
          total: songs.length,
          percentage: 0
        });
      }

      // Procesar cada canción
      for (let i = 0; i < songs.length; i++) {
        const songData = songs[i];
        
        try {
          // Verificar si la canción ya existe por código
          const existingSong = await Song.findOne({ code: songData.code });
          
          if (existingSong) {
            // Actualizar canción existente
            await Song.findByIdAndUpdate(existingSong._id, {
              title: songData.title,
              artist: songData.artist,
              genre: [songData.genre],  // Convertir a array para coincidir con el modelo
              // No actualizamos duration, language, year si no están en el CSV
              indexed: true // Marcar como indexado para Atlas Search
            });
            results.updated++;
          } else {
            // Crear nueva canción
            const newSong = new Song({
              code: songData.code,
              title: songData.title,
              artist: songData.artist,
              genre: [songData.genre],
              language: this.detectLanguage(songData.title, songData.genre),
              duration: 180, // Duración por defecto de 3 minutos
              indexed: true // Marcar como indexado para Atlas Search
            });
            
            await newSong.save();
            results.imported++;
          }

          // Actualizar progreso cada 10 canciones o en la última
          if (progressCallback && (i % 10 === 0 || i === songs.length - 1)) {
            const processed = i + 1;
            const percentage = Math.round((processed / songs.length) * 100);
            const elapsedMs = Date.now() - startTime;
            const msPerItem = elapsedMs / processed;
            const remainingItems = songs.length - processed;
            const estimatedRemainingMs = msPerItem * remainingItems;
            
            progressCallback({
              stage: 'importing',
              message: `Procesando canciones (${processed}/${songs.length})`,
              progress: processed,
              total: songs.length,
              percentage: percentage,
              stats: {
                imported: results.imported,
                updated: results.updated,
                errors: results.errors
              },
              timing: {
                elapsed: this.formatTime(elapsedMs),
                estimated: this.formatTime(elapsedMs + estimatedRemainingMs),
                remaining: this.formatTime(estimatedRemainingMs)
              }
            });
          }
        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            song: songData,
            error: error.message
          });

          if (progressCallback) {
            progressCallback({
              stage: 'error',
              message: `Error al procesar canción: ${songData.title}`,
              error: error.message
            });
          }
        }
      }

      const totalTime = Date.now() - startTime;
      
      if (progressCallback) {
        progressCallback({
          stage: 'completed',
          message: 'Importación completada',
          stats: results,
          timing: {
            total: this.formatTime(totalTime)
          }
        });
      }

      return results;
    } catch (error) {
      if (progressCallback) {
        progressCallback({
          stage: 'error',
          message: 'Error crítico en la importación',
          error: error.message
        });
      }
      throw new Error(`Error al importar canciones desde CSV: ${error.message}`);
    }
  }

  /**
   * Formatea milisegundos a formato legible (HH:MM:SS)
   * @param {number} ms - Milisegundos
   * @returns {string} - Tiempo formateado
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  /**
   * Detecta el idioma de la canción basándose en el título y el género
   * @param {string} title - Título de la canción
   * @param {string} genre - Género de la canción
   * @returns {string} - Idioma detectado (spanish o english)
   */
  detectLanguage(title, genre) {
    // Si el género indica idioma inglés
    if (genre && ['B. INGLES', 'ROCK INGLES', 'POP INGLES'].includes(genre.toUpperCase())) {
      return 'english';
    }
    
    // Detección simple: si contiene caracteres especiales del español como á, é, í, ó, ú, ñ
    if (/[áéíóúñÁÉÍÓÚÑ]/.test(title)) {
      return 'spanish';
    }
    
    // Por defecto, asumimos español
    return 'spanish';
  }
}

module.exports = new CSVService();
