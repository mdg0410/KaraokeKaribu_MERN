const Order = require('../../models/Order');
const Table = require('../../models/Table');
const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const { ApiError } = require('../../middlewares/error.middleware');

/**
 * Crear un nuevo pedido
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { tableId, products, songs } = req.body;
    
    // Verificar que la mesa exista y esté disponible si se proporciona
    if (tableId) {
      const table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }
      
      if (table.status !== 'free') {
        return res.status(400).json({
          success: false,
          message: 'La mesa no está disponible'
        });
      }
    }
    
    // Verificar stock de productos
    if (products && products.length > 0) {
      const productIds = products.map(item => item.productId);
      const productsFromDB = await Product.find({ _id: { $in: productIds } });
      
      const productMap = new Map(productsFromDB.map(product => [product._id.toString(), product]));
      
      // Verificar stock y disponibilidad
      for (const item of products) {
        const product = productMap.get(item.productId);
        
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }
        
        if (!product.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Producto ${product.name} no está disponible`
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para el producto ${product.name}`
          });
        }
        
        // Asignar el precio actual del producto
        item.price = product.price;
      }
    }
    
    // Crear el pedido
    const newOrder = new Order({
      userId: req.user.id,
      tableId,
      products: products || [],
      songs: songs || [],
      status: 'pending'
    });
    
    // Calcular el total
    newOrder.calculateTotal();
    
    // Guardar el pedido
    await newOrder.save();
    
    // Si hay mesa, actualizar su estado
    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrderId: newOrder._id
      });
    }
    
    // Actualizar stock de productos
    for (const item of products || []) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    res.status(201).json({
      success: true,
      data: newOrder
    });
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el pedido',
      error: error.message
    });
  }
};

/**
 * Obtener todos los pedidos
 * @route GET /api/orders
 * @access Private
 */
exports.getOrders = async (req, res) => {
  try {
    const { status, userId, tableId, limit = 10, page = 1 } = req.query;
    
    // Construir el filtro
    const filter = {};
    
    // Filtrar por estado si se proporciona
    if (status) {
      filter.status = status;
    }
    
    // Filtrar por usuario si se proporciona
    if (userId) {
      filter.userId = userId;
    }
    
    // Filtrar por mesa si se proporciona
    if (tableId) {
      filter.tableId = tableId;
    }
    
    // Calcular el salto para la paginación
    const skip = (page - 1) * limit;
    
    // Buscar pedidos
    const orders = await Order.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username')
      .populate('tableId', 'number')
      .sort({ createdAt: -1 });
    
    // Contar total de documentos para la paginación
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};

/**
 * Obtener un pedido por ID
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('tableId', 'number status')
      .populate('products.productId', 'name price')
      .populate('songs', 'title artist');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al obtener el pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido',
      error: error.message
    });
  }
};

/**
 * Actualizar un pedido
 * @route PUT /api/orders/:id
 * @access Private
 */
exports.updateOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const { status, products, songs } = req.body;
    
    // Buscar el pedido
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    // Si está cambiando el estado a 'completed' o 'cancelled'
    if (status && (status === 'completed' || status === 'cancelled') && order.tableId) {
      // Liberar la mesa
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'free',
        currentOrderId: null
      });
    }
    
    // Actualizar campos
    if (status) order.status = status;
    if (products) order.products = products;
    if (songs) order.songs = songs;
    
    // Recalcular total si se modificaron los productos
    if (products) {
      order.calculateTotal();
    }
    
    // Guardar cambios
    await order.save();
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el pedido',
      error: error.message
    });
  }
};

/**
 * Eliminar un pedido
 * @route DELETE /api/orders/:id
 * @access Private
 */
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return next(new ApiError('Pedido no encontrado', 404));
    }
    
    // Si el pedido tiene una mesa asignada, liberarla
    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: 'free',
        currentOrderId: null
      });
    }
    
    // Restaurar stock de productos
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    
    // Cambiar el método obsoleto 'remove' por 'deleteOne'
    await Order.findByIdAndDelete(order._id);
    
    res.json({
      success: true,
      message: 'Pedido eliminado correctamente'
    });
  } catch (error) {
    next(new ApiError(`Error al eliminar el pedido: ${error.message}`, 500));
  }
};
