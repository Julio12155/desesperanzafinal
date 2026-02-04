const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'vivero_secreto_key',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { 
        secure: true,
        sameSite: 'lax'
    }
}));

app.get('/api/geocoding/reverse', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Faltan coordenadas' });
    }
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: {
                'User-Agent': 'ViveroApp/1.0'
            }
        });
        
        if (!response.ok) throw new Error('Error externo');
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error geocodificación:', error);
        res.status(500).json({ error: 'Error al obtener dirección' });
    }
});

const rutasAuth = require('./back/rutas/rutasAuth');
const rutasAdmin = require('./back/rutas/rutasAdmin');
const rutasPublicas = require('./back/rutas/rutasPublicas');

app.use('/api/auth', rutasAuth);
app.use('/api/admin', rutasAdmin);
app.use('/api/public', rutasPublicas);

app.use('/administracion', (req, res, next) => {
    if (req.session && req.session.usuarioID && req.session.rol === 'admin') {
        next(); 
    } else {
        res.redirect('/clientes/login.html'); 
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/tienda/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});