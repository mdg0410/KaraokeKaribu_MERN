const csvService = require('../../services/csv.service');
const { validationResult } = require('express-validator');

/**
 * Importa canciones desde un archivo CSV
 * @route POST /api/songs/import-csv
 * @access Private (Admin)
 */
exports.importSongsFromCSV = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Validar que se proporcionó una ruta de archivo
    if (!req.body.filePath) {
      return res.status(400).json({
        success: false,
        message: 'La ruta del archivo CSV es requerida'
      });
    }

    const results = await csvService.importSongsFromCSV(req.body.filePath);
    
    res.status(200).json({
      success: true,
      message: 'Importación de canciones completada',
      data: results
    });
  } catch (error) {
    console.error('Error al importar canciones desde CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar canciones desde CSV',
      error: error.message
    });
  }
};
