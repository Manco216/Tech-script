console.log("✅ recuperarContrasena.js cargado");

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('recoveryForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const backLink = document.querySelector('.back-link');
    
    // Validación de email en tiempo real
    emailInput.addEventListener('input', () => {
        if (emailInput.value && !isValidEmail(emailInput.value)) {
            emailError.textContent = 'Por favor ingresa un email válido';
            emailError.classList.add('show');
            emailInput.style.borderColor = '#e74c3c';
        } else {
            emailError.classList.remove('show');
            emailInput.style.borderColor = '#e1e5e9';
        }
    });
    
    // Enviar formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Validar email
        if (!email) {
            showError('Por favor ingresa tu email');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('Por favor ingresa un email válido');
            return;
        }
        
        // Mostrar estado de carga
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/recovery/api/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Ocultar formulario y mostrar mensaje de éxito
                form.style.display = 'none';
                successMessage.classList.add('show');
                
                // Redirigir después de 5 segundos
                setTimeout(() => {
                    window.location.href = '/login';
                }, 5000);
            } else {
                throw new Error(data.error || 'Error al enviar el email');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Error al procesar la solicitud');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
    
    // Redirigir al login
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login';
        });
    }
    
    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Función para mostrar errores
    function showError(message) {
        emailError.textContent = message;
        emailError.classList.add('show');
        emailInput.style.borderColor = '#e74c3c';
        emailInput.focus();
        
        setTimeout(() => {
            emailError.classList.remove('show');
            emailInput.style.borderColor = '#e1e5e9';
        }, 5000);
    }
});