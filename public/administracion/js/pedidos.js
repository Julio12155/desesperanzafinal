document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();
});

const modal = document.getElementById('modalPedido');
let pedidoActualId = null;

function cerrarModal() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) cerrarModal();
}

async function cargarPedidos() {
    try {
        const res = await fetch('/api/admin/pedidos');
        const pedidos = await res.json();
        
        const tbody = document.getElementById('tabla-pedidos');
        tbody.innerHTML = '';

        pedidos.forEach(p => {
            const fecha = new Date(p.fecha).toLocaleDateString();
            let clase = 'status-pendiente';
            if (p.estado === 'entregado') clase = 'status-entregado';
            if (p.estado === 'cancelado') clase = 'status-cancelado';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${p.id}</td>
                <td>${p.cliente}</td>
                <td>${fecha}</td>
                <td>$${p.total}</td>
                <td><span class="status-badge ${clase}">${p.estado}</span></td>
                <td>
                    <button class="action-btn" onclick="verPedido(${p.id})">Administrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
    }
}

async function verPedido(id) {
    pedidoActualId = id;
    try {
        const res = await fetch(`/api/admin/pedidos/${id}`);
        const data = await res.json();
        const info = data.info;

        document.getElementById('txt-id').textContent = info.id;
        document.getElementById('txt-cliente').value = info.cliente;
        document.getElementById('txt-telefono').value = info.telefono || 'Sin teléfono';
        
        const dir = `${info.direccion_calle || ''}, ${info.ciudad || ''}, ${info.estado_dir || ''}, CP: ${info.codigo_postal || ''}\nRef: ${info.instrucciones_envio || ''}`;
        document.getElementById('txt-direccion').value = dir;
        
        document.getElementById('sel-estado').value = info.estado;
        document.getElementById('txt-total').value = `$${info.total}`;
        document.getElementById('txt-comentarios').value = info.comentarios_admin || '';

        const tbody = document.getElementById('lista-items');
        tbody.innerHTML = '';
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td width="50"><img src="/imagenes/productos/${item.imagen}" style="width:40px;height:40px;object-fit:cover;"></td>
                <td>${item.nombre}</td>
                <td>${item.cantidad} x $${item.precio_unitario}</td>
                <td style="text-align:right;">$${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        modal.style.display = 'block';
    } catch (error) {
        console.error(error);
        alert('Error cargando pedido');
    }
}

document.getElementById('formEstado').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pedidoActualId) return;

    const estado = document.getElementById('sel-estado').value;
    const comentarios = document.getElementById('txt-comentarios').value;

    try {
        const res = await fetch(`/api/admin/pedidos/${pedidoActualId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado, comentarios })
        });

        if (res.ok) {
            alert('Pedido actualizado');
            cerrarModal();
            cargarPedidos();
        } else {
            alert('Error al guardar');
        }
    } catch (error) {
        console.error(error);
    }
});