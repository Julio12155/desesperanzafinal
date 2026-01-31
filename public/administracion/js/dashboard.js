document.addEventListener('DOMContentLoaded', async () => {
    cargarEstadisticas();
    cargarPedidosRecientes();
    cargarAlertasInventario();
    verificarSesionAdmin();
});

async function verificarSesionAdmin() {
    try {
        const res = await fetch('/api/admin/dashboard-datos');
        if (res.status === 401 || res.status === 403) {
            window.location.href = '../clientes/login.html';
        }
    } catch (error) {
        console.error(error);
    }
}

async function cargarEstadisticas() {
    try {
        const res = await fetch('/api/admin/dashboard-datos');
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('stat-ventas').textContent = `$${data.ventasTotal}`;
        document.getElementById('stat-pedidos').textContent = data.pedidosPendientes;
        document.getElementById('stat-stock').textContent = data.alertasStock;
        document.getElementById('stat-clientes').textContent = data.totalClientes;
    } catch (error) {
        console.error(error);
    }
}

async function cargarPedidosRecientes() {
    try {
        const res = await fetch('/api/admin/pedidos');
        if (!res.ok) return;
        const pedidos = await res.json();
        
        const tbody = document.getElementById('tabla-pedidos');
        tbody.innerHTML = '';

        pedidos.slice(0, 5).forEach(pedido => {
            const fecha = new Date(pedido.fecha).toLocaleDateString();
            let claseEstado = 'status-pendiente';
            if (pedido.estado === 'entregado') claseEstado = 'status-entregado';
            if (pedido.estado === 'cancelado') claseEstado = 'status-cancelado';

            const row = `
                <tr>
                    <td>#${pedido.id}</td>
                    <td>${pedido.cliente}</td>
                    <td>$${pedido.total}</td>
                    <td><span class="status-badge ${claseEstado}">${pedido.estado}</span></td>
                    <td>${fecha}</td>
                    <td>
                        <button class="action-btn" onclick="verPedido(${pedido.id})">Ver</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error(error);
    }
}

async function cargarAlertasInventario() {
    try {
        const res = await fetch('/api/admin/inventario/alertas');
        if (!res.ok) return;
        const productos = await res.json();

        const tbody = document.getElementById('tabla-alertas');
        tbody.innerHTML = '';

        productos.forEach(prod => {
            const row = `
                <tr>
                    <td>${prod.nombre}</td>
                    <td>${prod.stock} unidades</td>
                    <td><span class="status-badge status-cancelado">Bajo Stock</span></td>
                    <td>
                        <button class="action-btn" onclick="reabastecer(${prod.id})">Reabastecer</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error(error);
    }
}

async function reabastecer(id) {
    const cantidad = prompt("¿Cuántas unidades deseas agregar al stock?");
    if (!cantidad) return;

    try {
        const res = await fetch(`/api/admin/productos/reabastecer/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: parseInt(cantidad) })
        });
        
        if (res.ok) {
            alert('Inventario actualizado');
            cargarAlertasInventario();
            cargarEstadisticas();
        }
    } catch (error) {
        console.error(error);
    }
}

function verPedido(id) {
    alert('Funcionalidad de detalles en construcción para el pedido #' + id);
}