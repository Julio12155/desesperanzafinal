const express = require('express');
const router = express.Router();
const productoCtrl = require('../controladores/productoControlador');
const clienteCtrl = require('../controladores/clienteControlador');
const pedidoCtrl = require('../controladores/pedidoControlador');
const { soloUsuarios } = require('../middleware/verificarSesion');
const subirPerfil = require('../middleware/gestorImagenesPerfil');

router.get('/productos', productoCtrl.obtenerTodas);
router.get('/productos/top', productoCtrl.obtenerTopStock);
router.get('/productos/:id', productoCtrl.obtenerUna);
router.get('/categorias', productoCtrl.obtenerCategorias);

router.get('/mi-perfil', soloUsuarios, clienteCtrl.obtenerPerfil);
router.post('/mi-perfil/actualizar', soloUsuarios, clienteCtrl.actualizarPerfil);
router.post('/mi-perfil/avatar', soloUsuarios, subirPerfil.single('avatar'), clienteCtrl.actualizarAvatar);
router.post('/mi-perfil/direccion', soloUsuarios, clienteCtrl.guardarDetallesEnvio);
router.get('/mis-pedidos', soloUsuarios, pedidoCtrl.obtenerMisPedidos);
router.get('/mis-pedidos/:id', soloUsuarios, pedidoCtrl.obtenerDetallesPedido);
router.get('/comprobante/:id', soloUsuarios, pedidoCtrl.generarComprobante);

router.post('/comprar', soloUsuarios, pedidoCtrl.crearPedido);

module.exports = router;