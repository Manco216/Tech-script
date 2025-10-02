document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const sidebar = document.getElementById('sidebar');
    const toggleBtns = document.querySelectorAll('#toggleSidebar, #toggleSidebarTop');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');
    
    let isEditing = false;
    let originalData = {};

    // ================== SIDEBAR TOGGLE ==================
    function initSidebar() {
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed');
                
                // Guardar estado en localStorage
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
        });

        // Restaurar estado del sidebar
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // ================== SISTEMA DE TABS ==================
    function initTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Remover active de todos los botones y contenidos
                tabBtns.forEach(tb => tb.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                
                // Activar el tab seleccionado
                this.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Efectos especiales por tab
                handleTabEffects(targetTab);
            });
        });
    }

    function handleTabEffects(tabName) {
        switch(tabName) {
            case 'analytics':
                animateProgressBars();
                break;
            case 'achievements':
                animateAchievements();
                break;
            case 'courses':
                animateCoursesGrid();
                break;
        }
    }

    // ================== EDICIÓN DE PERFIL ==================
    function initProfileEditing() {
        if (!editProfileBtn || !profileForm) return;

        editProfileBtn.addEventListener('click', function() {
            toggleEditMode();
        });

        // Cancelar edición
        const cancelBtn = profileForm.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                cancelEditMode();
            });
        }

        // Guardar cambios
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }

    function toggleEditMode() {
        isEditing = !isEditing;
        
        if (isEditing) {
            // Guardar datos originales
            saveOriginalData();
            editProfileBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
            editProfileBtn.classList.add('cancel-mode');
            
            // Enfocar primer campo
            const firstInput = profileForm.querySelector('input');
            if (firstInput) firstInput.focus();
            
        } else {
            cancelEditMode();
        }
    }

    function saveOriginalData() {
        const inputs = profileForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            originalData[input.id] = input.value;
        });
    }

    function cancelEditMode() {
        isEditing = false;
        editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
        editProfileBtn.classList.remove('cancel-mode');
        
        // Restaurar datos originales
        Object.keys(originalData).forEach(key => {
            const input = document.getElementById(key);
            if (input) input.value = originalData[key];
        });
        
        showNotification('Cambios cancelados', 'info');
    }

    function saveProfileChanges() {
        // Simular guardado (aquí irían las llamadas a la API)
        const formData = new FormData(profileForm);
        const data = Object.fromEntries(formData);
        
        console.log('Guardando datos:', data);
        
        // Simular delay de red
        const saveBtn = profileForm.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Guardando...';
        saveBtn.disabled = true;
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            isEditing = false;
            editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
            editProfileBtn.classList.remove('cancel-mode');
            
            showNotification('Perfil actualizado correctamente', 'success');
            updateProfileDisplay(data);
        }, 1500);
    }

    function updateProfileDisplay(data) {
        // Actualizar nombre en el topbar
        const userInfo = document.querySelector('.user-info');
        if (userInfo && data.firstName && data.lastName) {
            userInfo.textContent = `${data.firstName} ${data.lastName}`;
        }

        // Actualizar nombre principal
        const profileName = document.querySelector('.profile-name');
        if (profileName && data.firstName && data.lastName) {
            profileName.textContent = `${data.firstName} ${data.lastName}`;
        }

        // Actualizar email
        const profileEmail = document.querySelector('.profile-email');
        if (profileEmail && data.email) {
            profileEmail.textContent = data.email;
        }
    }

    // ================== ANIMACIONES ==================
    function animateProgressBars() {
        const progressBars = document.querySelectorAll('.metric-progress');
        progressBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.width = bar.style.width || '0%';
            }, index * 200);
        });
    }

    function animateAchievements() {
        const achievements = document.querySelectorAll('.achievement-item');
        achievements.forEach((achievement, index) => {
            achievement.style.opacity = '0';
            achievement.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                achievement.style.transition = 'all 0.6s ease';
                achievement.style.opacity = '1';
                achievement.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    function animateCoursesGrid() {
        const courses = document.querySelectorAll('.course-card');
        courses.forEach((course, index) => {
            course.style.opacity = '0';
            course.style.transform = 'scale(0.9) translateY(20px)';
            
            setTimeout(() => {
                course.style.transition = 'all 0.6s ease';
                course.style.opacity = '1';
                course.style.transform = 'scale(1) translateY(0)';
            }, index * 100);
        });
    }

    // ================== EFECTOS HOVER Y INTERACTIVIDAD ==================
    function initHoverEffects() {
        // Efecto ripple para botones
        const buttons = document.querySelectorAll('.save-btn, .course-details-btn, .edit-profile-btn');
        buttons.forEach(button => {
            button.addEventListener('click', createRippleEffect);
        });

        // Efectos para stat cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Efectos para nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Si no es un enlace real, prevenir navegación
                if (this.getAttribute('href') === '#') {
                    e.preventDefault();
                }
                
                // Actualizar navegación activa
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function createRippleEffect(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('div');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            width: ${size}px;
            height: ${size}px;
            left: ${e.clientX - rect.left - size/2}px;
            top: ${e.clientY - rect.top - size/2}px;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // ================== SISTEMA DE NOTIFICACIONES ==================
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            min-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-cerrar
        setTimeout(() => {
            closeNotification(notification);
        }, 5000);
        
        // Cerrar manualmente
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => closeNotification(notification));
    }

    function closeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    function getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    function getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #047857)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
        };
        return colors[type] || colors.info;
    }

    // ================== DATOS SIMULADOS ==================
    function loadSimulatedData() {
        // Simular carga de actividad reciente
        setTimeout(() => {
            const activityItems = document.querySelectorAll('.activity-item');
            activityItems.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.style.transition = 'all 0.5s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 150);
            });
        }, 500);
    }

    // ================== UTILIDADES ==================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ================== RESPONSIVE HANDLING ==================
    function handleResize() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
        }
    }

    // ================== INICIALIZACIÓN ==================
    function init() {
        initSidebar();
        initTabs();
        initProfileEditing();
        initHoverEffects();
        loadSimulatedData();
        
        // Event listeners para responsive
        window.addEventListener('resize', debounce(handleResize, 250));
        
        // CSS animations keyframes
        addCustomStyles();
        
        console.log('Perfil de instructor inicializado correctamente');
    }

    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
                margin-left: 1rem;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .edit-profile-btn.cancel-mode {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            
            .tab-btn:hover {
                background: rgba(99, 102, 241, 0.1);
            }
            
            .achievement-item:hover .achievement-icon {
                transform: scale(1.1) rotate(5deg);
            }
            
            .course-card:hover .course-details-btn {
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    // Inicializar la aplicación
    init();
});

// ================== FUNCIONES GLOBALES ADICIONALES ==================

// Función para actualizar estadísticas (puede ser llamada desde el servidor)
function updateStats(newStats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((stat, index) => {
        const targetValue = newStats[index];
        animateValue(stat, 0, targetValue, 2000);
    });
}

// Animación de números
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Función para agregar nueva actividad
function addActivity(activity) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="activity-icon ${activity.type}">
            <i class="fas fa-${activity.icon}"></i>
        </div>
        <div class="activity-info">
            <h4>${activity.title}</h4>
            <p>${activity.description}</p>
            <span class="activity-time">${activity.time}</span>
        </div>
    `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Animar entrada
    activityItem.style.opacity = '0';
    activityItem.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        activityItem.style.transition = 'all 0.5s ease';
        activityItem.style.opacity = '1';
        activityItem.style.transform = 'translateY(0)';
    }, 100);
}