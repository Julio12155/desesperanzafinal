document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
    cargarPedidos();
    configurarFormulario();
    configurarAvatar();
});

function configurarFormulario() {
    const formulario = document.getElementById('form-cuenta');
    if (formulario) {
        formulario.addEventListener('submit', guardarCuenta);
    }
}

function configurarAvatar() {
    const inputAvatar = document.getElementById('inputAvatar');
    if (inputAvatar) {
        inputAvatar.addEventListener('change', cargarAvatar);
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
        const res = await fetch('/api/public/mi-perfil', { credentials: 'same-origin' });
        if (res.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (!res.ok) throw new Error('Error al cargar perfil');
        
        const data = await res.json();

        document.getElementById('nombre-usuario').textContent = data.nombre || 'Usuario';
        document.getElementById('email-usuario').textContent = data.email || '';
        
        // Mostrar avatar si existe, sino mostrar letra inicial
        const avatarLetra = document.getElementById('avatar-letra');
        const avatarImg = document.getElementById('avatar-imagen');
        
        if (data.avatar) {
            // Si tiene avatar guardado, mostrar la imagen
            avatarImg.src = `/imagenes/perfiles/${data.avatar}?t=${Date.now()}`;
            avatarImg.style.display = 'block';
            avatarLetra.style.display = 'none';
        } else {
            // Si no tiene avatar, mostrar letra inicial
            avatarLetra.textContent = data.nombre?.charAt(0).toUpperCase() || 'U';
            avatarLetra.style.display = 'flex';
            avatarImg.style.display = 'none';
        }

        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('tel').value = data.telefono || '';

    } catch (error) {
        console.error('Error cargando perfil:', error);
        document.getElementById('nombre-usuario').textContent = 'Error al cargar';
    }
}
async function cargarAvatar(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Validar tipo de archivo
    const tipos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!tipos.includes(archivo.type)) {
        alert('Solo se permiten imágenes (jpeg, jpg, png, gif)');
        e.target.value = '';
        return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
        alert('La imagen no debe pesar más de 5MB');
        e.target.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('avatar', archivo);

    try {
        console.log('Enviando archivo al servidor...');
        const res = await fetch('/api/public/mi-perfil/avatar', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        console.log('Respuesta del servidor:', res.status, res.statusText);

        if (res.ok) {
            const data = await res.json();
            console.log('Avatar actualizado:', data);
            
            mostrarNotificacion('✓ Foto de perfil actualizada correctamente');
            
            // Actualizar la imagen mostrada
            const avatarImg = document.getElementById('avatar-imagen');
            const avatarLetra = document.getElementById('avatar-letra');
            
            avatarImg.src = `/imagenes/perfiles/${data.avatar}?t=${Date.now()}`;
            avatarImg.style.display = 'block';
            avatarLetra.style.display = 'none';
            
            // Limpiar input
            e.target.value = '';
        } else {
            const error = await res.text();
            console.error('Error del servidor:', error);
            alert('Error: ' + error);
        }
    } catch (error) {
        console.error('Error al cargar avatar:', error);
        alert('Error de conexión: ' + error.message);
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
            credentials: 'same-origin',
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
        const res = await fetch('/api/public/mis-pedidos', { credentials: 'same-origin' });
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
                    <button class="action-btn" style="margin-top: 5px; margin-right: 8px;" onclick="verDetallesPedido(${p.id})">Ver Detalles</button>
                    <button class="action-btn" style="margin-top: 5px; background: #2a5f2a;" onclick="descargarComprobante(${p.id})">📥 Comprobante</button>
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
        const res = await fetch(`/api/public/mis-pedidos/${id}`, { credentials: 'same-origin' });
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

function descargarComprobante(id) {
    window.open(`/api/public/comprobante/${id}`, '_blank');
}

window.onclick = function(event) {
    const modal = document.getElementById('modalDetalle');
    if (event.target == modal) {
        cerrarModal();
    }
}