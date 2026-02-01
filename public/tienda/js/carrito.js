document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-carrito')) {
        renderizarCarrito();
        // Cargar dirección en segundo plano sin bloquear
        cargarDireccionEnCarrito();
    }
});

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('carritoVivero')) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('carritoVivero', JSON.stringify(carrito));
}

function agregarAlCarrito(id, nombre, precio, imagen, stockMaximo, cantidadSolicitada) {
    let carrito = obtenerCarrito();
    const itemExistente = carrito.find(p => p.id === id);
    const cantidadNueva = parseInt(cantidadSolicitada);

    if (itemExistente) {
        if (itemExistente.cantidad + cantidadNueva > stockMaximo) {
            alert(`Solo hay ${stockMaximo} unidades disponibles. Ya tienes ${itemExistente.cantidad} en el carrito.`);
            return;
        }
        itemExistente.cantidad += cantidadNueva;
    } else {
        if (cantidadNueva > stockMaximo) {
             alert(`Solo hay ${stockMaximo} unidades disponibles.`);
             return;
        }
        carrito.push({ 
            id, 
            nombre, 
            precio, 
            imagen, 
            cantidad: cantidadNueva,
            stockMax: stockMaximo 
        });
    }

    guardarCarrito(carrito);
    alert('Producto agregado al carrito');
}

function actualizarCantidad(id, cambio) {
    let carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === id);

    if (item) {
        const nuevaCantidad = item.cantidad + cambio;
        
        if (nuevaCantidad > item.stockMax) {
            alert('No hay más stock disponible');
            return;
        }

        if (nuevaCantidad < 1) {
            eliminarDelCarrito(id);
            return;
        }

        item.cantidad = nuevaCantidad;
        guardarCarrito(carrito);
        renderizarCarrito();
    }
}

function eliminarDelCarrito(id) {
    let carrito = obtenerCarrito();
    carrito = carrito.filter(p => p.id !== id);
    guardarCarrito(carrito);
    renderizarCarrito();
}

function renderizarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const elSubtotal = document.getElementById('subtotal');
    const elTotal = document.getElementById('total-final');
    
    if (!contenedor) return; 

    const carrito = obtenerCarrito();
    contenedor.innerHTML = '';

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding: 2rem;">Tu carrito está vacío. <a href="catalogo.html">Ir a comprar</a></p>';
        if(elSubtotal) elSubtotal.innerText = '$0.00';
        if(elTotal) elTotal.innerText = '$0.00';
        return;
    }

    let totalCalculado = 0;

    carrito.forEach(prod => {
        const subtotalProd = prod.precio * prod.cantidad;
        totalCalculado += subtotalProd;
        const imgUrl = prod.imagen ? `/imagenes/productos/${prod.imagen}` : 'https://via.placeholder.com/100';

        const div = document.createElement('div');
        div.className = 'item-carrito';
        div.innerHTML = `
            <img src="${imgUrl}" alt="${prod.nombre}" onerror="this.src='https://via.placeholder.com/100?text=Sin+Img'">
            <div class="item-info">
                <h4>${prod.nombre}</h4>
                <p>$${prod.precio}</p>
                <p style="font-size: 0.8rem; color: #888">Max: ${prod.stockMax}</p>
            </div>
            <div class="item-controles">
                <button onclick="actualizarCantidad(${prod.id}, -1)">-</button>
                <span>${prod.cantidad}</span>
                <button onclick="actualizarCantidad(${prod.id}, 1)">+</button>
            </div>
            <div class="item-subtotal">
                $${subtotalProd.toFixed(2)}
            </div>
            <button class="btn-eliminar" onclick="eliminarDelCarrito(${prod.id})">&times;</button>
        `;
        contenedor.appendChild(div);
    });

    if(elSubtotal) elSubtotal.innerText = `$${totalCalculado.toFixed(2)}`;
    if(elTotal) elTotal.innerText = `$${totalCalculado.toFixed(2)}`;
}

async function procesarCompra() {
    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    if (!confirm('¿Deseas finalizar tu compra?')) return;

    const productosParaBackend = carrito.map(p => ({
        id: p.id,
        cantidad: p.cantidad
    }));

    try {
        // Obtener ubicación del mapa (desde localStorage)
        const ubicacionGuardada = localStorage.getItem('ubicacionSeleccionada');
        
        if (!ubicacionGuardada) {
            alert('Por favor, selecciona una ubicación en el mapa antes de procesar la compra');
            return;
        }

        const ubicacion = JSON.parse(ubicacionGuardada);
        const { lat, lng, calle, numero, ciudad, estado, cp } = ubicacion;
        
        // Construir dirección completa
        const calleCompleta = numero ? `${calle} ${numero}` : calle;
        const direccion = `${calleCompleta}, ${ciudad}, ${estado} ${cp}`.trim();

        const datosCompra = {
            productos: productosParaBackend,
            direccion: direccion,
            lat: lat,
            lng: lng
        };

        console.log('Enviando compra con datos:', datosCompra);

        const res = await fetch('/api/public/comprar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCompra)
        });

        if (res.status === 401) {
            window.location.href = '../clientes/login.html';
            return;
        }

        if (res.status === 400) {
            const data = await res.json();
            alert(data.mensaje || 'Error en el pedido');
            if (data.error === 'Falta direccion') window.location.href = '../clientes/perfil.html';
            return;
        }

        if (res.ok) {
            const data = await res.json();
            alert('¡Compra realizada con éxito! Pedido #' + data.pedidoId);
            localStorage.removeItem('carritoVivero');
            localStorage.removeItem('ubicacionSeleccionada');
            window.location.href = '../clientes/perfil.html';
        } else {
            const error = await res.json();
            alert('Hubo un error: ' + (error.detalles || 'Error al procesar la compra'));
        }

    } catch (error) {
        console.error('Error en procesarCompra:', error);
        alert('Error: ' + error.message);
    }
}
  

async function cargarDireccionEnCarrito() {
    try {
        const res = await fetch('/api/public/mi-perfil');
        
        if (res.status === 401) {

            const textoDireccion = document.getElementById('texto-direccion');
            textoDireccion.innerHTML = `
                <strong style="color: var(--terracota);">⚠️ Debes iniciar sesión para ver tu dirección.</strong><br>
                <a href="../clientes/login.html" style="color: var(--verde-suave); text-decoration: underline;">Iniciar sesión</a>
            `;
            return;
        }
        
        if (res.ok) {
            const usuario = await res.json();
            const textoDireccion = document.getElementById('texto-direccion');
            
            if (usuario.direccion && usuario.direccion.trim()) {
                textoDireccion.innerHTML = `
                    <strong>Dirección de entrega:</strong><br>
                    ${usuario.direccion}
                `;
            } else {
                textoDireccion.innerHTML = `
                    <strong style="color: var(--terracota);">⚠️ No has establecido una dirección de entrega.</strong><br>
                    Por favor, <a href="../clientes/perfil.html" style="color: var(--verde-suave); text-decoration: underline;">configura tu dirección</a> antes de finalizar la compra.
                `;
            }
        } else {
            const textoDireccion = document.getElementById('texto-direccion');
            textoDireccion.innerHTML = `
                <strong style="color: var(--terracota);">⚠️ Error al cargar tu dirección.</strong><br>
                Por favor, <a href="../clientes/perfil.html" style="color: var(--verde-suave); text-decoration: underline;">establece tu dirección aquí</a>.
            `;
        }
    } catch (error) {
        console.log('Error cargando dirección:', error);
        const textoDireccion = document.getElementById('texto-direccion');
        if (textoDireccion) {
            textoDireccion.innerHTML = `
                <strong style="color: var(--terracota);">⚠️ No se pudo cargar tu dirección.</strong><br>
                Por favor, <a href="../clientes/perfil.html" style="color: var(--verde-suave); text-decoration: underline;">establece tu dirección aquí</a>.
            `;
        }
    }
    async function cambiarPassword(e) {
    e.preventDefault();
    
    const actual = document.getElementById('password-actual').value;
    const nueva = document.getElementById('password-nueva').value;
    const confirmar = document.getElementById('password-confirmar').value;

    // Validaciones
    if (nueva.length < 8) {
        alert('⚠️ La nueva contraseña debe tener al menos 8 caracteres');
        return;
    }

    if (nueva !== confirmar) {
        alert('⚠️ Las contraseñas no coinciden');
        return;
    }

    try {
        const res = await fetch('/api/public/mi-perfil/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password_actual: actual,
                password_nueva: nueva
            })
        });

        if (res.ok) {
            alert('✅ Contraseña actualizada correctamente');
            document.getElementById('form-password').reset();
        } else {
            const error = await res.json();
            alert('❌ Error: ' + (error.mensaje || 'Contraseña actual incorrecta'));
        }
    } catch (error) {
        console.error(error);
        alert('❌ Error de conexión');
    }
}
}