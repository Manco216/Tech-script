// Variables globales
let sidebarOpen = false;
let currentTab = 'history';

// InicializaciÃ³n cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadPaymentHistory();
    loadStatistics();
    setupNavigationCloseOnMobile();
    setupSwipeGestures();
});

// Inicializar la página
function initializePage() {
    checkScreenSize();
    showTab('history');
}

// Cargar historial de pagos
async function loadPaymentHistory() {
    const container = document.getElementById('payment-history-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
    
    try {
        const response = await fetch('/estudiante/api/pagos/historial');
        const pagos = await response.json();
        
        renderPaymentHistory(pagos);
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
        container.innerHTML = '<p class="no-data">Error al cargar el historial de pagos</p>';
    }
}

// Renderizar historial
function renderPaymentHistory(payments) {
    const container = document.getElementById('payment-history-list');
    if (!container) return;
    
    if (!payments || payments.length === 0) {
        container.innerHTML = '<p class="no-data">No hay pagos registrados</p>';
        return;
    }
    
    container.innerHTML = payments.map(payment => `
        <div class="payment-item">
            <div class="payment-info">
                <div class="payment-icon">
                    <i class="${getStatusIcon(payment.status)}"></i>
                </div>
                <div class="payment-details">
                    <h3>${payment.description}</h3>
                    <div class="payment-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(payment.date)}</span>
                        <span><i class="fas fa-credit-card"></i> ${payment.method}</span>
                    </div>
                </div>
            </div>
            <div class="payment-actions">
                <div class="payment-amount">
                    <div class="amount">$${payment.amount.toFixed(2)}</div>
                    <span class="badge ${getStatusClass(payment.status)}">${getStatusText(payment.status)}</span>
                </div>
                <div class="payment-buttons">
                    <button class="btn btn-outline btn-sm" onclick="viewPayment(${payment.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="downloadInvoice(${payment.id})">
                        <i class="fas fa-download"></i> Factura
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Cargar estadísticas
async function loadStatistics() {
    try {
        const response = await fetch('/estudiante/api/pagos/estadisticas');
        const stats = await response.json();
        
        // Aquí puedes mostrar las estadísticas si agregas elementos en el HTML
        console.log('Estadísticas:', stats);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Ver detalle de pago
async function viewPayment(matriculaId) {
    try {
        const response = await fetch(`/estudiante/api/factura/${matriculaId}`);
        const factura = await response.json();
        
        showModal(`
            <div class="modal-header">
                <h3><i class="fas fa-receipt"></i> Detalle del Pago</h3>
            </div>
            <div class="modal-content">
                <div class="payment-detail">
                    <p><strong>Factura:</strong> ${factura.numero_factura}</p>
                    <p><strong>Fecha:</strong> ${formatDate(factura.fecha)}</p>
                    <p><strong>Diplomado:</strong> ${factura.diplomado.titulo}</p>
                    <p><strong>Categoría:</strong> ${factura.diplomado.categoria}</p>
                    <p><strong>Duración:</strong> ${factura.diplomado.duracion} horas</p>
                    <p><strong>Monto:</strong> $${factura.monto.toFixed(2)}</p>
                    <p><strong>Método:</strong> ${factura.metodo_pago}</p>
                    ${factura.transaccion_id ? `<p><strong>Transacción:</strong> ${factura.transaccion_id}</p>` : ''}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="downloadInvoice(${matriculaId})">
                    <i class="fas fa-download"></i> Descargar Factura
                </button>
            </div>
        `);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar detalles del pago', 'error');
    }
}

// Descargar factura
function downloadInvoice(matriculaId) {
    showLoadingState();
    
    setTimeout(() => {
        window.location.href = `/estudiante/api/factura/${matriculaId}/descargar`;
        hideLoadingState();
        closeModal();
        showNotification('Descargando factura...', 'success');
    }, 500);
}

// Funciones de utilidad
const getStatusIcon = (status) => {
    const icons = {
        completed: "fas fa-check-circle",
        pending: "fas fa-clock",
        failed: "fas fa-times-circle"
    };
    return icons[status] || "fas fa-clock";
};

const getStatusClass = (status) => {
    return `status-${status}`;
};

const getStatusText = (status) => {
    const texts = {
        completed: "Completado",
        pending: "Pendiente", 
        failed: "Fallido"
    };
    return texts[status] || "Pendiente";
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
};

// Mostrar tab
function showTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeButton) activeButton.classList.add('active');
    
    currentTab = tabName;
    
    if (tabName === 'history') {
        loadPaymentHistory();
    }
}

// Modal
function showModal(content) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-container">
            <button class="modal-close" onclick="closeModal()">×</button>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    modalOverlay.style.display = 'flex';
    
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
    });
}

function closeModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) modalOverlay.remove();
}

// Notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Loading
function showLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = '<div class="spinner"></div><span>Procesando...</span>';
    loadingDiv.id = 'loading-indicator';
    document.body.appendChild(loadingDiv);
}

function hideLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();
}

// Event listeners
function setupEventListeners() {
    const toggleSidebar = document.getElementById('toggleSidebar');
    if (toggleSidebar) toggleSidebar.addEventListener('click', toggleSidebarFunc);

    const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
    if (toggleBtnMobile) toggleBtnMobile.addEventListener('click', toggleSidebarFunc);

    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebarOpen) closeSidebar();
        if (e.key === 'Escape') closeModal();
    });

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            showTab(this.dataset.tab);
        });
    });

    window.addEventListener('resize', debounce(handleWindowResize, 250));
}

// Sidebar
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
    
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    if (toggleBtnMobile) toggleBtnMobile.classList.add('active');
    
    sidebarOpen = true;
    
    if (window.innerWidth <= 1024) {
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
    
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    if (toggleBtnMobile) toggleBtnMobile.classList.remove('active');
    
    sidebarOpen = false;
    document.body.style.overflow = 'auto';
}

function toggleSidebarFunc() {
    sidebarOpen ? closeSidebar() : openSidebar();
}

function handleWindowResize() {
    if (window.innerWidth > 1024 && sidebarOpen) {
        closeSidebar();
    }
    checkScreenSize();
}

function checkScreenSize() {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth > 1024) {
        if (sidebar) sidebar.style.transform = 'translateX(0)';
        sidebarOpen = false;
        document.body.style.overflow = 'auto';
    }
}

function setupNavigationCloseOnMobile() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 1024 && sidebarOpen) {
                setTimeout(() => closeSidebar(), 150);
            }
        });
    });
}

function setupSwipeGestures() {
    let startX = 0;
    let isDragging = false;

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        sidebar.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            const currentX = e.touches[0].clientX;
            if (currentX - startX < -50) {
                closeSidebar();
                isDragging = false;
            }
        }, { passive: true });

        sidebar.addEventListener('touchend', function() {
            isDragging = false;
        }, { passive: true });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

console.log('Pagos App initialized');

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    // Abrir sidebar con botón flotante
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('active');
            }
            sidebarOpen = true;
        });
    }
    
    // Cerrar sidebar al hacer click en el overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            sidebarOpen = false;
        });
    }
    
    // Cerrar sidebar al hacer click en un nav-item (solo en móvil)
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
                sidebarOpen = false;
            }
        });
    });
    
    // Cerrar sidebar al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarOpen && window.innerWidth <= 1024) {
            sidebar.classList.remove('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
            sidebarOpen = false;
        }
    });
}

// ---------------------- Inicialización ----------------------
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sidebar
    initSidebar();
    
    // Inicializar datos de la semana
    currentWeek = getStartOfWeek(new Date());
    updateWeekDisplay();
    initializeChart();
    updateChart();

    // Eventos para cambiar semana
    document.getElementById('prevWeek')?.addEventListener('click', () => changeWeek(-1));
    document.getElementById('nextWeek')?.addEventListener('click', () => changeWeek(1));

    // Toggle gráfico horas/sesiones
    document.querySelectorAll('.view-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            viewMode = this.dataset.view;
            updateChart();
        });
    });
});