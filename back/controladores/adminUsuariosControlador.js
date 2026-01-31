const db = require('../configuracion/BaseDatos');
const bcrypt = require('bcryptjs');

const obtenerClientes = async (req, res) => {
    try {
        const sql = `
            SELECT id, nombre, email, fecha_registro 
            FROM usuarios 
            WHERE rol = 'cliente' 
            ORDER BY id DESC
        `;
        const [clientes] = await db.query(sql);
        res.json(clientes);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener clientes');
    }
};

const crearCliente = async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) return res.status(400).send('El correo ya existe');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "cliente")', 
            [nombre, email, hash]);
        
        res.send('Cliente creado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear cliente');
    }
};

const editarCliente = async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password } = req.body;

    try {
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await db.query('UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ? AND rol = "cliente"', 
                [nombre, email, hash, id]);
        } else {
            await db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ? AND rol = "cliente"', 
                [nombre, email, id]);
        }
        res.send('Cliente actualizado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar');
    }
};

const eliminarCliente = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM usuarios WHERE id = ? AND rol = "cliente"', [id]);
        res.send('Cliente eliminado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar');
    }
};

const obtenerUnCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const [user] = await db.query('SELECT id, nombre, email FROM usuarios WHERE id = ? AND rol = "cliente"', [id]);
        if (user.length === 0) return res.status(404).send('Cliente no encontrado');
        res.json(user[0]);
    } catch (error) {
        res.status(500).send('Error del servidor');
    }
};

module.exports = { obtenerClientes, crearCliente, editarCliente, eliminarCliente, obtenerUnCliente };