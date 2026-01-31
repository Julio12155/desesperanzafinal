

const soloAdmin = (req, res, next) => {
    if (req.session.usuarioID && req.session.rol === 'admin') {
        next();
    } else {
        res.status(403).send('Acceso denegado: Solo administradores');
    }
};
const verificarSesionAdmin = (req, res, next) => {
    if (req.session && req.session.usuarioID && req.session.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado', mensaje: 'Requiere permisos de administrador' });
    }
};

const soloUsuarios = (req, res, next) => {
    if (req.session && req.session.usuarioID) {
        next();
    } else {
        res.status(401).json({ error: 'No autenticado', mensaje: 'Debes iniciar sesión para realizar esta acción' });
    }
};

module.exports = { verificarSesionAdmin, soloUsuarios,soloAdmin };

