const db = require('../configuracion/BaseDatos');
const bcrypt = require('bcryptjs');

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

const actualizarPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    const { nombre, email, telefono, contraseña } = req.body;

    try {
        // Validar que email no esté ya en uso por otro usuario
        const [emailExistente] = await db.query(
            'SELECT id FROM usuarios WHERE email = ? AND id != ?',
            [email, id]
        );

        if (emailExistente.length > 0) {
            return res.status(400).send('El correo electrónico ya está en uso');
        }

        // Preparar datos para actualización
        let updateQuery = 'UPDATE usuarios SET nombre = ?, email = ?';
        let params = [nombre, email];

        // Si se proporciona contraseña, hashearla e incluirla
        if (contraseña) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(contraseña, salt);
            updateQuery += ', password = ?';
            params.push(hash);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        // Actualizar datos del usuario
        await db.query(updateQuery, params);

        // Actualizar teléfono en clientes_detalles
        if (telefono) {
            const [existe] = await db.query(
                'SELECT id FROM clientes_detalles WHERE usuario_id = ?',
                [id]
            );

            if (existe.length > 0) {
                await db.query(
                    'UPDATE clientes_detalles SET telefono = ? WHERE usuario_id = ?',
                    [telefono, id]
                );
            } else {
                await db.query(
                    'INSERT INTO clientes_detalles (usuario_id, telefono) VALUES (?, ?)',
                    [id, telefono]
                );
            }
        }

        res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error actualizando perfil');
    }
};

const actualizarAvatar = async (req, res) => {
    try {
        // Validar sesión
        if (!req.session || !req.session.usuarioID) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const id = req.session.usuarioID;
        
        // Validar que hay archivo
        if (!req.file) {
            return res.status(400).json({ error: 'No se cargó ninguna imagen' });
        }

        const nuevoAvatar = req.file.filename;
        console.log(`Actualizando avatar para usuario ${id}:`, nuevoAvatar);

        // Actualizar en BD
        await db.query(
            'UPDATE usuarios SET avatar = ? WHERE id = ?',
            [nuevoAvatar, id]
        );

        res.json({ 
            mensaje: 'Avatar actualizado correctamente', 
            avatar: nuevoAvatar 
        });
    } catch (error) {
        console.error('Error actualizando avatar:', error);
        res.status(500).json({ error: 'Error al actualizar avatar' });
    }
};

module.exports = { obtenerPerfil, guardarDetallesEnvio, actualizarPerfil, actualizarAvatar };