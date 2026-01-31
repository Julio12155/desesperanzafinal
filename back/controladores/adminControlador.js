const db = require('../configuracion/BaseDatos');

const verUsuarios = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, nombre, email, rol FROM usuarios');
        res.json(users);
    } catch (error) {
        res.status(500).send('Error listando usuarios');
    }
};

const borrarUsuario = async (req, res) => {
    const { id } = req.params;
    if (id == req.session.usuarioID) return res.status(400).send('No puedes borrarte tu mismo');

    try {
        await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.send('Usuario eliminado del sistema');
    } catch (error) {
        res.status(500).send('Error eliminando usuario');
    }
};

const datosDashboard = async (req, res) => {
    try {
        const [ventas] = await db.query('SELECT SUM(total) as total FROM pedidos WHERE estado = "entregado"');
        
        const [pendientes] = await db.query('SELECT COUNT(*) as total FROM pedidos WHERE estado = "pendiente"');
        
        const [bajoStock] = await db.query('SELECT COUNT(*) as total FROM productos WHERE stock < 10');
        
        const [clientes] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"');

        res.json({
            ventasTotal: ventas[0].total || 0,
            pedidosPendientes: pendientes[0].total,
            alertasStock: bajoStock[0].total,
            totalClientes: clientes[0].total
        });
    } catch (error) {
        res.status(500).send('Error calculando dashboard');
    }
};

module.exports = { verUsuarios, borrarUsuario, datosDashboard };