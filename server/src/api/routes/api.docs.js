/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticación de usuarios
 *   - name: Orders
 *     description: Gestión de pedidos
 *   - name: Tables
 *     description: Gestión de mesas
 *   - name: Songs
 *     description: Gestión de canciones
 *   - name: Products
 *     description: Gestión de productos e inventario
 * 
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - total
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado
 *         userId:
 *           type: string
 *           description: ID del usuario que realizó el pedido
 *         tableId:
 *           type: string
 *           description: ID de la mesa asociada (opcional)
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               price:
 *                 type: number
 *         songs:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, cancelled]
 *         total:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Table:
 *       type: object
 *       required:
 *         - number
 *         - capacity
 *       properties:
 *         _id:
 *           type: string
 *         number:
 *           type: number
 *           description: Número único de la mesa
 *         status:
 *           type: string
 *           enum: [free, occupied, reserved, maintenance]
 *         currentOrderId:
 *           type: string
 *           description: ID del pedido actual asociado
 *         capacity:
 *           type: number
 *           description: Número de personas que pueden sentarse
 *         location:
 *           type: string
 *           description: Ubicación de la mesa
 *         
 *     Song:
 *       type: object
 *       required:
 *         - title
 *         - artist
 *         - duration
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         artist:
 *           type: string
 *         duration:
 *           type: number
 *         genre:
 *           type: array
 *           items:
 *             type: string
 *         language:
 *           type: string
 *         year:
 *           type: number
 *         pdfUrl:
 *           type: string
 *         audioPreviewUrl:
 *           type: string
 *         indexed:
 *           type: boolean
 *
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [bebidas, comidas, snacks, otros]
 *         imageUrl:
 *           type: string
 *         isAvailable:
 *           type: boolean
 *         options:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableId:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *               songs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Pedido creado
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error del servidor
 * 
 *   get:
 *     summary: Obtener todos los pedidos
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrar por usuario
 *       - in: query
 *         name: tableId
 *         schema:
 *           type: string
 *         description: Filtrar por mesa
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número de resultados por página
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página a consultar
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       500:
 *         description: Error del servidor
 *
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener un pedido por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 *
 *   put:
 *     summary: Actualizar un pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, cancelled]
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *               songs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Pedido actualizado
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 *
 *   delete:
 *     summary: Eliminar un pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido eliminado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */

/**
 * Documentación similar disponible para Tables, Songs y Products
 */

module.exports = {};
