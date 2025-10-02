// Variables globales
let sidebarOpen = false;
let currentTab = 'history';

// Variables para el sidebar mejorado
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mainContent = document.querySelector('.main');

// Datos simulados
const paymentHistory = [
    { id: 1, date: "2024-02-01", description: "Diplomado: Desarrollo Web Full Stack", amount: 299, status: "completed", method: "Tarjeta de Crédito", invoice: "INV-2024-001", course: "Desarrollo Web Full Stack" },
    { id: 2, date: "2024-01-15", description: "Diplomado: Data Science con Python", amount: 399, status: "completed", method: "PayPal", invoice: "INV-2024-002", course: "Data Science con Python" },
    { id: 3, date: "2024-01-01", description: "Suscripción Premium - Enero", amount: 29, status: "completed", method: "Tarjeta de Débito", invoice: "INV-2024-003", course: "Suscripción Premium" },
    { id: 4, date: "2024-02-08", description: "Diplomado: Inteligencia Artificial", amount: 449, status: "pending", method: "Transferencia Bancaria", invoice: "INV-2024-004", course: "Inteligencia Artificial" },
    { id: 5, date: "2024-01-28", description: "Tutoría Personalizada - React", amount: 50, status: "failed", method: "Tarjeta de Crédito", invoice: "INV-2024-005", course: "Tutoría React" },
];

const paymentMethods = [
    { id: 1, type: "credit", brand: "Visa", last4: "4242", expiryMonth: "12", expiryYear: "2025", isDefault: true },
    { id: 2, type: "credit", brand: "Mastercard", last4: "8888", expiryMonth: "08", expiryYear: "2026", isDefault: false },
    { id: 3, type: "paypal", email: "maria.gonzalez@email.com", isDefault: false },
];

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    renderPaymentHistory();
    renderPaymentMethods();
    renderInvoices();
    initPaySelectedCourse();
    setupNavigationCloseOnMobile();
    setupSwipeGestures();
});

// Inicializar la página
function initializePage() {
    checkScreenSize();
    showTab('history');
}

// ========================
// FUNCIONES DE SIDEBAR MEJORADAS
// ========================

// Abrir sidebar
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
    const mainContent = document.querySelector('.main');
    
    if (sidebar) {
        sidebar.classList.add('open');
        sidebarOpen = true;
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.classList.add('active');
    }
    
    if (toggleBtnMobile) {
        toggleBtnMobile.classList.add('active');
    }
    
    if (mainContent) {
        mainContent.classList.add('sidebar-open');
    }
    
    // Prevenir scroll del body en móvil
    if (window.innerWidth <= 1024) {
        document.body.style.overflow = 'hidden';
    }
}

// Cerrar sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
    const mainContent = document.querySelector('.main');
    
    if (sidebar) {
        sidebar.classList.remove('open');
        sidebarOpen = false;
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    
    if (toggleBtnMobile) {
        toggleBtnMobile.classList.remove('active');
    }
    
    if (mainContent) {
        mainContent.classList.remove('sidebar-open');
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
}

// Toggle sidebar mejorado
function toggleSidebarFunc() {
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

// Manejar resize de ventana
function handleWindowResize() {
    if (window.innerWidth > 1024) {
        // En desktop, cerrar sidebar móvil si está abierto
        if (sidebarOpen) {
            closeSidebar();
        }
        // Restaurar estados
        document.body.style.overflow = 'auto';
        const mainContent = document.querySelector('.main');
        if (mainContent) {
            mainContent.classList.remove('sidebar-open');
        }
    }
    
    // Actualizar estado general
    checkScreenSize();
}

// Configurar event listeners
function setupEventListeners() {
    // Sidebar toggle original
    const toggleSidebar = document.getElementById('toggleSidebar');
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', toggleSidebarFunc);
    }

    // Nuevo toggle button para móvil
    const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
    if (toggleBtnMobile) {
        toggleBtnMobile.addEventListener('click', toggleSidebarFunc);
    }

    // Cerrar sidebar al hacer clic en overlay
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Cerrar sidebar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebarOpen) {
            closeSidebar();
        }
    });

    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            showTab(tabName);
        });
    });

    // Filtros
    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');

    if (yearFilter) {
        yearFilter.addEventListener('change', handleFilterChange);
    }
    
    if (monthFilter) {
        monthFilter.addEventListener('change', handleFilterChange);
    }

    // Form submission
    const paymentForm = document.querySelector('.payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handleAddPaymentMethod);
    }

    // Responsive con la nueva función
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    window.addEventListener('orientationchange', () => {
        setTimeout(handleWindowResize, 500);
    });
    
    // Validaciones de formulario
    setupFormValidations();

    // Shortcuts de teclado
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case '1':
                    event.preventDefault();
                    showTab('history');
                    break;
                case '2':
                    event.preventDefault();
                    showTab('methods');
                    break;
                case '3':
                    event.preventDefault();
                    showTab('invoices');
                    break;
            }
        }
        
        if (event.key === 'Escape') {
            closeModal();
            if (sidebarOpen) {
                closeSidebar();
            }
        }
    });
}

// Verificar tamaño de pantalla mejorado
function checkScreenSize() {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth > 1024) {
        // Desktop
        if (sidebar) {
            sidebar.style.transform = 'translateX(0)';
            sidebar.classList.remove('open');
        }
        sidebarOpen = false;
        
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        
        const toggleBtnMobile = document.getElementById('toggleSidebarMobile');
        if (toggleBtnMobile) {
            toggleBtnMobile.classList.remove('active');
        }
        
        document.body.style.overflow = 'auto';
    } else {
        // Móvil/Tablet
        if (sidebar) {
            sidebar.style.transform = sidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        }
    }
}

// Cerrar sidebar al hacer clic en enlaces de navegación (en móvil)
function setupNavigationCloseOnMobile() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Solo cerrar en móvil/tablet
            if (window.innerWidth <= 1024 && sidebarOpen) {
                setTimeout(() => {
                    closeSidebar();
                }, 150); // Pequeño delay para mejor UX
            }
        });
    });
}

// Swipe gesture para cerrar sidebar
function setupSwipeGestures() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        sidebar.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            
            // Solo permitir swipe hacia la izquierda para cerrar
            if (diffX < -50) {
                closeSidebar();
                isDragging = false;
            }
        }, { passive: true });

        sidebar.addEventListener('touchend', function() {
            isDragging = false;
        }, { passive: true });
    }
}

// Mostrar tab específica - CORREGIDO
function showTab(tabName) {
    // Remover clase active de todos los tabs
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Activar el tab seleccionado
    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Renderizar contenido según el tab
    switch(tabName) {
        case 'history':
            renderPaymentHistory();
            break;
        case 'methods':
            renderPaymentMethods();
            break;
        case 'invoices':
            renderInvoices();
            break;
    }
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

const getCardIcon = (brand) => {
    const icons = {
        visa: "fab fa-cc-visa",
        mastercard: "fab fa-cc-mastercard",
        paypal: "fab fa-paypal"
    };
    return icons[brand?.toLowerCase()] || "fas fa-credit-card";
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
};

// Renderizar historial de pagos - CORREGIDO
function renderPaymentHistory() {
    const container = document.getElementById('payment-history-list');
    if (!container) return;
    
    if (paymentHistory.length === 0) {
        container.innerHTML = '<p class="no-data">No hay pagos registrados</p>';
        return;
    }
    
    container.innerHTML = paymentHistory.map((payment, index) => `
        <div class="payment-item" data-payment-id="${payment.id}" data-index="${index}">
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
                    <div class="amount">$${payment.amount}</div>
                    <span class="badge ${getStatusClass(payment.status)}">${getStatusText(payment.status)}</span>
                </div>
                <div class="payment-buttons">
                    <button class="btn btn-outline btn-sm" onclick="viewPayment(${payment.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${payment.status === 'completed' ? `<button class="btn btn-outline btn-sm" onclick="downloadInvoice('${payment.invoice}')"><i class="fas fa-download"></i> Factura</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar métodos de pago - CORREGIDO
function renderPaymentMethods() {
    const container = document.getElementById('payment-methods-list');
    if (!container) return;
    
    if (paymentMethods.length === 0) {
        container.innerHTML = '<p class="no-data">No hay métodos de pago registrados</p>';
        return;
    }
    
    container.innerHTML = paymentMethods.map((method, index) => `
        <div class="payment-method" data-method-id="${method.id}" data-index="${index}">
            <div class="method-info">
                <div class="method-icon">
                    <i class="${getCardIcon(method.type === 'paypal' ? 'paypal' : method.brand)}"></i>
                </div>
                <div class="method-details">
                    ${method.type === 'paypal' ? 
                        `<p>PayPal</p><p>${method.email}</p>` : 
                        `<p>${method.brand} •••• ${method.last4}</p><p>Expira ${method.expiryMonth}/${method.expiryYear}</p>`
                    }
                </div>
            </div>
            <div class="method-actions">
                ${method.isDefault ? '<span class="badge badge-success">Por defecto</span>' : ''}
                <button class="btn btn-outline btn-sm" onclick="deletePaymentMethod(${method.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Renderizar facturas - CORREGIDO
function renderInvoices(filteredPayments = null) {
    const payments = filteredPayments || paymentHistory.filter(p => p.status === 'completed');
    const container = document.getElementById('invoices-list');
    if (!container) return;
    
    if (payments.length === 0) {
        container.innerHTML = '<p class="no-data">No hay facturas disponibles</p>';
        return;
    }
    
    container.innerHTML = payments.map((payment, index) => `
        <div class="invoice-item" data-invoice-id="${payment.id}" data-index="${index}">
            <div class="invoice-info">
                <div class="invoice-icon">
                    <i class="fas fa-file-invoice"></i>
                </div>
                <div class="invoice-details">
                    <h3>${payment.invoice}</h3>
                    <p>${formatDate(payment.date)} • ${payment.course}</p>
                </div>
            </div>
            <div class="invoice-actions">
                <div class="invoice-amount">
                    <div class="amount">$${payment.amount}</div>
                    <span class="badge status-completed">Pagado</span>
                </div>
                <div class="payment-buttons">
                    <button class="btn btn-outline btn-sm" onclick="viewInvoice('${payment.invoice}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="downloadInvoice('${payment.invoice}')">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Manejar cambios de filtro
function handleFilterChange() {
    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');
    
    if (!yearFilter || !monthFilter) return;
    
    const year = yearFilter.value;
    const month = monthFilter.value;
    
    let filteredPayments = paymentHistory.filter(p => p.status === 'completed');
    
    if (year) {
        filteredPayments = filteredPayments.filter(p => p.date.startsWith(year));
    }
    
    if (month && month !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.date.split('-')[1] === month);
    }
    
    renderInvoices(filteredPayments);
}

// Manejar agregar método de pago
function handleAddPaymentMethod(event) {
    event.preventDefault();
    
    const cardNumber = document.getElementById('cardNumber');
    const expiryDate = document.getElementById('expiryDate');
    const cvv = document.getElementById('cvv');
    const cardName = document.getElementById('cardName');
    
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }
    
    const cardNumberValue = cardNumber.value;
    const expiryDateValue = expiryDate.value;
    const cvvValue = cvv.value;
    const cardNameValue = cardName.value;
    
    if (!cardNumberValue || !expiryDateValue || !cvvValue || !cardNameValue) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }
    
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        showNotification('Método de pago agregado exitosamente', 'success');
        
        // Limpiar formulario
        event.target.reset();
        
        // Simular agregar nuevo método
        const newMethod = {
            id: paymentMethods.length + 1,
            type: "credit",
            brand: "Visa", // Detectar automáticamente
            last4: cardNumberValue.replace(/\s/g, '').slice(-4),
            expiryMonth: expiryDateValue.split('/')[0],
            expiryYear: expiryDateValue.split('/')[1],
            isDefault: false
        };
        
        paymentMethods.push(newMethod);
        renderPaymentMethods();
    }, 1500);
}

// Inicializar pago de curso seleccionado
function initPaySelectedCourse() {
    const selectedCourse = JSON.parse(localStorage.getItem('selectedCourse') || 'null');
    const container = document.getElementById('selected-course-container');
    const courseDiv = document.getElementById('selected-course');
    const payBtn = document.getElementById('pay-course-btn');

    if (selectedCourse && container && courseDiv && payBtn) {
        container.style.display = 'block';
        courseDiv.textContent = `${selectedCourse.title} - $${selectedCourse.price}`;

        payBtn.addEventListener('click', () => {
            showModal(`
                <div class="modal-header">
                    <h3><i class="fas fa-credit-card"></i> Procesar Pago</h3>
                </div>
                <div class="modal-content">
                    <p>¿Confirmas el pago de <strong>${selectedCourse.title}</strong> por <strong>$${selectedCourse.price}</strong>?</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="processCoursePayment('${selectedCourse.title}', ${selectedCourse.price})">
                        <i class="fas fa-check"></i> Confirmar Pago
                    </button>
                </div>
            `);
        });
    }
}

// Funciones de acciones
function viewPayment(paymentId) {
    const payment = paymentHistory.find(p => p.id === paymentId);
    if (payment) {
        showModal(`
            <div class="modal-header">
                <h3><i class="fas fa-receipt"></i> Detalle del Pago</h3>
            </div>
            <div class="modal-content">
                <div class="payment-detail">
                    <p><strong>Descripción:</strong> ${payment.description}</p>
                    <p><strong>Fecha:</strong> ${formatDate(payment.date)}</p>
                    <p><strong>Monto:</strong> $${payment.amount}</p>
                    <p><strong>Estado:</strong> ${getStatusText(payment.status)}</p>
                    <p><strong>Método:</strong> ${payment.method}</p>
                    <p><strong>Factura:</strong> ${payment.invoice}</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
                ${payment.status === 'completed' ? `<button class="btn btn-primary" onclick="downloadInvoice('${payment.invoice}')"><i class="fas fa-download"></i> Descargar Factura</button>` : ''}
            </div>
        `);
    }
}

function viewInvoice(invoiceId) {
    showNotification(`Abriendo factura ${invoiceId}`, 'info');
}

function downloadInvoice(invoiceId) {
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        showNotification(`Factura ${invoiceId} descargada exitosamente`, 'success');
        
        // Simular descarga
        const link = document.createElement('a');
        link.href = '#';
        link.download = `${invoiceId}.pdf`;
        link.click();
    }, 1000);
}

function deletePaymentMethod(methodId) {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method && method.isDefault) {
        showNotification('No puedes eliminar el método de pago por defecto', 'warning');
        return;
    }
    
    showModal(`
        <div class="modal-header">
            <h3><i class="fas fa-trash"></i> Eliminar Método de Pago</h3>
        </div>
        <div class="modal-content">
            <p>¿Estás seguro de que deseas eliminar este método de pago?</p>
            <p>Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="confirmDeleteMethod(${methodId})">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `);
}

function confirmDeleteMethod(methodId) {
    const index = paymentMethods.findIndex(m => m.id === methodId);
    if (index !== -1) {
        paymentMethods.splice(index, 1);
        renderPaymentMethods();
        closeModal();
        showNotification('Método de pago eliminado exitosamente', 'success');
    }
}

function processCoursePayment(courseTitle, amount) {
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        closeModal();
        
        // Agregar pago al historial
        const newPayment = {
            id: paymentHistory.length + 1,
            date: new Date().toISOString().split('T')[0],
            description: `Diplomado: ${courseTitle}`,
            amount: amount,
            status: "completed",
            method: "Tarjeta de Crédito",
            invoice: `INV-2024-${String(paymentHistory.length + 1).padStart(3, '0')}`,
            course: courseTitle
        };
        
        paymentHistory.unshift(newPayment);
        renderPaymentHistory();
        
        // Limpiar curso seleccionado
        localStorage.removeItem('selectedCourse');
        const container = document.getElementById('selected-course-container');
        if (container) {
            container.style.display = 'none';
        }
        
        showNotification(`Pago de ${courseTitle} procesado exitosamente`, 'success');
        
        // Cambiar a tab de historial
        showTab('history');
    }, 2000);
}

// Modal functions
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
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}

function closeModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
}

// Notification functions
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
        if (notification.parentElement) {
            notification.remove();
        }
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

// Loading states
function showLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = '<div class="spinner"></div><span>Procesando...</span>';
    loadingDiv.id = 'loading-indicator';
    
    document.body.appendChild(loadingDiv);
}

function hideLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Form validations
function setupFormValidations() {
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
            if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
            e.target.value = formattedValue;
        });
    }
    
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            e.target.value = value.substring(0, 3);
        });
    }
}

// Utility functions
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

// Export
window.PagosApp = {
    refreshAllData: () => { 
        renderPaymentHistory();
        renderPaymentMethods();
        renderInvoices();
    },
    paymentHistory,
    paymentMethods,
    openSidebar,
    closeSidebar,
    toggleSidebarFunc
};

console.log('Pagos App initialized successfully');