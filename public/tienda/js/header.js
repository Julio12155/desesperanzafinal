document.addEventListener('DOMContentLoaded', async () => {
    const navLink = document.getElementById('nav-login');
    if (!navLink) return;

    // Valor por defecto
    navLink.textContent = 'Iniciar Sesión';
    navLink.href = '../clientes/login.html';

    try {
        const res = await fetch('/api/auth/estado-sesion');
        if (res.ok) {
            const data = await res.json();
            if (data.autenticado) {
                // Usuario autenticado: mostrar "Mi perfil" o "Cerrar Sesión"
                navLink.textContent = 'Mi Perfil';
                navLink.href = '/api/auth/logout';
            } else {
                // Usuario no autenticado
                navLink.textContent = 'Iniciar Sesión';
                navLink.href = '../clientes/login.html';
            }
        } else {
            // Error en la respuesta
            navLink.textContent = 'Iniciar Sesión';
            navLink.href = '../clientes/login.html';
        }
    } catch (err) {
        console.error('Error comprobando sesión:', err);
        navLink.textContent = 'Iniciar Sesión';
        navLink.href = '../clientes/login.html';
    }
});