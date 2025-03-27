/**
 * Servicio para manejar consultas comunes en MongoDB
 */

/**
 * Construye una consulta paginada para cualquier modelo
 * @param {Object} Model - Modelo de Mongoose
 * @param {Object} filter - Filtros para la consulta
 * @param {Object} options - Opciones adicionales (sort, pagination, populate, etc.)
 * @returns {Promise<Object>} - Resultados y metadatos de paginación
 */
exports.getPaginatedResults = async (Model, filter = {}, options = {}) => {
  try {
    const {
      sort = { createdAt: -1 },
      page = 1,
      limit = 10,
      select,
      populate
    } = options;
    
    // Validar y convertir parámetros
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Construir query principal
    let query = Model.find(filter);
    
    // Aplicar sort
    if (sort) {
      query = query.sort(sort);
    }
    
    // Aplicar select para limitar los campos devueltos
    if (select) {
      query = query.select(select);
    }
    
    // Aplicar populate para cargar relaciones
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      } else {
        query = query.populate(populate);
      }
    }
    
    // Aplicar paginación
    query = query.skip(skip).limit(limitNum);
    
    // Ejecutar query
    const results = await query.exec();
    
    // Obtener el conteo total para cálculos de paginación
    const total = await Model.countDocuments(filter);
    
    return {
      data: results,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    console.error('Error en getPaginatedResults:', error);
    throw error;
  }
};

/**
 * Construye una consulta de búsqueda optimizada para MongoDB Atlas Search
 * @param {Object} Model - Modelo de Mongoose
 * @param {string} searchText - Texto a buscar
 * @param {Array} searchFields - Campos en los que buscar
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} - Resultados de la búsqueda
 */
exports.performSearch = async (Model, searchText, searchFields = [], options = {}) => {
  const { limit = 20, useAtlasSearch = true } = options;
  
  // Validar entrada
  if (!searchText || searchText.length < 2) {
    throw new Error('La consulta de búsqueda debe tener al menos 2 caracteres');
  }
  
  try {
    // Intentar usar Atlas Search si está configurado
    if (useAtlasSearch && process.env.ATLAS_SEARCH_ENABLED === 'true') {
      try {
        const indexName = `Index_${Model.collection.collectionName}`;
        
        const results = await Model.aggregate([
          {
            $search: {
              index: indexName,
              text: {
                query: searchText,
                path: searchFields
              }
            }
          },
          { $limit: parseInt(limit) },
          {
            $project: {
              ...searchFields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
              _id: 1,
              score: { $meta: "searchScore" }
            }
          }
        ]);
        
        return {
          data: results,
          searchMethod: 'atlas_search'
        };
      } catch (searchError) {
        console.error('Error usando Atlas Search, usando fallback:', searchError);
        // Continuar con el fallback si falla Atlas Search
      }
    }
    
    // Búsqueda fallback usando expresiones regulares
    const regexConditions = searchFields.map(field => ({
      [field]: { $regex: searchText, $options: 'i' }
    }));
    
    // Si el texto de búsqueda parece ser un número, agregar condición para campos numéricos
    if (!isNaN(searchText)) {
      const numericValue = parseInt(searchText);
      const numericFields = ['code', 'number']; // Campos que podrían ser numéricos
      
      numericFields.forEach(field => {
        if (Model.schema.paths[field]) {
          regexConditions.push({ [field]: numericValue });
        }
      });
    }
    
    const results = await Model.find({ $or: regexConditions })
      .limit(parseInt(limit))
      .select(searchFields.join(' '));
    
    return {
      data: results,
      searchMethod: 'regex_fallback'
    };
  } catch (error) {
    console.error('Error en performSearch:', error);
    throw error;
  }
};

/**
 * Función helper para construir filtros comunes
 * @param {Object} queryParams - Parámetros de consulta desde req.query
 * @param {Object} filterConfig - Configuración de qué parámetros procesar y cómo
 * @returns {Object} - Filtro listo para usar en Model.find()
 */
exports.buildFilter = (queryParams, filterConfig = {}) => {
  const filter = {};
  
  // Procesar cada parámetro según la configuración
  Object.entries(queryParams).forEach(([key, value]) => {
    // Ignorar parámetros de paginación y ordenación
    if (['page', 'limit', 'sort', 'order'].includes(key)) {
      return;
    }
    
    // Si hay una configuración específica para este campo
    if (filterConfig[key]) {
      const fieldConfig = filterConfig[key];
      
      // Aplicar transformación personalizada si existe
      if (typeof fieldConfig === 'function') {
        const result = fieldConfig(value);
        if (result !== null) {
          Object.assign(filter, result);
        }
        return;
      }
      
      // O usar la configuración predefinida
      switch (fieldConfig.type) {
        case 'exact':
          filter[key] = value;
          break;
        case 'regex':
          filter[key] = { $regex: value, $options: 'i' };
          break;
        case 'boolean':
          filter[key] = value === 'true';
          break;
        case 'numeric':
          if (fieldConfig.comparison === 'range') {
            filter[key] = filter[key] || {};
            if (fieldConfig.min && queryParams[fieldConfig.min]) {
              filter[key].$gte = parseFloat(queryParams[fieldConfig.min]);
            }
            if (fieldConfig.max && queryParams[fieldConfig.max]) {
              filter[key].$lte = parseFloat(queryParams[fieldConfig.max]);
            }
          } else if (fieldConfig.comparison === 'exact') {
            filter[key] = parseFloat(value);
          }
          break;
        case 'date':
          filter[key] = filter[key] || {};
          if (fieldConfig.start && queryParams[fieldConfig.start]) {
            filter[key].$gte = new Date(queryParams[fieldConfig.start]);
          }
          if (fieldConfig.end && queryParams[fieldConfig.end]) {
            filter[key].$lte = new Date(queryParams[fieldConfig.end]);
          }
          break;
        case 'array':
          if (fieldConfig.operator === 'in') {
            filter[key] = { $in: Array.isArray(value) ? value : [value] };
          } else if (fieldConfig.operator === 'all') {
            filter[key] = { $all: Array.isArray(value) ? value : [value] };
          }
          break;
      }
      return;
    }
    
    // Comportamiento por defecto para campos sin configuración específica
    if (value !== undefined && value !== null && value !== '') {
      filter[key] = value;
    }
  });
  
  return filter;
};
