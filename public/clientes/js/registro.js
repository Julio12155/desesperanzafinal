document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const contra = document.getElementById('contra').value;
    const confirmar = document.getElementById('confirmar').value;
    const errorMsg = document.getElementById('mensajeError');

    errorMsg.style.display = 'none';

    if (contra.length < 8) {
        mostrarError('La contraseña debe tener al menos 8 caracteres');
        return;
    }

    if (contra !== confirmar) {
        mostrarError('Las contraseñas no coinciden');
        return;
    }


    const regexSeguro = /^[^<>]+$/;
    if (!regexSeguro.test(nombre) || !regexSeguro.test(correo) || !regexSeguro.test(contra)) {
        mostrarError('No se permiten caracteres especiales como < o >');
        return;
    }

    try {
        const respuesta = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom: nombre, correo, contra })
        });

        if (respuesta.ok) {
            alert('¡Registro exitoso! Por favor inicia sesión.');
            window.location.href = 'login.html';
        } else {
            const texto = await respuesta.text();
            mostrarError(texto);
        }
    } catch (error) {
        console.error(error);
        mostrarError('Error de conexión con el servidor');
    }

    function mostrarError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});