const Table = require('../../models/Table');
const { validationResult } = require('express-validator');

/**
 * Crear una nueva mesa
 * @route POST /api/tables
 * @access Private (Admin)
 */
exports.createTable = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { number, capacity, location } = req.body;
    
    // Verificar que el número de mesa no esté en uso
    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una mesa con el número ${number}`
      });
    }
    
    // Crear la mesa
    const newTable = new Table({
      number,
      capacity,
      location: location || 'main',
      status: 'free'
    });
    
    await newTable.save();
    
    res.status(201).json({
      success: true,
      data: newTable
    });
  } catch (error) {
    console.error('Error al crear la mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la mesa',
      error: error.message
    });
  }
};

/**
 * Obtener todas las mesas
 * @route GET /api/tables
 * @access Private
 */
exports.getTables = async (req, res) => {
  try {
    const { status, location } = req.query;
    
    // Construir el filtro
    const filter = {};
    
    // Filtrar por estado si se proporciona
    if (status) {
      filter.status = status;
    }
    
    // Filtrar por ubicación si se proporciona
    if (location) {
      filter.location = location;
    }
    
    // Buscar mesas
    const tables = await Table.find(filter)
      .sort({ number: 1 })
      .populate('currentOrderId', 'status');
    
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mesas',
      error: error.message
    });
  }
};

/**
 * Obtener una mesa por ID
 * @route GET /api/tables/:id
 * @access Private
 */
exports.getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrderId');
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Error al obtener la mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la mesa',
      error: error.message
    });
  }
};

/**
 * Actualizar una mesa
 * @route PUT /api/tables/:id
 * @access Private (Admin)
 */
exports.updateTable = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const { number, capacity, location, status } = req.body;
    
    // Verificar que la mesa exista
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }
    
    // Si se está cambiando el número, verificar que no esté en uso
    if (number && number !== table.number) {
      const existingTable = await Table.findOne({ number });
      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una mesa con el número ${number}`
        });
      }
    }
    
    // Actualizar campos
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      {
        number: number || table.number,
        capacity: capacity || table.capacity,
        location: location || table.location,
        status: status || table.status
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: updatedTable
    });
  } catch (error) {
    console.error('Error al actualizar la mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la mesa',
      error: error.message
    });
  }
};

/**
 * Eliminar una mesa
 * @route DELETE /api/tables/:id
 * @access Private (Admin)
 */
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return next(new ApiError('Mesa no encontrada', 404));
    }
    
    // Verificar que la mesa no esté ocupada
    if (table.status === 'occupied' || table.currentOrderId) {
      return next(new ApiError('No se puede eliminar una mesa ocupada', 400));
    }
    
    // Usar findByIdAndDelete en lugar de remove
    await Table.findByIdAndDelete(table._id);
    
    res.json({
      success: true,
      message: 'Mesa eliminada correctamente'
    });
  } catch (error) {
    next(new ApiError(`Error al eliminar la mesa: ${error.message}`, 500));
  }
};
