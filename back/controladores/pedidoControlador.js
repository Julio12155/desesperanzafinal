const db = require('../configuracion/BaseDatos');

const crearPedido = async (req, res) => {
    const id_usuario = req.session.usuarioID; 
    const { productos } = req.body; 

    try {
        const [detalles] = await db.query('SELECT id FROM clientes_detalles WHERE usuario_id = ?', [id_usuario]);
        
        if (detalles.length === 0) {
            return res.status(400).json({ 
                error: 'Falta direccion', 
                mensaje: 'Debes registrar tu dirección de envío en tu perfil antes de comprar.' 
            });
        }

        let total = 0;
        
        for (let item of productos) {
            const [prod] = await db.query('SELECT precio, stock FROM productos WHERE id = ?', [item.id]);
            if (prod.length === 0) return res.status(404).send(`Producto ${item.id} no existe`);
            
            if (prod[0].stock < item.cantidad) {
                return res.status(400).send(`Stock insuficiente para el producto ID: ${item.id}`);
            }
            total += prod[0].precio * item.cantidad;
        }

        const [resPedido] = await db.query('INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, "pendiente")', 
            [id_usuario, total]);
        
        const idPedido = resPedido.insertId;

        for (let item of productos) {
            const [prod] = await db.query('SELECT precio FROM productos WHERE id = ?', [item.id]);
            
            await db.query('INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)', 
                [idPedido, item.id, item.cantidad, prod[0].precio]);
            
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', 
                [item.cantidad, item.id]);
        }

        res.json({ mensaje: 'Compra realizada con exito', pedidoId: idPedido });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar la compra: ' + error.message);
    }
};

const obtenerPedidosAdmin = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.total, p.estado, p.fecha, u.nombre as cliente, 
                   d.direccion_calle, d.ciudad 
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN clientes_detalles d ON u.id = d.usuario_id
            ORDER BY p.fecha DESC
        `;
        const [pedidos] = await db.query(sql);
        res.json(pedidos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo pedidos');
    }
};

const obtenerMisPedidos = async (req, res) => {
    const id = req.session.usuarioID;
    try {
        const sql = `
            SELECT id, total, estado, fecha 
            FROM pedidos 
            WHERE usuario_id = ? 
            ORDER BY fecha DESC
        `;
        const [pedidos] = await db.query(sql, [id]);
        res.json(pedidos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener pedidos');
    }
};

const obtenerDetallesPedido = async (req, res) => {
    const idUsuario = req.session.usuarioID;
    const idPedido = req.params.id;

    try {
        const [pedido] = await db.query('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?', [idPedido, idUsuario]);
        
        if (pedido.length === 0) {
            return res.status(404).send('Pedido no encontrado');
        }

        const sqlDetalles = `
            SELECT dp.cantidad, dp.precio_unitario, p.nombre, p.imagen 
            FROM detalles_pedido dp
            JOIN productos p ON dp.producto_id = p.id
            WHERE dp.pedido_id = ?
        `;
        const [productos] = await db.query(sqlDetalles, [idPedido]);

        res.json({
            info: pedido[0],
            items: productos
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo detalles');
    }
};

const actualizarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; 

    try {
        await db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
        res.send('Estado del pedido actualizado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error actualizando pedido');
    }
};

const obtenerDetallesAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const [pedido] = await db.query(`
            SELECT p.*, u.nombre as cliente, u.email, 
                   d.telefono, d.direccion_calle, d.ciudad, d.estado as estado_dir, d.codigo_postal, d.instrucciones_envio
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN clientes_detalles d ON u.id = d.usuario_id
            WHERE p.id = ?
        `, [id]);

        if (pedido.length === 0) return res.status(404).send('Pedido no encontrado');

        const [items] = await db.query(`
            SELECT dp.cantidad, dp.precio_unitario, p.nombre, p.imagen
            FROM detalles_pedido dp
            JOIN productos p ON dp.producto_id = p.id
            WHERE dp.pedido_id = ?
        `, [id]);

        res.json({ info: pedido[0], items });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener detalles admin');
    }
};

const actualizarPedidoAdmin = async (req, res) => {
    const { id } = req.params;
    const { estado, comentarios } = req.body;

    try {
        await db.query('UPDATE pedidos SET estado = ?, comentarios_admin = ? WHERE id = ?', 
            [estado, comentarios, id]);
        res.send('Pedido actualizado correctamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error actualizando pedido');
    }
};

module.exports = { 
    crearPedido, 
    obtenerPedidosAdmin, 
    obtenerMisPedidos, 
    obtenerDetallesPedido, 
    actualizarEstadoPedido,
    obtenerDetallesAdmin,
    actualizarPedidoAdmin 
};