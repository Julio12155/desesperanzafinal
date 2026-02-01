document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
    cargarPedidos();
    configurarFormulario();
});

function configurarFormulario() {
    const formulario = document.getElementById('form-cuenta');
    if (formulario) {
        formulario.addEventListener('submit', guardarCuenta);
    }
}
function cambiarTab(tabId) {
    document.querySelectorAll('.seccion').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-opciones button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
}

function mostrarNotificacion(mensaje) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--verde-suave);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

async function cargarPerfil() {
    try {
        const res = await fetch('/api/public/mi-perfil');
        if (res.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (!res.ok) throw new Error('Error al cargar perfil');
        
        const data = await res.json();


        document.getElementById('nombre-usuario').textContent = data.nombre || 'Usuario';
        document.getElementById('email-usuario').textContent = data.email || '';
        document.getElementById('avatar-letra').textContent = data.nombre?.charAt(0).toUpperCase() || 'U';


        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('tel').value = data.telefono || '';

    } catch (error) {
        console.error('Error cargando perfil:', error);
        document.getElementById('nombre-usuario').textContent = 'Error al cargar';
    }
}
async function guardarCuenta(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const tel = document.getElementById('tel').value.trim();
    const contra = document.getElementById('contra').value.trim();
    const confirmar = document.getElementById('confirmar').value.trim();

    if (!nombre || !email) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    // Validar cambio de contraseña
    if (contra || confirmar) {
        // Si al menos uno de los campos tiene valor
        if (!contra || !confirmar) {
            alert('Por favor completa ambos campos de contraseña');
            return;
        }
        if (contra.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (contra !== confirmar) {
            alert('Las contraseñas no coinciden');
            return;
        }
    }

    const boton = document.querySelector('.btn-guardar');
    const textoOriginal = boton.textContent;
    boton.textContent = 'Guardando...';
    boton.disabled = true;

    const datos = {
        nombre,
        email,
        telefono: tel
    };

    // Solo agregar contraseña si se proporcionó
    if (contra) {
        datos.contraseña = contra;
    }

    try {
        const res = await fetch('/api/public/mi-perfil/actualizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            mostrarNotificacion('✓ Datos de cuenta guardados correctamente');
            
            // Limpiar campos de contraseña después de guardar
            document.getElementById('contra').value = '';
            document.getElementById('confirmar').value = '';

            await cargarPerfil();
        } else {
            const error = await res.text();
            alert('Error: ' + error);
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error de conexión al guardar los datos');
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}


async function cargarPedidos() {
    try {
        const res = await fetch('/api/public/mis-pedidos');
        const pedidos = await res.json();
        
        const contenedor = document.getElementById('lista-pedidos');
        contenedor.innerHTML = '';

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p>No tienes pedidos aún.</p>';
            return;
        }

        pedidos.forEach(p => {
            const fecha = new Date(p.fecha).toLocaleDateString();
            let clase = 'status-pendiente';
            if (p.estado === 'entregado') clase = 'status-entregado';

            const div = document.createElement('div');
            div.className = 'pedido-item';
            div.innerHTML = `
                <div>
                    <strong>Pedido #${p.id}</strong>
                    <p style="font-size: 0.9rem; color: #666;">${fecha}</p>
                    <button class="action-btn" style="margin-top: 5px;" onclick="verDetallesPedido(${p.id})">Ver Detalles</button>
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: bold; font-size: 1.1rem;">$${p.total}</p>
                    <span class="status-badge ${clase}">${p.estado}</span>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}

async function verDetallesPedido(id) {
    try {
        const res = await fetch(`/api/public/mis-pedidos/${id}`);
        if (!res.ok) return alert('Error cargando detalles');
        
        const data = await res.json();
        const pedido = data.info;
        const items = data.items;

        document.getElementById('detalle-id').textContent = pedido.id;
        document.getElementById('detalle-fecha').textContent = new Date(pedido.fecha).toLocaleString();
        document.getElementById('detalle-estado').textContent = pedido.estado;
        document.getElementById('detalle-total').textContent = pedido.total;

        const containerItems = document.getElementById('detalle-items');
        containerItems.innerHTML = '';

        items.forEach(item => {
            const subtotal = item.precio_unitario * item.cantidad;
            const div = document.createElement('div');
            div.className = 'detalle-row';
            div.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="font-weight: bold; color: var(--verde-acento);">${item.cantidad}x</span>
                    <span>${item.nombre}</span>
                    <span style="font-size: 0.85rem; color: #666;">($${item.precio_unitario} c/u)</span>
                </div>
                <span>$${subtotal.toFixed(2)}</span>
            `;
            containerItems.appendChild(div);
        });

        document.getElementById('modalDetalle').style.display = 'block';

    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}

function cerrarModal() {
    document.getElementById('modalDetalle').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalDetalle');
    if (event.target == modal) {
        cerrarModal();
    }
}