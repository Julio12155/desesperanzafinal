let mapaInstancia = null;
let marcadorActual = null;

const CDMX_COORDS = [19.4326, -99.1332];

function inicializarMapaCarrito() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('mapa-entrega')) {
                inicializarMapa();
                configurarBotones();
            }
        });
    } else {
        if (document.getElementById('mapa-entrega')) {
            inicializarMapa();
            configurarBotones();
        }
    }
}

function inicializarMapa() {
    const coordenadasDefecto = CDMX_COORDS; 

    mapaInstancia = L.map('mapa-entrega').setView(coordenadasDefecto, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(mapaInstancia);

    marcadorActual = agregarMarcador(coordenadasDefecto, 'Ubicación de entrega');

    cargarDireccionDelUsuario();

    mapaInstancia.on('click', (e) => {
        actualizarUbicacionMapa(e.latlng.lat, e.latlng.lng, 'Ubicación seleccionada');
    });
}

function agregarMarcador(coords, titulo) {
    const marcador = L.marker(coords).addTo(mapaInstancia);
    marcador.bindPopup(`<b>${titulo}</b>`).openPopup();
    return marcador;
}

async function cargarDireccionDelUsuario() {
    try {
        const res = await fetch('/api/public/mi-perfil');
        if (res.ok) {
            const usuario = await res.json();
            if (usuario.coordenadas) {
                const coords = typeof usuario.coordenadas === 'string' 
                    ? JSON.parse(usuario.coordenadas) 
                    : usuario.coordenadas;
                
                if (coords.lat && coords.lng) {
                    actualizarUbicacionMapa(coords.lat, coords.lng, 'Tu dirección guardada');
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

function configurarBotones() {
    const btnUbicacion = document.getElementById('btn-ubicacion-actual');
    if (btnUbicacion) {
        btnUbicacion.addEventListener('click', usarUbicacionActual);
    }
}

function usarUbicacionActual() {
    const btnUbicacion = document.getElementById('btn-ubicacion-actual');
    btnUbicacion.textContent = '⏳ Buscando ubicación...';
    btnUbicacion.disabled = true;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const { latitude, longitude } = posicion.coords;
                actualizarUbicacionMapa(latitude, longitude, 'Mi ubicación actual');
                btnUbicacion.textContent = '✓ Ubicación actualizada';
                setTimeout(() => {
                    btnUbicacion.textContent = '📍 Usar mi ubicación actual';
                    btnUbicacion.disabled = false;
                }, 2000);
            },
            (error) => {
                console.error(error);
                alert('No se pudo acceder a tu ubicación.');
                btnUbicacion.textContent = '📍 Usar mi ubicación actual';
                btnUbicacion.disabled = false;
            }
        );
    } else {
        alert('Tu navegador no soporta geolocalización.');
        btnUbicacion.textContent = '📍 Usar mi ubicación actual';
        btnUbicacion.disabled = false;
    }
}

function actualizarUbicacionMapa(lat, lng, titulo) {
    if (mapaInstancia) {
        mapaInstancia.setView([lat, lng], 15);

        if (marcadorActual) {
            mapaInstancia.removeLayer(marcadorActual);
        }

        marcadorActual = agregarMarcador([lat, lng], titulo);

        geocodificarInversa(lat, lng);
    }
}

async function geocodificarInversa(lat, lng) {
    try {
        const res = await fetch(`/api/geocoding/reverse?lat=${lat}&lon=${lng}`);
        
        if (res.ok) {
            const data = await res.json();
            const address = data.address;
            
            const calle = address.road || '';
            const numero = address.house_number || '';
            const ciudad = address.city || address.town || address.village || '';
            const estado = address.state || '';
            const cp = address.postcode || '';
            
            const campoCalle = document.getElementById('calle');
            if (campoCalle) {
                campoCalle.value = numero ? `${calle} ${numero}` : calle;
            }
            if (document.getElementById('ciudad')) document.getElementById('ciudad').value = ciudad;
            if (document.getElementById('estado')) document.getElementById('estado').value = estado;
            if (document.getElementById('cp')) document.getElementById('cp').value = cp;

            localStorage.setItem('ubicacionSeleccionada', JSON.stringify({
                lat: lat,
                lng: lng,
                calle: calle,
                numero: numero,
                ciudad: ciudad,
                estado: estado,
                cp: cp,
                timestamp: new Date().toISOString()
            }));
        }
    } catch (error) {
        console.log(error);
    }
}

inicializarMapaCarrito();