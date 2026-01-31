document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCategorias();
});

const modal = document.getElementById('modalProducto');
const form = document.getElementById('formProducto');
const tituloModal = document.getElementById('tituloModal');

function abrirModal(modo = 'crear', producto = null) {
    modal.style.display = 'block';
    if (modo === 'editar' && producto) {
        tituloModal.textContent = 'Editar Producto';
        document.getElementById('prodId').value = producto.id;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('stock').value = producto.stock;
        document.getElementById('categoria').value = producto.categoria_id || '';
    } else {
        tituloModal.textContent = 'Nuevo Producto';
        form.reset();
        document.getElementById('prodId').value = '';
    }
}

function cerrarModal() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        cerrarModal();
    }
}

async function cargarProductos() {
    try {
        const res = await fetch('/api/public/productos'); 
        const productos = await res.json();
        
        const tbody = document.getElementById('tabla-productos');
        tbody.innerHTML = '';

        productos.forEach(prod => {
            const imgUrl = prod.imagen ? `/imagenes/productos/${prod.imagen}` : 'https://via.placeholder.com/50';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${imgUrl}" class="table-img" alt="img"></td>
                <td>${prod.nombre}</td>
                <td>${prod.nombre_categoria || 'Sin categoría'}</td>
                <td>$${prod.precio}</td>
                <td>${prod.stock}</td>
                <td>
                    <button class="action-btn" onclick='prepararEdicion(${JSON.stringify(prod)})'>Editar</button>
                    <button class="action-btn btn-danger" onclick="eliminarProducto(${prod.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
    }
}

async function cargarCategorias() {
    try {
        const res = await fetch('/api/admin/categorias');
        if(res.ok){
            const categorias = await res.json();
            const select = document.getElementById('categoria');
            select.innerHTML = '<option value="">Seleccione...</option>';
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error(error);
    }
}

function prepararEdicion(producto) {
    abrirModal('editar', producto);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prodId').value;
    const formData = new FormData();
    
    formData.append('nom', document.getElementById('nombre').value);
    formData.append('desc', document.getElementById('descripcion').value);
    formData.append('prec', document.getElementById('precio').value);
    formData.append('stock', document.getElementById('stock').value);
    formData.append('categoria', document.getElementById('categoria').value);
    
    const fileInput = document.getElementById('imagen');
    if (fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]);
    }

    const url = id ? `/api/admin/productos/${id}` : '/api/admin/productos';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            body: formData
        });

        if (res.ok) {
            alert('Producto guardado correctamente');
            cerrarModal();
            cargarProductos();
        } else {
            alert('Error al guardar');
        }
    } catch (error) {
        console.error(error);
    }
});

async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const res = await fetch(`/api/admin/productos/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarProductos();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error(error);
    }
}