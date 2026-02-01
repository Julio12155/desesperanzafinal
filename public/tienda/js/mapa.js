let mapaInstancia = null;
let marcadorActual = null;

const CDMX_COORDS = [19.4326, -99.1332];

// Función para inicializar el mapa cuando sea necesario
function inicializarMapaCarrito() {
    if (document.readyState === 'loading') {
        // El DOM aún se está cargando
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('mapa-entrega')) {
                inicializarMapa();
                configurarBotones();
            }
        });
    } else {
        // El DOM ya está listo
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
        console.log('No se pudo cargar la ubicación del usuario:', error);
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
                console.error('Error al obtener ubicación:', error);
                alert('No se pudo acceder a tu ubicación. Asegúrate de haber dado permiso.');
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
        
        console.log('Ubicación actualizada:', lat, lng);
    }
}

async function geocodificarInversa(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'es' } }
        );
        
        if (res.ok) {
            const data = await res.json();
            const address = data.address;
            
            const calle = address.road || '';
            const numero = address.house_number || '';
            const ciudad = address.city || address.town || address.village || '';
            const estado = address.state || '';
            const cp = address.postcode || '';
            
            // Solo actualizar campos de formulario si existen en la página
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
            
            console.log('Datos geocodificados guardados en localStorage');
        }
    } catch (error) {
        console.log('Error en geocodificación inversa:', error);
    }
}

// Inicializar mapa cuando se carga el script
inicializarMapaCarrito();