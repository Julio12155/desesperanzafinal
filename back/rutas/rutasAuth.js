const express = require('express');
const router = express.Router();
const authCtrl = require('../controladores/authControlador');

router.post('/registro', authCtrl.registrar);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.cerrarSesion);
router.get('/estado-sesion', authCtrl.verificarEstadoSesion);

module.exports = router;