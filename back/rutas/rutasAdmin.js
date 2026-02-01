const express = require('express');
const router = express.Router();
const productoCtrl = require('../controladores/productoControlador');
const pedidoCtrl = require('../controladores/pedidoControlador');
const adminUserCtrl = require('../controladores/adminUsuariosControlador');
const { verificarSesionAdmin } = require('../middleware/verificarSesion');

const subir = require('../middleware/gestorImagenes'); 

router.use(verificarSesionAdmin);

router.get('/dashboard-datos', async (req, res) => {
    const db = require('../configuracion/BaseDatos');
    try {
        const [ventas] = await db.query('SELECT SUM(total) as total FROM pedidos WHERE estado != "cancelado"');
        const [pendientes] = await db.query('SELECT COUNT(*) as total FROM pedidos WHERE estado = "pendiente"');
        const [stock] = await db.query('SELECT COUNT(*) as total FROM productos WHERE stock < 5');
        const [clientes] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"');
        
        res.json({
            ventasTotal: ventas[0].total || 0,
            pedidosPendientes: pendientes[0].total || 0,
            alertasStock: stock[0].total || 0,
            totalClientes: clientes[0].total || 0
        });
    } catch (error) {
        res.status(500).send('Error');
    }
});

router.get('/productos', productoCtrl.obtenerTodas);
router.post('/productos', subir.single('imagen'), productoCtrl.crearProducto);
router.put('/productos/:id', subir.single('imagen'), productoCtrl.editarProducto);

router.delete('/productos/:id', productoCtrl.eliminarProducto);
router.put('/productos/reabastecer/:id', productoCtrl.reabastecerStock);
router.get('/categorias', productoCtrl.obtenerCategorias);

router.get('/pedidos', pedidoCtrl.obtenerPedidosAdmin);
router.get('/pedidos/:id', pedidoCtrl.obtenerDetallesAdmin); 
router.get('/comprobante/:id', pedidoCtrl.generarComprobante);
router.put('/pedidos/:id', pedidoCtrl.actualizarPedidoAdmin);

router.get('/clientes', adminUserCtrl.obtenerClientes);
router.get('/clientes/:id', adminUserCtrl.obtenerUnCliente);
router.post('/clientes', adminUserCtrl.crearCliente);
router.put('/clientes/:id', adminUserCtrl.editarCliente);
router.delete('/clientes/:id', adminUserCtrl.eliminarCliente);

router.get('/inventario/alertas', async (req, res) => {
    const db = require('../configuracion/BaseDatos');
    const [alertas] = await db.query('SELECT * FROM productos WHERE stock < 5');
    res.json(alertas);
});

module.exports = router;