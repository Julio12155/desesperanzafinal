const db = require('../configuracion/BaseDatos');

const esNumero = (valor) => !isNaN(valor) && valor !== '' && valor !== null;
const esTextoValido = (texto) => typeof texto === 'string' && texto.trim().length > 0;


const obtenerTodas = async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.nombre as nombre_categoria 
            FROM productos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id
        `;
        const [plantas] = await db.query(sql);
        res.json(plantas);
    } catch (error) {
        console.error("ERROR SQL:", error.message);
        res.status(500).send('Error interno del servidor');
    }
};

const obtenerTopStock = async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.nombre as nombre_categoria 
            FROM productos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.stock DESC
            LIMIT 3
        `;
        const [plantas] = await db.query(sql);
        res.json(plantas);
    } catch (error) {
        res.status(500).send('Error obteniendo top productos');
    }
};

const obtenerUna = async (req, res) => {
    const { id } = req.params;
    if (!esNumero(id)) return res.status(400).send('ID inválido');

    try {
        const [planta] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
        if (planta.length === 0) return res.status(404).send('Producto no encontrado');
        res.json(planta[0]);
    } catch (error) {
        res.status(500).send('Error del servidor');
    }
};

const obtenerCategorias = async (req, res) => {
    try {
        const [cats] = await db.query('SELECT * FROM categorias');
        res.json(cats);
    } catch (error) {
        res.status(500).send('Error obteniendo categorías');
    }
};


const crearProducto = async (req, res) => {
    const { nom, desc, prec, stock, categoria } = req.body;
    const imagen = req.file ? req.file.filename : null; 

    if (!esTextoValido(nom) || !esNumero(prec)) {
        return res.status(400).send('Datos inválidos');
    }

    try {
        await db.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen) VALUES (?, ?, ?, ?, ?, ?)',
            [nom, desc, prec, stock, categoria, imagen]
        );
        res.send('Producto creado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear producto');
    }
};

const editarProducto = async (req, res) => {
    const { id } = req.params;
    const { nom, desc, prec, stock, categoria } = req.body;
    
    const nuevaImagen = req.file ? req.file.filename : null;

    try {
        let sql;
        let params;

        if (nuevaImagen) {
            sql = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?, categoria_id=?, imagen=? WHERE id=?';
            params = [nom, desc, prec, stock, categoria, nuevaImagen, id];
        } else {
            sql = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?, categoria_id=? WHERE id=?';
            params = [nom, desc, prec, stock, categoria, id];
        }

        await db.query(sql, params);
        res.send('Producto actualizado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al editar');
    }
};

const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM productos WHERE id = ?', [id]);
        res.send('Producto eliminado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar');
    }
};

const reabastecerStock = async (req, res) => {
    const { id } = req.params;
    const { cantidad } = req.body; 

    if (!esNumero(id) || !esNumero(cantidad)) return res.status(400).send('Datos inválidos');

    try {
        await db.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, id]);
        res.send('Inventario actualizado');
    } catch (error) {
        res.status(500).send('Error reabasteciendo');
    }
};

module.exports = { 
    obtenerTodas, 
    obtenerTopStock,
    obtenerUna, 
    obtenerCategorias, 
    crearProducto,      
    editarProducto,     
    eliminarProducto,   
    reabastecerStock
};