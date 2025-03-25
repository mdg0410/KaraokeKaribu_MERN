const Song = require('../../models/Song');
const { validationResult } = require('express-validator');
const { ApiError } = require('../../middlewares/error.middleware');

/**
 * Crear una nueva canción
 * @route POST /api/songs
 * @access Private (Admin)
 */
exports.createSong = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, artist, code, duration, genre, language, year, pdfUrl, audioPreviewUrl } = req.body;
    
    // Verificar si la canción ya existe
    const existingSong = await Song.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') },
      artist: { $regex: new RegExp(`^${artist}$`, 'i') }
    });
    
    if (existingSong) {
      return res.status(400).json({
        success: false,
        message: 'Esta canción ya existe en el sistema'
      });
    }

    // Verificar si el código ya está en uso
    const songWithCode = await Song.findOne({ code });
    if (songWithCode) {
      return res.status(400).json({
        success: false,
        message: `El código ${code} ya está asignado a otra canción`
      });
    }
    
    // Crear la canción
    const newSong = new Song({
      title,
      artist,
      code,
      duration,
      genre: genre || [],
      language: language || 'español',
      year,
      pdfUrl,
      audioPreviewUrl,
      indexed: false
    });
    
    await newSong.save();
    
    res.status(201).json({
      success: true,
      data: newSong
    });
  } catch (error) {
    console.error('Error al crear la canción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la canción',
      error: error.message
    });
  }
};

/**
 * Obtener todas las canciones
 * @route GET /api/songs
 * @access Public
 */
exports.getSongs = async (req, res) => {
  try {
    const { 
      title, 
      artist, 
      genre, 
      language, 
      sort = 'title', 
      order = 'asc',
      limit = 20, 
      page = 1 
    } = req.query;
    
    // Construir el filtro
    const filter = {};
    
    // Filtrar por título si se proporciona
    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    
    // Filtrar por artista si se proporciona
    if (artist) {
      filter.artist = { $regex: artist, $options: 'i' };
    }
    
    // Filtrar por género si se proporciona
    if (genre) {
      filter.genre = { $in: [genre] };
    }
    
    // Filtrar por idioma si se proporciona
    if (language) {
      filter.language = language;
    }
    
    // Validar el campo de ordenamiento
    const allowedSortFields = ['title', 'artist', 'year', 'duration'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'title';
    
    // Validar el orden
    const sortOrder = order === 'desc' ? -1 : 1;
    
    // Configurar el objeto de ordenamiento
    const sortConfig = {};
    sortConfig[sortField] = sortOrder;
    
    // Calcular el salto para la paginación
    const skip = (page - 1) * limit;
    
    // Buscar canciones
    const songs = await Song.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar total de documentos para la paginación
    const total = await Song.countDocuments(filter);
    
    res.json({
      success: true,
      data: songs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener canciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener canciones',
      error: error.message
    });
  }
};

/**
 * Obtener una canción por ID
 * @route GET /api/songs/:id
 * @access Public
 */
exports.getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: song
    });
  } catch (error) {
    console.error('Error al obtener la canción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la canción',
      error: error.message
    });
  }
};

/**
 * Actualizar una canción
 * @route PUT /api/songs/:id
 * @access Private (Admin)
 */
exports.updateSong = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const updateData = req.body;
    
    // Verificar que la canción exista
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Canción no encontrada'
      });
    }
    
    // Si se está actualizando el título o artista, verificar que no exista otra canción con la misma combinación
    if ((updateData.title || updateData.artist) && 
        (updateData.title !== song.title || updateData.artist !== song.artist)) {
      const existingSong = await Song.findOne({
        _id: { $ne: req.params.id },
        title: { $regex: new RegExp(`^${updateData.title || song.title}$`, 'i') },
        artist: { $regex: new RegExp(`^${updateData.artist || song.artist}$`, 'i') }
      });
      
      if (existingSong) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra canción con ese título y artista'
        });
      }
    }
    
    // Actualizar la canción
    // Establecer indexed = false si se modifican campos importantes
    if (updateData.title || updateData.artist || updateData.lyrics) {
      updateData.indexed = false;
    }
    
    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedSong
    });
  } catch (error) {
    console.error('Error al actualizar la canción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la canción',
      error: error.message
    });
  }
};

/**
 * Eliminar una canción
 * @route DELETE /api/songs/:id
 * @access Private (Admin)
 */
exports.deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return next(new ApiError('Canción no encontrada', 404));
    }
    
    // Verificar si la canción está en uso en algún pedido activo
    const ordersWithSong = await Order.find({
      songs: song._id,
      status: { $in: ['pending', 'processing'] }
    });
    
    if (ordersWithSong.length > 0) {
      return next(new ApiError('No se puede eliminar la canción porque está siendo utilizada en pedidos activos', 400));
    }
    
    // Usar findByIdAndDelete en lugar de remove
    await Song.findByIdAndDelete(song._id);
    
    res.json({
      success: true,
      message: 'Canción eliminada correctamente'
    });
  } catch (error) {
    next(new ApiError(`Error al eliminar la canción: ${error.message}`, 500));
  }
};

/**
 * Buscar canciones
 * @route GET /api/songs/search
 * @access Public
 */
exports.searchSongs = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La consulta de búsqueda debe tener al menos 2 caracteres'
      });
    }
    
    // Buscar canciones que coincidan con el título o artista
    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { artist: { $regex: q, $options: 'i' } }
      ]
    })
    .limit(parseInt(limit))
    .select('title artist duration');
    
    res.json({
      success: true,
      data: songs
    });
  } catch (error) {
    console.error('Error en la búsqueda de canciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda de canciones',
      error: error.message
    });
  }
};

/**
 * Buscar canciones por código
 * @route GET /api/songs/code/:code
 * @access Public
 */
exports.getSongByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    // Verificar que el código sea un número válido
    if (isNaN(code) || code < 1 || code > 8000) {
      return next(new ApiError('Código de canción inválido. Debe ser un número entre 1 y 8000', 400));
    }
    
    const song = await Song.findOne({ code: parseInt(code) });
    
    if (!song) {
      return next(new ApiError(`No se encontró ninguna canción con el código ${code}`, 404));
    }
    
    res.json({
      success: true,
      data: song
    });
  } catch (error) {
    next(new ApiError(`Error al buscar canción por código: ${error.message}`, 500));
  }
};
