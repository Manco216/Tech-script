// Variables globales
let sidebarOpen = false;
let currentTab = 'overview';
let statusChart = null;
let enrollmentChart = null;
let comparisonChart = null;

// Datos simulados de diplomados
const diplomadosData = [
    {
        id: 'react',
        name: 'Desarrollo Web con React',
        icon: 'fab fa-react',
        color: '#61dafb',
        students: 342,
        active: 298,
        completed: 234,
        progress: 85,
        satisfaction: 4.8
    },
    {
        id: 'python',
        name: 'Python para Data Science',
        icon: 'fab fa-python',
        color: '#306998',
        students: 298,
        active: 267,
        completed: 198,
        progress: 78,
        satisfaction: 4.6
    },
    {
        id: 'spring',
        name: 'Microservicios Spring Boot',
        icon: 'fas fa-leaf',
        color: '#6db33f',
        students: 187,
        active: 156,
        completed: 134,
        progress: 72,
        satisfaction: 4.5
    },
    {
        id: 'ux',
        name: 'Diseño UX/UI',
        icon: 'fas fa-palette',
        color: '#ff6b6b',
        students: 156,
        active: 134,
        completed: 98,
        progress: 68,
        satisfaction: 4.7
    },
    {
        id: 'ml',
        name: 'Machine Learning Básico',
        icon: 'fas fa-robot',
        color: '#4ecdc4',
        students: 134,
        active: 112,
        completed: 87,
        progress: 65,
        satisfaction: 4.4
    },
    {
        id: 'angular',
        name: 'Angular Avanzado',
        icon: 'fab fa-angular',
        color: '#dd0031',
        students: 89,
        active: 76,
        completed: 56,
        progress: 63,
        satisfaction: 4.3
    },
    {
        id: 'node',
        name: 'Node.js Backend',
        icon: 'fab fa-node-js',
        color: '#339933',
        students: 76,
        active: 65,
        completed: 43,
        progress: 58,
        satisfaction: 4.5
    },
    {
        id: 'mobile',
        name: 'Desarrollo Mobile',
        icon: 'fas fa-mobile-alt',
        color: '#6c5ce7',
        students: 45,
        active: 38,
        completed: 23,
        progress: 51,
        satisfaction: 4.2
    }
];

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadGeneralStats();
    initializeCharts();
    renderDiplomados();
});

// Inicializar la página
function initializePage() {
    checkScreenSize();
    showTab('overview');
    updateProgressBars();
}

// Configurar event listeners
function setupEventListeners() {
    // Sidebar toggle
    const toggleSidebar = document.getElementById('toggleSidebar');
    const toggleSidebarMobile = document.getElementById('toggleSidebarMobile');
    
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', toggleSidebarFunc);
    }
    
    if (toggleSidebarMobile) {
        toggleSidebarMobile.addEventListener('click', toggleSidebarFunc);
    }

    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            showTab(tabName);
        });
    });

    // Filtros
    const diplomadoFilter = document.getElementById('diplomadoFilter');
    const periodFilter = document.getElementById('periodFilter');
    const exportData = document.getElementById('exportData');
    const sendGroupMessage = document.getElementById('sendGroupMessage');

    if (diplomadoFilter) {
        diplomadoFilter.addEventListener('change', handleDiplomadoFilter);
    }
    
    if (periodFilter) {
        periodFilter.addEventListener('change', handlePeriodFilter);
    }

    if (exportData) {
        exportData.addEventListener('click', handleExportData);
    }

    if (sendGroupMessage) {
        sendGroupMessage.addEventListener('click', handleGroupMessage);
    }

    // Responsive
    window.addEventListener('resize', checkScreenSize);
}

// Toggle sidebar
function toggleSidebarFunc() {
    const sidebar = document.getElementById('sidebar');
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.remove('open');
    }
}

// Verificar tamaño de pantalla
function checkScreenSize() {
    const sidebar = document.getElementById('sidebar');
    const toggleMobile = document.getElementById('toggleSidebarMobile');
    
    if (window.innerWidth <= 1024) {
        sidebar.style.transform = 'translateX(-100%)';
        if (toggleMobile) {
            toggleMobile.style.display = 'block';
        }
        sidebarOpen = false;
    } else {
        sidebar.style.transform = 'translateX(0)';
        if (toggleMobile) {
            toggleMobile.style.display = 'none';
        }
        sidebarOpen = true;
    }
}

// Mostrar tab específica
function showTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Actualizar contenido específico de la tab
    if (tabName === 'estadisticas') {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }
}

// Cargar estadísticas generales
function loadGeneralStats() {
    const totalStudents = diplomadosData.reduce((sum, diplomado) => sum + diplomado.students, 0);
    const activeStudents = diplomadosData.reduce((sum, diplomado) => sum + diplomado.active, 0);
    const totalCompleted = diplomadosData.reduce((sum, diplomado) => sum + diplomado.completed, 0);
    const avgCompletion = Math.round((totalCompleted / totalStudents) * 100);
    const avgStudentsPerDiploma = Math.round(totalStudents / diplomadosData.length);
    
    // Actualizar elementos del DOM
    updateElement('totalStudents', totalStudents.toLocaleString());
    updateElement('activeStudents', `${activeStudents.toLocaleString()} activos`);
    updateElement('totalDiplomas', diplomadosData.length.toString());
    updateElement('avgStudentsPerDiploma', `${avgStudentsPerDiploma} promedio/diplomado`);
    updateElement('completionRate', `${avgCompletion}%`);
    updateElement('totalCertificates', totalCompleted.toLocaleString());
    updateElement('monthlyGrowth', '+23 este mes');
}

// Función auxiliar para actualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Inicializar gráficos
function initializeCharts() {
    initStatusChart();
    initEnrollmentChart();
    initComparisonChart();
}

// Gráfico de estado
function initStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const totalStudents = diplomadosData.reduce((sum, diplomado) => sum + diplomado.students, 0);
    const activeStudents = diplomadosData.reduce((sum, diplomado) => sum + diplomado.active, 0);
    const inactiveStudents = totalStudents - activeStudents;

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Activos', 'Inactivos'],
            datasets: [{
                data: [activeStudents, inactiveStudents],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Gráfico de tendencia de inscripciones
function initEnrollmentChart() {
    const ctx = document.getElementById('enrollmentChart');
    if (!ctx) return;

    enrollmentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Inscripciones',
                data: [45, 62, 78, 95, 123, 145, 167, 189, 234, 267, 298, 342],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Actualizar gráficos
function updateCharts() {
    if (statusChart) statusChart.update();
    if (enrollmentChart) enrollmentChart.update();
    if (comparisonChart) comparisonChart.update();
}

// Renderizar tarjetas de diplomados
function renderDiplomados() {
    const container = document.getElementById('diplomadosGrid');
    if (!container) return;

    container.innerHTML = '';

    diplomadosData.forEach(diplomado => {
        const diplomadoCard = createDiplomadoCard(diplomado);
        container.appendChild(diplomadoCard);
    });
}

// Crear tarjeta de diplomado
function createDiplomadoCard(diplomado) {
    const card = document.createElement('div');
    card.className = 'diplomado-card';
    card.innerHTML = `
        <div class="diplomado-header">
            <div class="diplomado-icon" style="background: linear-gradient(135deg, ${diplomado.color}80, ${diplomado.color});">
                <i class="${diplomado.icon}"></i>
            </div>
            <div class="diplomado-title">
                <h4>${diplomado.name}</h4>
                <span>${diplomado.students} estudiantes inscritos</span>
            </div>
        </div>
        
        <div class="diplomado-stats">
            <div class="stat-item">
                <div class="stat-number">${diplomado.active}</div>
                <div class="stat-label">Activos</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${diplomado.completed}</div>
                <div class="stat-label">Completados</div>
            </div>
        </div>
        
        <div class="diplomado-progress">
            <div class="progress-header">
                <span>Progreso Promedio</span>
                <span>${diplomado.progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${diplomado.progress}%"></div>
            </div>
        </div>
        
        <div class="performance-metrics">
            <div class="metric-item">
                <div class="metric-icon info">
                    <i class="fas fa-star"></i>
                </div>
                <div class="metric-info">
                    <span class="metric-value">${diplomado.satisfaction}</span>
                    <span class="metric-label">Satisfacción</span>
                    <span class="metric-change positive">Excelente</span>
                </div>
            </div>
        </div>
        
        <div class="diplomado-actions">
            <button class="btn btn-secondary btn-small" onclick="viewDiplomadoDetails('${diplomado.id}')">
                <i class="fas fa-eye"></i> Ver Detalles
            </button>
            <button class="btn btn-primary btn-small" onclick="sendDiplomadoMessage('${diplomado.id}')">
                <i class="fas fa-envelope"></i> Mensaje
            </button>
        </div>
    `;

    return card;
}

// Manejar filtro de diplomado
function handleDiplomadoFilter(event) {
    const selectedDiplomado = event.target.value;
    console.log('Filtro de diplomado:', selectedDiplomado);
    
    showLoadingState();
    
    setTimeout(() => {
        if (selectedDiplomado) {
            filterStatsByDiplomado(selectedDiplomado);
        } else {
            loadGeneralStats();
        }
        hideLoadingState();
        updateProgressBars();
    }, 800);
}

// Manejar filtro de período
function handlePeriodFilter(event) {
    const selectedPeriod = event.target.value;
    console.log('Filtro de período:', selectedPeriod);
    
    updateStatsByPeriod(selectedPeriod);
    
    if (enrollmentChart) {
        updateEnrollmentChartData(selectedPeriod);
    }
}

// Filtrar estadísticas por diplomado
function filterStatsByDiplomado(diplomadoId) {
    const diplomado = diplomadosData.find(d => d.id === diplomadoId);
    
    if (diplomado) {
        updateElement('totalStudents', diplomado.students.toString());
        updateElement('activeStudents', `${diplomado.active} activos`);
        updateElement('totalDiplomas', '1');
        updateElement('avgStudentsPerDiploma', `${diplomado.students} estudiantes`);
        updateElement('completionRate', `${Math.round((diplomado.completed / diplomado.students) * 100)}%`);
        updateElement('totalCertificates', diplomado.completed.toString());
        updateElement('monthlyGrowth', '+5 este mes');
        
        // Actualizar gráfico de estado
        if (statusChart) {
            const inactive = diplomado.students - diplomado.active;
            statusChart.data.datasets[0].data = [diplomado.active, inactive];
            statusChart.update();
        }
    }
}

// Actualizar estadísticas por período
function updateStatsByPeriod(period) {
    console.log('Actualizando estadísticas por período:', period);
    
    // Simular datos diferentes según el período
    const periodMultiplier = {
        'month': 0.08,
        'quarter': 0.25,
        'year': 1,
        'all': 1
    };
    
    const multiplier = periodMultiplier[period] || 1;
    const baseTotal = diplomadosData.reduce((sum, diplomado) => sum + diplomado.students, 0);
    const periodTotal = Math.round(baseTotal * multiplier);
    
    updateElement('totalStudents', periodTotal.toLocaleString());
    updateElement('activeStudents', `${Math.round(periodTotal * 0.87)} activos`);
}

// Actualizar datos del gráfico de inscripciones
function updateEnrollmentChartData(period) {
    if (!enrollmentChart) return;
    
    const periodData = {
        'month': {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            data: [23, 45, 67, 89]
        },
        'quarter': {
            labels: ['Mes 1', 'Mes 2', 'Mes 3'],
            data: [156, 234, 298]
        },
        'year': {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            data: [298, 456, 634, 789]
        },
        'all': {
            labels: ['2022', '2023', '2024'],
            data: [456, 789, 1247]
        }
    };
    
    const data = periodData[period] || periodData['all'];
    
    enrollmentChart.data.labels = data.labels;
    enrollmentChart.data.datasets[0].data = data.data;
    enrollmentChart.update();
}

// Actualizar barras de progreso con animación
function updateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach((bar, index) => {
        const width = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = width;
        }, 100 * index);
    });
    
    const dayFills = document.querySelectorAll('.day-fill');
    dayFills.forEach((fill, index) => {
        const height = fill.style.height;
        fill.style.height = '0%';
        
        setTimeout(() => {
            fill.style.height = height;
        }, 150 * index);
    });
}

// Ver detalles de diplomado
function viewDiplomadoDetails(diplomadoId) {
    const diplomado = diplomadosData.find(d => d.id === diplomadoId);
    
    if (diplomado) {
        showModal(`
            <div class="modal-header">
                <h3><i class="${diplomado.icon}"></i> ${diplomado.name}</h3>
            </div>
            <div class="modal-content">
                <div class="detail-stats">
                    <div class="detail-stat">
                        <strong>${diplomado.students}</strong>
                        <span>Total Estudiantes</span>
                    </div>
                    <div class="detail-stat">
                        <strong>${diplomado.active}</strong>
                        <span>Estudiantes Activos</span>
                    </div>
                    <div class="detail-stat">
                        <strong>${diplomado.completed}</strong>
                        <span>Han Completado</span>
                    </div>
                    <div class="detail-stat">
                        <strong>${diplomado.progress}%</strong>
                        <span>Progreso Promedio</span>
                    </div>
                </div>
                <div class="detail-description">
                    <p>Este diplomado tiene una excelente tasa de participación y satisfacción estudiantil.</p>
                    <p><strong>Satisfacción:</strong> ${diplomado.satisfaction}/5.0</p>
                    <p><strong>Tasa de Finalización:</strong> ${Math.round((diplomado.completed / diplomado.students) * 100)}%</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="sendDiplomadoMessage('${diplomadoId}')">Enviar Mensaje</button>
            </div>
        `);
    }
}

// Enviar mensaje a diplomado
function sendDiplomadoMessage(diplomadoId) {
    const diplomado = diplomadosData.find(d => d.id === diplomadoId);
    
    if (diplomado) {
        showModal(`
            <div class="modal-header">
                <h3><i class="fas fa-envelope"></i> Mensaje a ${diplomado.name}</h3>
            </div>
            <div class="modal-content">
                <div class="message-form">
                    <div class="form-group">
                        <label>Asunto:</label>
                        <input type="text" class="form-control" placeholder="Asunto del mensaje..." id="messageSubject">
                    </div>
                    <div class="form-group">
                        <label>Mensaje:</label>
                        <textarea class="form-control" rows="5" placeholder="Escribe tu mensaje aquí..." id="messageContent"></textarea>
                    </div>
                    <div class="recipients-info">
                        <p><i class="fas fa-users"></i> Se enviará a ${diplomado.active} estudiantes activos</p>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="sendMessage('${diplomadoId}')">
                    <i class="fas fa-paper-plane"></i> Enviar Mensaje
                </button>
            </div>
        `);
    }
}

// Enviar mensaje grupal general
function handleGroupMessage() {
    const totalActive = diplomadosData.reduce((sum, diplomado) => sum + diplomado.active, 0);
    
    showModal(`
        <div class="modal-header">
            <h3><i class="fas fa-comments"></i> Mensaje Grupal</h3>
        </div>
        <div class="modal-content">
            <div class="message-form">
                <div class="form-group">
                    <label>Asunto:</label>
                    <input type="text" class="form-control" placeholder="Asunto del mensaje..." id="groupMessageSubject">
                </div>
                <div class="form-group">
                    <label>Mensaje:</label>
                    <textarea class="form-control" rows="5" placeholder="Escribe tu mensaje aquí..." id="groupMessageContent"></textarea>
                </div>
                <div class="recipients-info">
                    <p><i class="fas fa-users"></i> Se enviará a ${totalActive.toLocaleString()} estudiantes activos</p>
                    <p><i class="fas fa-graduation-cap"></i> Todos los diplomados</p>
                </div>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="sendGroupMessageAll()">
                <i class="fas fa-paper-plane"></i> Enviar a Todos
            </button>
        </div>
    `);
}

// Enviar mensaje
function sendMessage(diplomadoId) {
    const subject = document.getElementById('messageSubject').value;
    const content = document.getElementById('messageContent').value;
    
    if (!subject.trim() || !content.trim()) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }
    
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        closeModal();
        showNotification('Mensaje enviado exitosamente', 'success');
        console.log('Mensaje enviado a diplomado:', diplomadoId, { subject, content });
    }, 1500);
}

// Enviar mensaje grupal a todos
function sendGroupMessageAll() {
    const subject = document.getElementById('groupMessageSubject').value;
    const content = document.getElementById('groupMessageContent').value;
    
    if (!subject.trim() || !content.trim()) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }
    
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        closeModal();
        showNotification('Mensaje grupal enviado exitosamente', 'success');
        console.log('Mensaje grupal enviado:', { subject, content });
    }, 2000);
}

// Exportar datos
function handleExportData() {
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        
        const csvData = generateCSVData();
        downloadCSV(csvData, 'estadisticas-estudiantes.csv');
        
        showNotification('Datos exportados exitosamente', 'success');
    }, 1000);
}

// Generar datos CSV
function generateCSVData() {
    let csv = 'Diplomado,Total Estudiantes,Estudiantes Activos,Completados,Progreso Promedio,Satisfacción\n';
    
    diplomadosData.forEach(diplomado => {
        csv += `"${diplomado.name}",${diplomado.students},${diplomado.active},${diplomado.completed},${diplomado.progress}%,${diplomado.satisfaction}\n`;
    });
    
    return csv;
}

// Descargar CSV
function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Mostrar modal
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
    
    // Cerrar modal al hacer clic en el overlay
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}

// Cerrar modal
function closeModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
}

// Mostrar notificación
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

// Obtener icono de notificación
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Mostrar estado de carga
function showLoadingState() {
    const mainContent = document.querySelector('.tab-content.active');
    if (mainContent) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = '<div class="spinner"></div>Cargando datos...';
        loadingDiv.id = 'loading-indicator';
        
        mainContent.appendChild(loadingDiv);
    }
}

// Ocultar estado de carga
function hideLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Manejar errores
function handleError(error) {
    console.error('Error:', error);
    showNotification('Ha ocurrido un error. Por favor, intenta de nuevo.', 'error');
}

// Funciones de utilidad
const utils = {
    formatNumber: function(number) {
        return number.toLocaleString('es-ES');
    },
    
    formatPercentage: function(value, total) {
        return Math.round((value / total) * 100) + '%';
    },
    
    formatDate: function(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    calculateGrowth: function(current, previous) {
        const growth = ((current - previous) / previous) * 100;
        return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
    }
};

// CSS para modal y notificaciones (se añadirá dinámicamente)
const additionalStyles = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }
    
    .modal-container {
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
    
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        z-index: 1;
    }
    
    .modal-header {
        padding: 2rem 2rem 1rem 2rem;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 1.25rem;
    }
    
    .modal-content {
        padding: 2rem;
    }
    
    .modal-actions {
        padding: 1rem 2rem 2rem 2rem;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
    }
    
    .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.2s;
    }
    
    .form-control:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }
    
    .recipients-info {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .recipients-info p {
        margin: 0.25rem 0;
        color: #64748b;
        font-size: 0.9rem;
    }
    
    .detail-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .detail-stat {
        text-align: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .detail-stat strong {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #6366f1;
        margin-bottom: 0.25rem;
    }
    
    .detail-stat span {
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .detail-description p {
        margin-bottom: 1rem;
        color: #64748b;
        line-height: 1.6;
    }
    
    .notification {
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        border-left: 4px solid #6366f1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1001;
        max-width: 400px;
    }
    
    .notification.success { border-left-color: #10b981; color: #059669; }
    .notification.warning { border-left-color: #f59e0b; color: #d97706; }
    .notification.error { border-left-color: #ef4444; color: #dc2626; }
    .notification.info { border-left-color: #6366f1; color: #4f46e5; }
    
    .notification button {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
        margin-left: auto;
    }
`;

// Agregar estilos adicionales al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = additionalStyles;
    document.head.appendChild(style);
});

// Event listeners adicionales para funcionalidades
document.addEventListener('keydown', function(event) {
    // Atajos de teclado
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case '1':
                event.preventDefault();
                showTab('overview');
                break;
            case '2':
                event.preventDefault();
                showTab('diplomados');
                break;
            case '3':
                event.preventDefault();
                showTab('estadisticas');
                break;
            case 'e':
                event.preventDefault();
                handleExportData();
                break;
        }
    }
    
    // Cerrar modal con Escape
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Actualizar datos cada 5 minutos (simulado)
setInterval(function() {
    console.log('Actualizando datos automáticamente...');
    loadGeneralStats();
}, 300000); // 5 minutos