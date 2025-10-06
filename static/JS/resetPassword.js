console.log("✅ resetPassword.js cargado");

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('resetForm');
    const tokenInput = document.getElementById('token');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const confirmError = document.getElementById('confirmError');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    // Validar fuerza de contraseña
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        
        updateStrengthIndicator(strength);
        
        if (password.length > 0 && password.length < 6) {
            passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            passwordError.classList.add('show');
        } else {
            passwordError.classList.remove('show');
        }
    });
    
    // Validar que las contraseñas coincidan
    confirmPasswordInput.addEventListener('input', () => {
        if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
            confirmError.textContent = 'Las contraseñas no coinciden';
            confirmError.classList.add('show');
        } else {
            confirmError.classList.remove('show');
        }
    });
    
    // Enviar formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = tokenInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validaciones
        if (password.length < 6) {
            showError(passwordError, 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (password !== confirmPassword) {
            showError(confirmError, 'Las contraseñas no coinciden');
            return;
        }
        
        // Mostrar estado de carga
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/recovery/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Mostrar mensaje de éxito
                form.style.display = 'none';
                successMessage.classList.add('show');
                
                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                throw new Error(data.error || 'Error al restablecer la contraseña');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al procesar la solicitud');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
    
    // Calcular fuerza de contraseña
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 6) strength += 25;
        if (password.length >= 10) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
        
        return Math.min(strength, 100);
    }
    
    // Actualizar indicador de fuerza
    function updateStrengthIndicator(strength) {
        strengthFill.style.width = strength + '%';
        
        if (strength === 0) {
            strengthFill.style.backgroundColor = '#e1e5e9';
            strengthText.textContent = 'Ingresa una contraseña';
            strengthText.style.color = '#666';
        } else if (strength < 40) {
            strengthFill.style.backgroundColor = '#e74c3c';
            strengthText.textContent = 'Débil';
            strengthText.style.color = '#e74c3c';
        } else if (strength < 70) {
            strengthFill.style.backgroundColor = '#f39c12';
            strengthText.textContent = 'Media';
            strengthText.style.color = '#f39c12';
        } else {
            strengthFill.style.backgroundColor = '#27ae60';
            strengthText.textContent = 'Fuerte';
            strengthText.style.color = '#27ae60';
        }
    }
    
    // Mostrar error
    function showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
        
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
});