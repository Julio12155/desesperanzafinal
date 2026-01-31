const express = require('express');
const router = express.Router();
const productoCtrl = require('../controladores/productoControlador');
const clienteCtrl = require('../controladores/clienteControlador');
const pedidoCtrl = require('../controladores/pedidoControlador');
const { soloUsuarios } = require('../middleware/verificarSesion');

router.get('/productos', productoCtrl.obtenerTodas);
router.get('/productos/top', productoCtrl.obtenerTopStock);
router.get('/productos/:id', productoCtrl.obtenerUna);
router.get('/categorias', productoCtrl.obtenerCategorias);

router.get('/mi-perfil', soloUsuarios, clienteCtrl.obtenerPerfil);
router.post('/mi-perfil/direccion', soloUsuarios, clienteCtrl.guardarDetallesEnvio);
router.get('/mis-pedidos', soloUsuarios, pedidoCtrl.obtenerMisPedidos);
router.get('/mis-pedidos/:id', soloUsuarios, pedidoCtrl.obtenerDetallesPedido);

router.post('/comprar', soloUsuarios, pedidoCtrl.crearPedido);

module.exports = router;