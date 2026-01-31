const db = require('../configuracion/BaseDatos');

const obtenerPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    try {
        const query = `
            SELECT u.nombre, u.email, u.avatar, d.telefono, d.direccion_calle, d.ciudad, d.estado, d.codigo_postal, d.instrucciones_envio 
            FROM usuarios u 
            LEFT JOIN clientes_detalles d ON u.id = d.usuario_id 
            WHERE u.id = ?
        `;
        const [datos] = await db.query(query, [id]);
        res.json(datos[0]);
    } catch (error) {
        res.status(500).send('Error recuperando perfil');
    }
};

const guardarDetallesEnvio = async (req, res) => {
    const id = req.session.usuarioID;
    const { tel, calle, ciudad, estado, cp, instrucc } = req.body;

    try {
        const [existe] = await db.query('SELECT id FROM clientes_detalles WHERE usuario_id = ?', [id]);

        if (existe.length > 0) {
            await db.query(`
                UPDATE clientes_detalles 
                SET telefono=?, direccion_calle=?, ciudad=?, estado=?, codigo_postal=?, instrucciones_envio=? 
                WHERE usuario_id=?`, 
                [tel, calle, ciudad, estado, cp, instrucc, id]);
        } else {
            await db.query(`
                INSERT INTO clientes_detalles (usuario_id, telefono, direccion_calle, ciudad, estado, codigo_postal, instrucciones_envio)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, tel, calle, ciudad, estado, cp, instrucc]);
        }
        res.send('Información de envío guardada');
    } catch (error) {
        res.status(500).send('Error guardando dirección');
    }
};

module.exports = { obtenerPerfil, guardarDetallesEnvio };