const db = require('../configuracion/BaseDatos');

const crearPedido = async (req, res) => {
    const id_usuario = req.session.usuarioID; 
    const { productos, direccion, lat, lng } = req.body; 

    try {
        // Validar que hay dirección
        if (!direccion || direccion.trim() === '') {
            return res.status(400).json({ 
                error: 'Falta direccion', 
                mensaje: 'Debes registrar tu dirección de envío en tu perfil antes de comprar.' 
            });
        }

        // Verificar que el usuario tiene detalles guardados
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

        // Crear pedido con dirección y coordenadas
        const [resPedido] = await db.query(
            'INSERT INTO pedidos (usuario_id, total, estado, direccion_entrega, latitud, longitud) VALUES (?, ?, "pendiente", ?, ?, ?)', 
            [id_usuario, total, direccion, lat || null, lng || null]
        );
        
        const idPedido = resPedido.insertId;

        // Guardar detalles del pedido
        for (let item of productos) {
            const [prod] = await db.query('SELECT precio FROM productos WHERE id = ?', [item.id]);
            
            await db.query('INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)', 
                [idPedido, item.id, item.cantidad, prod[0].precio]);
            
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', 
                [item.cantidad, item.id]);
        }

        res.json({ 
            mensaje: 'Compra realizada con exito', 
            pedidoId: idPedido 
        });

    } catch (error) {
        console.error('Error en crearPedido:', error);
        res.status(500).json({ 
            error: 'Error al procesar la compra', 
            detalles: error.message 
        });
    }
};

const obtenerPedidosAdmin = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.total, p.estado, p.fecha, u.nombre as cliente,
                   -- Preferir la dirección guardada en el pedido, si no usar la del perfil del cliente
                   COALESCE(p.direccion_entrega, CONCAT(d.direccion_calle, ' ', d.ciudad)) as direccion_entrega,
                   p.latitud, p.longitud
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
                   d.telefono, d.direccion_calle, d.ciudad, d.estado as estado_dir, d.codigo_postal, d.instrucciones_envio,
                   -- Incluir dirección/coords del pedido (si existen)
                   p.direccion_entrega as pedido_direccion, p.latitud as pedido_latitud, p.longitud as pedido_longitud
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

const generarComprobante = async (req, res) => {
    const idPedido = req.params.id;
    const idUsuario = req.session.usuarioID;

    try {
        // Obtener datos del pedido (cliente si es usuario, sin restricción si es admin)
        let query, params;
        
        if (req.session.rol === 'admin') {
            query = `
                SELECT p.*, u.nombre as cliente, u.email
                FROM pedidos p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = ?
            `;
            params = [idPedido];
        } else {
            query = `
                SELECT p.*, u.nombre as cliente, u.email
                FROM pedidos p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = ? AND p.usuario_id = ?
            `;
            params = [idPedido, idUsuario];
        }

        const [pedido] = await db.query(query, params);
        if (pedido.length === 0) {
            return res.status(404).send('Pedido no encontrado');
        }

        const [items] = await db.query(`
            SELECT dp.cantidad, dp.precio_unitario, p.nombre
            FROM detalles_pedido dp
            JOIN productos p ON dp.producto_id = p.id
            WHERE dp.pedido_id = ?
        `, [idPedido]);

        const info = pedido[0];
        const fecha = new Date(info.fecha).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Generar HTML del comprobante
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Comprobante de Venta #${info.id}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Georgia', serif;
                    background: white;
                    padding: 20px;
                }
                .comprobante {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 3px solid #1a1a1a;
                    padding: 40px;
                    background: white;
                    box-shadow: 0 0 15px rgba(0,0,0,0.2);
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 3px solid #1a1a1a;
                    padding-bottom: 20px;
                    background: linear-gradient(to bottom, #f5f5f5, white);
                }
                .header h1 {
                    font-size: 32px;
                    color: #1a1a1a;
                    margin-bottom: 5px;
                    font-weight: bold;
                    letter-spacing: 2px;
                }
                .header p {
                    color: #555;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .section {
                    margin-bottom: 25px;
                }
                .section-title {
                    background: #1a1a1a;
                    color: white;
                    padding: 10px 15px;
                    font-weight: bold;
                    margin-bottom: 12px;
                    font-size: 12px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #ddd;
                }
                .info-label {
                    font-weight: bold;
                    color: #1a1a1a;
                    width: 40%;
                }
                .info-value {
                    color: #333;
                    text-align: right;
                    width: 60%;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                th {
                    background: #1a1a1a;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                td {
                    padding: 11px 12px;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 13px;
                    color: #333;
                }
                tbody tr:hover {
                    background: #f9f9f9;
                }
                tr:last-child td {
                    border-bottom: 2px solid #1a1a1a;
                }
                .total-section {
                    text-align: right;
                    margin-top: 25px;
                    border-top: 3px solid #1a1a1a;
                    padding-top: 20px;
                }
                .total-row {
                    display: flex;
                    justify-content: flex-end;
                    gap: 40px;
                    margin-bottom: 12px;
                }
                .total-label {
                    font-weight: bold;
                    font-size: 16px;
                    color: #1a1a1a;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .total-value {
                    font-weight: bold;
                    font-size: 20px;
                    color: #1a1a1a;
                    min-width: 180px;
                    text-align: right;
                    font-family: 'Courier New', monospace;
                }
                .footer {
                    text-align: center;
                    margin-top: 35px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 11px;
                    line-height: 1.6;
                }
                .numero-venta {
                    background: #f0f0f0;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 25px;
                    border-left: 4px solid #1a1a1a;
                }
                .numero-venta p {
                    color: #666;
                    font-size: 11px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .numero-venta .numero {
                    font-size: 28px;
                    font-weight: bold;
                    color: #1a1a1a;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 2px;
                }
                @media print {
                    body {
                        padding: 0;
                        background: white;
                    }
                    .comprobante {
                        max-width: 100%;
                        box-shadow: none;
                        margin: 0;
                        padding: 20px;
                    }
                    .print-btn {
                        display: none;
                    }
                }
                .print-btn {
                    display: block;
                    margin: 0 auto 30px auto;
                    padding: 12px 40px;
                    background: #1a1a1a;
                    color: white;
                    border: none;
                    border-radius: 0;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                }
                .print-btn:hover {
                    background: #333;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">Imprimir / Descargar PDF</button>
            
            <div class="comprobante">
                <div class="header">
                    <h1>La Desesperanza</h1>
                    <p>Comprobante de Venta</p>
                </div>

                <div class="numero-venta">
                    <p>Número de Venta</p>
                    <div class="numero">#${String(info.id).padStart(6, '0')}</div>
                </div>

                <div class="section">
                    <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
                    <div class="info-row">
                        <span class="info-label">Nombre:</span>
                        <span class="info-value">${info.cliente}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${info.email}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">INFORMACIÓN DE LA COMPRA</div>
                    <div class="info-row">
                        <span class="info-label">Fecha de Compra:</span>
                        <span class="info-value">${fecha}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <span class="info-value">${info.estado}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">PRODUCTOS COMPRADOS</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.nombre}</td>
                                    <td style="text-align: center;">${item.cantidad}</td>
                                    <td style="text-align: right;">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                    <td style="text-align: right;">$${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="total-section">
                    <div class="total-row">
                        <span class="total-label">Total a Pagar:</span>
                        <span class="total-value">$${parseFloat(info.total).toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Gracias por su compra en La Desesperanza</p>
                    <p>Este comprobante es válido como recibo de compra</p>
                    <p style="margin-top: 10px; font-size: 10px;">Emitido: ${fecha}</p>
                </div>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Error generando comprobante:', error);
        res.status(500).send('Error al generar comprobante');
    }
};

module.exports = { 
    crearPedido, 
    obtenerPedidosAdmin, 
    obtenerMisPedidos, 
    obtenerDetallesPedido, 
    actualizarEstadoPedido,
    obtenerDetallesAdmin,
    actualizarPedidoAdmin,
    generarComprobante 
};