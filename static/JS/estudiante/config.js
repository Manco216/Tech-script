// Estado de la aplicación
let appState = {
    activeTab: 'perfil',
    isEditing: false,
    hasChanges: false,
    originalData: {},
    currentData: {
        // Perfil
        nombre: "María",
        apellido: "González Rodríguez",
        email: "maria.gonzalez@email.com",
        telefono: "+52 55 1234 5678",
        fechaNacimiento: "1995-03-15",
        pais: "México",
        biografia: "Estudiante apasionada por el desarrollo de software y las nuevas tecnologías. Actualmente cursando diplomados en programación web.",
        sitioWeb: "https://mariagonzalez.dev",
        github: "mariagonzalez",
        linkedin: "maria-gonzalez-dev",
        
        // Notificaciones y configuraciones
        emailCursos: true,
        emailTareas: true,
        emailMensajes: true,
        emailPromocion: false,
        pushCursos: true,
        pushTareas: true,
        smsTareas: true,
        perfilPublico: true,
        mostrarProgreso: true,
        mostrarCertificados: true,
        permitirMensajes: true,
        mostrarActividad: false,
        twoFactor: false
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeLucideIcons();
    initializeEventListeners();
    backupOriginalData();
    loadInitialData();
});

// Inicializar iconos de Lucide
function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Configurar todos los event listeners
function initializeEventListeners() {
    // Navegación entre pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.currentTarget.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Botón de editar perfil
    const editBtn = document.getElementById('edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', toggleEdit);
    }

    // Botones de guardar y cancelar
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveChanges);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelChanges);
    }

    // Inputs del formulario de perfil
    const profileInputs = [
        'nombre', 'apellido', 'email', 'telefono', 
        'fecha-nacimiento', 'pais', 'biografia',
        'sitio-web', 'github', 'linkedin'
    ];

    profileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', (e) => {
                handleInputChange(inputId, e.target.value);
            });
        }
    });

    // Switches para configuraciones
    document.querySelectorAll('input[type="checkbox"][data-setting]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const setting = e.target.getAttribute('data-setting');
            handleSettingChange(setting, e.target.checked);
        });
    });
}

// Respaldar datos originales
function backupOriginalData() {
    appState.originalData = JSON.parse(JSON.stringify(appState.currentData));
}

// Cargar datos iniciales en la interfaz
function loadInitialData() {
    // Cargar datos del perfil
    loadProfileData();
    
    // Cargar configuraciones de switches
    loadSwitchSettings();
}

// Cargar datos del perfil en los inputs
function loadProfileData() {
    const fieldMapping = {
        'nombre': 'nombre',
        'apellido': 'apellido',
        'email': 'email',
        'telefono': 'telefono',
        'fecha-nacimiento': 'fechaNacimiento',
        'pais': 'pais',
        'biografia': 'biografia',
        'sitio-web': 'sitioWeb',
        'github': 'github',
        'linkedin': 'linkedin'
    };

    Object.entries(fieldMapping).forEach(([inputId, dataKey]) => {
        const input = document.getElementById(inputId);
        if (input && appState.currentData[dataKey]) {
            input.value = appState.currentData[dataKey];
        }
    });

    // Actualizar nombre en la interfaz
    updateUserDisplayInfo();
}

// Cargar configuraciones de switches
function loadSwitchSettings() {
    document.querySelectorAll('input[type="checkbox"][data-setting]').forEach(checkbox => {
        const setting = checkbox.getAttribute('data-setting');
        if (appState.currentData[setting] !== undefined) {
            checkbox.checked = appState.currentData[setting];
        }
    });
}

// Cambiar entre pestañas
function switchTab(tabId) {
    // Actualizar botones de navegación
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Mostrar contenido de la pestaña
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');

    // Actualizar estado
    appState.activeTab = tabId;
}

// Alternar modo de edición
function toggleEdit() {
    appState.isEditing = !appState.isEditing;
    
    const editBtn = document.getElementById('edit-btn');
    const profileInputs = document.querySelectorAll('#perfil input, #perfil select, #perfil textarea');
    const avatarEditBtn = document.getElementById('avatar-edit');

    if (appState.isEditing) {
        editBtn.textContent = 'Cancelar';
        editBtn.className = 'btn btn-outline';
        
        profileInputs.forEach(input => {
            input.disabled = false;
        });
        
        if (avatarEditBtn) {
            avatarEditBtn.classList.remove('hidden');
        }
    } else {
        editBtn.textContent = 'Editar';
        editBtn.className = 'btn btn-primary';
        
        profileInputs.forEach(input => {
            input.disabled = true;
        });
        
        if (avatarEditBtn) {
            avatarEditBtn.classList.add('hidden');
        }
        
        // Si hay cambios sin guardar, restaurar datos originales
        if (appState.hasChanges) {
            restoreOriginalData();
        }
    }
}

// Manejar cambios en inputs del perfil
function handleInputChange(inputId, value) {
    const fieldMapping = {
        'nombre': 'nombre',
        'apellido': 'apellido',
        'email': 'email',
        'telefono': 'telefono',
        'fecha-nacimiento': 'fechaNacimiento',
        'pais': 'pais',
        'biografia': 'biografia',
        'sitio-web': 'sitioWeb',
        'github': 'github',
        'linkedin': 'linkedin'
    };

    const dataKey = fieldMapping[inputId];
    if (dataKey) {
        appState.currentData[dataKey] = value;
        checkForChanges();
        updateUserDisplayInfo();
    }
}

// Manejar cambios en configuraciones
function handleSettingChange(setting, checked) {
    appState.currentData[setting] = checked;
    checkForChanges();
}

// Verificar si hay cambios sin guardar
function checkForChanges() {
    const hasChanges = JSON.stringify(appState.currentData) !== JSON.stringify(appState.originalData);
    
    if (hasChanges !== appState.hasChanges) {
        appState.hasChanges = hasChanges;
        updateChangesAlert();
    }
}

// Actualizar alerta de cambios
function updateChangesAlert() {
    const changesAlert = document.getElementById('changes-alert');
    
    if (appState.hasChanges) {
        changesAlert.classList.remove('hidden');
    } else {
        changesAlert.classList.add('hidden');
    }
}

// Guardar cambios
function saveChanges() {
    // Aquí normalmente se enviaría la información al servidor
    console.log('Guardando cambios:', appState.currentData);
    
    // Simular guardado exitoso
    setTimeout(() => {
        // Actualizar datos originales con los cambios guardados
        appState.originalData = JSON.parse(JSON.stringify(appState.currentData));
        appState.hasChanges = false;
        updateChangesAlert();
        
        // Mostrar notificación de éxito (opcional)
        showNotification('Cambios guardados correctamente', 'success');
    }, 500);
}

// Cancelar cambios
function cancelChanges() {
    restoreOriginalData();
    appState.hasChanges = false;
    updateChangesAlert();
}

// Restaurar datos originales
function restoreOriginalData() {
    appState.currentData = JSON.parse(JSON.stringify(appState.originalData));
    loadInitialData();
}

// Actualizar información del usuario en la interfaz
function updateUserDisplayInfo() {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (userName) {
        userName.textContent = `${appState.currentData.nombre} ${appState.currentData.apellido}`;
    }
    
    if (userEmail) {
        userEmail.textContent = appState.currentData.email;
    }
}

// Mostrar notificaciones (opcional)
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background-color: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Función para validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar teléfono
function validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    return phoneRegex.test(phone);
}

// Función para validar URL
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return url === '' || url.startsWith('http://') || url.startsWith('https://');
    }
}

// Validar formulario antes de guardar
function validateForm() {
    let isValid = true;
    const errors = [];

    // Validar email
    if (!validateEmail(appState.currentData.email)) {
        errors.push('Email no válido');
        isValid = false;
    }

    // Validar teléfono
    if (appState.currentData.telefono && !validatePhone(appState.currentData.telefono)) {
        errors.push('Teléfono no válido');
        isValid = false;
    }

    // Validar sitio web
    if (appState.currentData.sitioWeb && !validateURL(appState.currentData.sitioWeb)) {
        errors.push('URL del sitio web no válida');
        isValid = false;
    }

    if (!isValid) {
        showNotification(`Errores de validación: ${errors.join(', ')}`, 'error');
    }

    return isValid;
}

// Event listener para el avatar edit button
document.addEventListener('DOMContentLoaded', function() {
    const avatarEditBtn = document.getElementById('avatar-edit');
    if (avatarEditBtn) {
        avatarEditBtn.addEventListener('click', function() {
            // Crear input file temporal
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const avatarImg = document.getElementById('avatar-img');
                        if (avatarImg) {
                            avatarImg.src = e.target.result;
                        }
                        appState.hasChanges = true;
                        updateChangesAlert();
                    };
                    reader.readAsDataURL(file);
                }
                document.body.removeChild(fileInput);
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
        });
    }
});

// Manejo de errores globales
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
});

// Función para exportar datos (para el botón de descarga)
function exportUserData() {
    const dataToExport = {
        perfil: appState.currentData,
        fechaExportacion: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mis_datos_plataforma.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Agregar event listeners para botones de la zona de peligro cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Botón de descarga de datos
    const downloadBtn = document.querySelector('.danger-item .btn-outline');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', exportUserData);
    }
    
    // Botón de eliminar cuenta
    const deleteBtn = document.querySelector('.danger-item .btn-danger');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                alert('Funcionalidad de eliminación de cuenta no implementada en este demo.');
            }
        });
    }
});