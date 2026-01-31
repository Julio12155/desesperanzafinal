document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
});

const modal = document.getElementById('modalCliente');
const form = document.getElementById('formCliente');
const tituloModal = document.getElementById('tituloModal');

function abrirModal(modo = 'crear', cliente = null) {
    modal.style.display = 'block';
    if (modo === 'editar' && cliente) {
        tituloModal.textContent = 'Editar Cliente';
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('nombre').value = cliente.nombre;
        document.getElementById('email').value = cliente.email;
        document.getElementById('password').value = ''; 
        document.getElementById('password').required = false;
    } else {
        tituloModal.textContent = 'Nuevo Cliente';
        form.reset();
        document.getElementById('clienteId').value = '';
        document.getElementById('password').required = true;
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

async function cargarClientes() {
    try {
        const res = await fetch('/api/admin/clientes');
        const clientes = await res.json();
        
        const tbody = document.getElementById('tabla-clientes');
        tbody.innerHTML = '';

        clientes.forEach(c => {
            const fecha = new Date(c.fecha_registro).toLocaleDateString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${c.id}</td>
                <td>${c.nombre}</td>
                <td>${c.email}</td>
                <td>${fecha}</td>
                <td>
                    <button class="action-btn" onclick='prepararEdicion(${JSON.stringify(c)})'>Editar</button>
                    <button class="action-btn btn-danger" onclick="eliminarCliente(${c.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
    }
}

function prepararEdicion(cliente) {
    abrirModal('editar', cliente);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('clienteId').value;
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const datos = { nombre, email, password };
    const url = id ? `/api/admin/clientes/${id}` : '/api/admin/clientes';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert('Cliente guardado correctamente');
            cerrarModal();
            cargarClientes();
        } else {
            const txt = await res.text();
            alert(txt);
        }
    } catch (error) {
        console.error(error);
    }
});

async function eliminarCliente(id) {
    if (!confirm('¿Seguro que deseas eliminar a este cliente? Se borrarán sus pedidos.')) return;

    try {
        const res = await fetch(`/api/admin/clientes/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarClientes();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error(error);
    }
}