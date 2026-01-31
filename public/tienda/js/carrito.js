document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-carrito')) {
        renderizarCarrito();
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
        const res = await fetch('/api/public/comprar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productos: productosParaBackend })
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
            alert('¡Compra realizada con éxito!');
            localStorage.removeItem('carritoVivero');
            window.location.href = '../clientes/perfil.html';
        } else {
            alert('Hubo un error al procesar la compra.');
        }

    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}