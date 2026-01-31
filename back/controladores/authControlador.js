const db = require('../configuracion/BaseDatos');
const bcrypt = require('bcryptjs');

const registrar = async (req, res) => {
    const { nom, correo, contra } = req.body;

    const regexSeguro = /^[^<>]+$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nom || !correo || !contra) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    if (!regexSeguro.test(nom) || !regexSeguro.test(correo) || !regexSeguro.test(contra)) {
        return res.status(400).send('Caracteres no permitidos detectados (< o >)');
    }

    if (!regexEmail.test(correo)) {
        return res.status(400).send('Formato de correo inválido');
    }

    if (contra.length < 8) {
        return res.status(400).send('La contraseña debe tener al menos 8 caracteres');
    }

    try {
        const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [correo]);
        if (existe.length > 0) return res.status(400).send('El correo ya está registrado');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contra, salt);

        await db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "cliente")', 
            [nom, correo, hash]);
        
        res.send('Registro exitoso');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};

const login = async (req, res) => {
    const { correo, contra } = req.body;

    try {
        const [user] = await db.query('SELECT * FROM usuarios WHERE email = ?', [correo]);

        if (user.length === 0) {
            return res.status(401).send('Credenciales incorrectas');
        }

        const valida = await bcrypt.compare(contra, user[0].password);
        
        if (!valida) {
            return res.status(401).send('Credenciales incorrectas');
        }

        req.session.usuarioID = user[0].id;
        req.session.rol = user[0].rol;
        req.session.nombre = user[0].nombre;

        res.json({ 
            mensaje: 'Entrando...', 
            rol: user[0].rol,
            usuario: user[0].nombre 
        });

    } catch (error) {
        res.status(500).send('Error al iniciar sesion');
    }
};

const cerrarSesion = (req, res) => {
    req.session.destroy();
    res.redirect('/clientes/login.html');
};

const verificarEstadoSesion = (req, res) => {
    if (req.session.usuarioID) {
        res.json({ 
            autenticado: true, 
            rol: req.session.rol 
        });
    } else {
        res.json({ autenticado: false });
    }
};

module.exports = { registrar, login, cerrarSesion, verificarEstadoSesion };