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