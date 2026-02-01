const multer = require('multer');
const path = require('path');

const almacenamiento = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/imagenes/perfiles');
    },
    filename: function (req, file, cb) {
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + unico + path.extname(file.originalname));
    }
});

const filtro = (req, file, cb) => {
    const tipos = /jpeg|jpg|png|gif/;
    const ext = tipos.test(path.extname(file.originalname).toLowerCase());
    
    if (ext) {
        return cb(null, true);
    }
    cb(new Error('Solo se permiten imagenes (jpeg, jpg, png, gif)'));
};

const subirPerfil = multer({ storage: almacenamiento, fileFilter: filtro });

module.exports = subirPerfil;
