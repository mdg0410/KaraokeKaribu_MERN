const Song = require('../models/Song');
const socketManager = require('../utils/socketManager');
const redisManager = require('../utils/redisManager');

/**
 * Obtener todas las canciones
 */
exports.getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ title: 1 });
    return res.status(200).json(songs);
  } catch (error) {
    console.error('Error al obtener canciones:', error);
    return res.status(500).json({ message: 'Error al obtener canciones' });
  }
};

/**
 * Obtener una canción por ID
 */
exports.getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    return res.status(200).json(song);
  } catch (error) {
    console.error('Error al obtener canción:', error);
    return res.status(500).json({ message: 'Error al obtener canción' });
  }
};

/**
 * Subir o actualizar canciones
 */
exports.uploadSongs = async (req, res) => {
  try {
    // Aquí iría la lógica para procesar el archivo CSV o JSON
    // y extraer la información de las canciones
    
    const songsData = req.body.songs || [];
    
    if (!songsData.length) {
      return res.status(400).json({ message: 'No se proporcionaron canciones' });
    }
    
    const songsAdded = [];
    
    // Procesar cada canción
    for (const songData of songsData) {
      // Verificar si la canción ya existe por código
      let song = await Song.findOne({ code: songData.code });
      
      if (song) {
        // Actualizar canción existente
        Object.assign(song, songData);
        await song.save();
      } else {
        // Crear nueva canción
        song = new Song(songData);
        await song.save();
      }
      
      songsAdded.push(song);
    }

    // Emitir evento de actualización mediante Socket.IO
    socketManager.emitSongsUpdated(songsAdded);
    
    // Invalidar caché de búsquedas
    await redisManager.invalidateSearchCache();
    
    return res.status(200).json({ 
      message: 'Canciones cargadas exitosamente', 
      count: songsAdded.length 
    });
  } catch (error) {
    console.error('Error al subir canciones:', error);
    return res.status(500).json({ message: 'Error al procesar canciones' });
  }
};

/**
 * Buscar canciones
 */
exports.searchSongs = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: 'La consulta de búsqueda debe tener al menos 2 caracteres' 
      });
    }
    
    // Verificar caché primero
    const cachedResults = await redisManager.getCachedSearchResults(query);
    if (cachedResults) {
      return res.json({ source: 'cache', results: cachedResults });
    }
    
    // Realizar búsqueda en la base de datos
    const results = await Song.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } }
      ]
    }).limit(50);
    
    // Guardar resultados en caché
    await redisManager.cacheSearchResults(query, results);
    
    return res.json({ source: 'database', results });
  } catch (error) {
    console.error('Error en búsqueda de canciones:', error);
    return res.status(500).json({ message: 'Error al buscar canciones' });
  }
};

/**
 * Eliminar una canción
 */
exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada' });
    }
    
    // Invalidar caché de búsquedas
    await redisManager.invalidateSearchCache();
    
    // Notificar a los clientes sobre la eliminación
    socketManager.emitSongsUpdated([{ id: req.params.id, deleted: true }]);
    
    return res.status(200).json({ message: 'Canción eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar canción:', error);
    return res.status(500).json({ message: 'Error al eliminar canción' });
  }
};