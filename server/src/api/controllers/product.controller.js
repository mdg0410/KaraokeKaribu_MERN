const Product = require('../../models/Product');
const { validationResult } = require('express-validator');

/**
 * Crear un nuevo producto
 * @route POST /api/products
 * @access Private (Admin)
 */
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, price, stock, description, category, imageUrl, options } = req.body;
    
    // Verificar que el nombre del producto no exista
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese nombre'
      });
    }
    
    // Crear el producto
    const newProduct = new Product({
      name,
      price,
      stock: stock || 0,
      description,
      category,
      imageUrl,
      options: options || [],
      isAvailable: stock > 0
    });
    
    await newProduct.save();
    
    res.status(201).json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el producto',
      error: error.message
    });
  }
};

/**
 * Obtener todos los productos
 * @route GET /api/products
 * @access Public
 */
exports.getProducts = async (req, res) => {
  try {
    const { 
      category, 
      available, 
      minPrice, 
      maxPrice,
      sort = 'name', 
      order = 'asc',
      limit = 20, 
      page = 1 
    } = req.query;
    
    // Construir el filtro
    const filter = {};
    
    // Filtrar por categoría si se proporciona
    if (category) {
      filter.category = category;
    }
    
    // Filtrar por disponibilidad si se proporciona
    if (available !== undefined) {
      filter.isAvailable = available === 'true';
    }
    
    // Filtrar por rango de precios
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        filter.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        filter.price.$lte = parseFloat(maxPrice);
      }
    }
    
    // Validar el campo de ordenamiento
    const allowedSortFields = ['name', 'price', 'stock', 'category'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'name';
    
    // Validar el orden
    const sortOrder = order === 'desc' ? -1 : 1;
    
    // Configurar el objeto de ordenamiento
    const sortConfig = {};
    sortConfig[sortField] = sortOrder;
    
    // Calcular el salto para la paginación
    const skip = (page - 1) * limit;
    
    // Buscar productos
    const products = await Product.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar total de documentos para la paginación
    const total = await Product.countDocuments(filter);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

/**
 * Obtener un producto por ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el producto',
      error: error.message
    });
  }
};

/**
 * Actualizar un producto
 * @route PUT /api/products/:id
 * @access Private (Admin)
 */
exports.updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const updateData = req.body;
    
    // Verificar que el producto exista
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Si se está actualizando el nombre, verificar que no exista otro producto con el mismo nombre
    if (updateData.name && updateData.name !== product.name) {
      const existingProduct = await Product.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }
      });
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con ese nombre'
        });
      }
    }
    
    // Actualizar disponibilidad basada en stock
    if (updateData.stock !== undefined) {
      updateData.isAvailable = updateData.stock > 0;
    }
    
    // Actualizar el producto
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto',
      error: error.message
    });
  }
};

/**
 * Eliminar un producto
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return next(new ApiError('Producto no encontrado', 404));
    }
    
    // Verificar si el producto está en uso en algún pedido activo
    const ordersWithProduct = await Order.find({
      'products.productId': product._id,
      status: { $in: ['pending', 'processing'] }
    });
    
    if (ordersWithProduct.length > 0) {
      return next(new ApiError('No se puede eliminar el producto porque está siendo utilizado en pedidos activos', 400));
    }
    
    // Usar findByIdAndDelete en lugar de remove
    await Product.findByIdAndDelete(product._id);
    
    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    next(new ApiError(`Error al eliminar el producto: ${error.message}`, 500));
  }
};

/**
 * Actualizar stock de un producto
 * @route PATCH /api/products/:id/stock
 * @access Private (Admin)
 */
exports.updateStock = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
  }
  
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return next(new ApiError('Se requiere la cantidad para actualizar el stock', 400));
    }
    
    // Verificar que el producto exista
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Calcular nuevo stock
    const newStock = product.stock + quantity;
    
    // Validar que el stock no sea negativo
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }
    
    // Actualizar el stock y la disponibilidad
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        stock: newStock,
        isAvailable: newStock > 0
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    next(new ApiError(`Error al actualizar el stock: ${error.message}`, 500));
  }
};

/**
 * Generar informe de inventario
 * @route GET /api/products/inventory/report
 * @access Private (Admin)
 */
exports.generateInventoryReport = async (req, res) => {
  try {
    // Obtener todos los productos
    const products = await Product.find({})
      .sort({ category: 1, name: 1 });
    
    // Calcular estadísticas básicas
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;
    
    // Agrupar productos por categoría
    const productsByCategory = {};
    products.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });
    
    // Crear el informe
    const report = {
      generatedAt: new Date(),
      summary: {
        totalProducts,
        outOfStock,
        lowStock,
        inStock: totalProducts - outOfStock
      },
      categories: Object.keys(productsByCategory).map(category => ({
        name: category,
        count: productsByCategory[category].length,
        products: productsByCategory[category].map(p => ({
          id: p._id,
          name: p.name,
          stock: p.stock,
          price: p.price,
          isAvailable: p.isAvailable
        }))
      }))
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error al generar el informe de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el informe de inventario',
      error: error.message
    });
  }
};
