document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedor-productos');
    try {
        const res = await fetch('/api/public/productos'); 
        const productos = await res.json();
        
        contenedor.innerHTML = '';
        
        if (productos.length === 0) {
            contenedor.innerHTML = '<p>No hay productos disponibles.</p>';
            return;
        }

        productos.forEach(p => renderizarProducto(p, contenedor));
    } catch (error) {
        console.error(error);
    }
});

function renderizarProducto(producto, contenedor) {
    const hayStock = producto.stock > 0;
    const stockClass = hayStock ? 'stock-info' : 'stock-info stock-agotado';
    const textoStock = hayStock ? `Disponibles: ${producto.stock}` : 'Agotado';
    const textoBoton = hayStock ? 'Agregar' : 'Sin Stock';
    const claseBoton = hayStock ? 'btn-comprar' : 'btn-comprar sin-stock';
    const imgUrl = producto.imagen ? `/imagenes/productos/${producto.imagen}` : 'https://via.placeholder.com/300x250?text=Sin+Imagen';

    const card = document.createElement('div');
    card.className = 'producto-card';
    card.innerHTML = `
        <img src="${imgUrl}" class="producto-img" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/300x250?text=Error+Imagen'">
        <div class="producto-info">
            <h3>${producto.nombre}</h3>
            <p style="font-size: 0.8rem; color: #888;">${producto.nombre_categoria || 'General'}</p>
            <p class="${stockClass}">${textoStock}</p>
            <p>${producto.descripcion || ''}</p>
            <p class="producto-precio">$${producto.precio}</p>
            
            <div class="controls-compra">
                <input type="number" id="cant-${producto.id}" class="input-cantidad" value="1" min="1" max="${producto.stock}" ${!hayStock ? 'disabled hidden' : ''}>
                <button class="${claseBoton}" onclick="clickComprar(${producto.id}, '${producto.nombre}', ${producto.precio}, '${producto.imagen}', ${producto.stock})" ${!hayStock ? 'disabled' : ''}>
                    ${textoBoton}
                </button>
            </div>
        </div>
    `;
    contenedor.appendChild(card);
}

function clickComprar(id, nombre, precio, imagen, stock) {
    const input = document.getElementById(`cant-${id}`);
    const cantidad = parseInt(input.value);

    if (cantidad < 1) {
        alert("La cantidad debe ser al menos 1");
        return;
    }
    
    if (cantidad > stock) {
        alert(`No puedes agregar más de ${stock} unidades.`);
        return;
    }

    agregarAlCarrito(id, nombre, precio, imagen, stock, cantidad);
}

function filtrar(tipo) {
    alert('Funcionalidad de filtro en construcción. Mostrando todos.');
}