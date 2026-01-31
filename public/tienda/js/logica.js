document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedor-productos');

    try {
        const respuesta = await fetch('/api/public/productos');
        
        if (!respuesta.ok) throw new Error('Error al obtener productos');
        
        const productos = await respuesta.json();

        contenedor.innerHTML = '';

        if (productos.length === 0) {
            contenedor.innerHTML = '<p>No hay productos disponibles por el momento.</p>';
            return;
        }

        productos.forEach(producto => {
            const hayStock = producto.stock > 0;
            const textoBoton = hayStock ? 'Comprar' : 'Agotado';
            const claseBoton = hayStock ? 'btn-comprar' : 'btn-comprar sin-stock';
            const accion = hayStock ? `comprarProducto(${producto.id})` : '';

            const imagenUrl = producto.imagen 
                ? `/imagenes/productos/${producto.imagen}` 
                : 'https://via.placeholder.com/300x250?text=Sin+Imagen';

            const tarjeta = document.createElement('div');
            tarjeta.className = 'producto-card';
            tarjeta.innerHTML = `
                <img src="${imagenUrl}" alt="${producto.nombre}" class="producto-img" onerror="this.src='https://via.placeholder.com/300x250?text=Error+Imagen'">
                <div class="producto-info">
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion || 'Sin descripción disponible.'}</p>
                    <p class="producto-precio">$${producto.precio}</p>
                    <button class="${claseBoton}" onclick="${accion}" ${!hayStock ? 'disabled' : ''}>
                        ${textoBoton}
                    </button>
                </div>
            `;
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="color: var(--terracota)">Error cargando el catálogo.</p>';
    }
});

async function comprarProducto(id) {
    try {
        const res = await fetch('/api/public/comprar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productos: [{ id: id, cantidad: 1 }] 
            })
        });

        if (res.status === 401) {
            alert('Por favor inicia sesión para comprar.');
            window.location.href = '../clientes/login.html';
            return;
        }
        
        if (res.status === 400) {
                const data = await res.json();
                alert(data.mensaje || 'Error en la compra');
                if(data.error === 'Falta direccion') window.location.href = '../clientes/perfil.html';
                return;
        }

        if (res.ok) {
            alert('¡Compra realizada con éxito!');
            location.reload();
        } else {
            alert('Hubo un problema con la compra');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}