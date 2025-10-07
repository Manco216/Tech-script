// ========== SIDEBAR TOGGLE ==========
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const toggleMobileBtn = document.getElementById('toggleSidebarMobile');

    // Toggle desktop
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Toggle mobile
    if (toggleMobileBtn) {
        toggleMobileBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // ========== TABS ==========
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remover clase active de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar el seleccionado
            this.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // ========== CARGAR DATOS ==========
    cargarDatos();
});

// ========== FUNCIÓN PRINCIPAL PARA CARGAR DATOS ==========
async function cargarDatos() {
    try {
        const response = await fetch('/instructor/seguimiento-estudiantes/data');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar datos');
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        // Actualizar cards de resumen (pasar todo el objeto data)
        actualizarResumen(data);
        
        // Crear gráficas
        crearGraficaProgreso(data.crecimiento);
        crearGraficaPopulares(data.populares);
        crearGraficaEnrollments(data.crecimiento);
        
        // Llenar filtros
        llenarFiltros(data.populares);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    }
}

// ========== ACTUALIZAR CARDS DE RESUMEN ==========
function actualizarResumen(data) {
    const resumen = data.resumen;
    const actividadHoy = data.actividad_hoy;
    
    // Actualizar cards principales
    document.getElementById('totalStudents').textContent = resumen.total_estudiantes || 0;
    document.getElementById('activeStudents').textContent = `${resumen.activos || 0} activos`;
    document.getElementById('totalDiplomas').textContent = resumen.total_diplomados || 0;
    
    // Calcular promedio
    const promedio = resumen.total_diplomados > 0 
        ? Math.round(resumen.total_estudiantes / resumen.total_diplomados) 
        : 0;
    document.getElementById('avgStudentsPerDiploma').textContent = `${promedio} promedio/diplomado`;
    
    document.getElementById('totalCertificates').textContent = resumen.certificados || 0;
    document.getElementById('monthlyGrowth').textContent = resumen.crecimiento_mes || '+0 este mes';
    
    // Actividad reciente (datos reales de hoy)
    document.getElementById('newEnrollments').textContent = actividadHoy.nuevas_inscripciones || 0;
    document.getElementById('modulesCompleted').textContent = actividadHoy.modulos_completados || 0;
    document.getElementById('certificatesIssued').textContent = actividadHoy.certificados_emitidos || 0;
}

// ========== LLENAR FILTROS ==========
function llenarFiltros(diplomados) {
    const select = document.getElementById('diplomadoFilter');
    if (!select) return;
    
    // Limpiar opciones existentes (excepto la primera)
    select.innerHTML = '<option value="">Todos los diplomados</option>';
    
    // Agregar diplomados
    diplomados.forEach(dip => {
        const option = document.createElement('option');
        option.value = dip.id;
        option.textContent = `${dip.nombre} (${dip.inscritos} estudiantes)`;
        select.appendChild(option);
    });
}

// ========== GRÁFICAS ==========
let chartInstances = {};

function crearGraficaProgreso(data) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    if (!data || data.length === 0) data = [{ mes: 'N/A', total: 0 }]; // <-- fallback

    
    const labels = data.map(item => item.mes);
    const valores = data.map(item => item.total);
    
    chartInstances.progress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Estudiantes nuevos',
                data: valores,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function crearGraficaPopulares(diplomados) {
    const ctx = document.getElementById('popularCoursesChart');
    if (!ctx) return;

    if (chartInstances.popular) chartInstances.popular.destroy();

    if (!diplomados || diplomados.length === 0) {
        // Limpiar canvas
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }

    const labels = diplomados.map(d => d.nombre);
    const inscritos = diplomados.map(d => d.inscritos);
    const completados = diplomados.map(d => d.completados);

    chartInstances.popular = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Inscritos', data: inscritos, backgroundColor: 'rgba(79, 70, 229, 0.8)' }, { label: 'Completados', data: completados, backgroundColor: 'rgba(16, 185, 129, 0.8)' }] },
        options: { responsive:true, maintainAspectRatio:false }
    });
}


function crearGraficaEnrollments(data) {
    const ctx = document.getElementById('enrollmentChart');
    if (!ctx) return;
    
    if (chartInstances.enrollment) {
        chartInstances.enrollment.destroy();
    }
    
    const labels = data.map(item => item.mes);
    const valores = data.map(item => item.total);
    
    chartInstances.enrollment = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Inscripciones',
                data: valores,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1
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
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ========== MOSTRAR ERROR ==========
function mostrarError(mensaje) {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.style.cssText = 'padding: 15px; margin: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c33;';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <strong>Error:</strong> ${mensaje}
    `;
    
    contentArea.insertBefore(errorDiv, contentArea.firstChild);
    
    // Remover después de 5 segundos
    setTimeout(() => errorDiv.remove(), 5000);
}
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
// ========== EXPORTAR DASHBOARD A PDF ==========
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportPDF');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarPDF);
    }
});

async function exportarPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const content = document.querySelector('.content-area'); // Selecciona el área principal del dashboard
        
        if (!content) {
            alert('No se encontró el contenido para exportar.');
            return;
        }

        // Mostrar mensaje temporal
        const loadingMsg = document.createElement('div');
        loadingMsg.textContent = 'Generando PDF...';
        loadingMsg.style.position = 'fixed';
        loadingMsg.style.top = '10px';
        loadingMsg.style.right = '10px';
        loadingMsg.style.padding = '10px 15px';
        loadingMsg.style.background = '#333';
        loadingMsg.style.color = '#fff';
        loadingMsg.style.borderRadius = '8px';
        loadingMsg.style.zIndex = '9999';
        document.body.appendChild(loadingMsg);

        // Convertir el contenido a imagen
        const canvas = await html2canvas(content, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');

        const imgWidth = 190; // ancho del A4 menos márgenes
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        // Agregar primera página
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Si el contenido es más largo que una página
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save('reporte_dashboard.pdf');
        loadingMsg.remove();
        console.log('PDF generado con éxito');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarError('Error al exportar PDF: ' + error.message);
    }
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