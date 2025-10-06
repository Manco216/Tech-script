// reportes.js - VERSIÓN CORREGIDA
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ===========================
// INICIALIZACIÓN
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    inicializarTodo();
});

async function inicializarTodo() {
    initSidebar();
    initTabs();
    initDropdown();
    configurarFiltros();
    
    try {
        await cargarKPIs();
        await cargarUsuariosCrecimiento();
        await cargarIngresosCategoria();
        await cargarDiplomadosRendimiento();
        await cargarMetricasEngagement();
        
        setTimeout(animateProgressBars, 300);
    } catch (error) {
        console.error('Error al inicializar reportes:', error);
        mostrarNotificacion('Error al cargar los datos', 'error');
    }
}

// ===========================
// SIDEBAR
// ===========================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const toggleBtnTop = document.getElementById('toggleSidebarTop');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (toggleBtnTop) {
        toggleBtnTop.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    if (window.innerWidth <= 768) {
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        });
    }
}

// ===========================
// DROPDOWN PERFIL
// ===========================
function initDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (profileDropdown && dropdownMenu) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
}

// ===========================
// TABS
// ===========================
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

// ===========================
// CARGAR KPIs
// ===========================
async function cargarKPIs() {
    try {
        const response = await fetch('/api/reportes/kpis');
        if (!response.ok) throw new Error('Error al cargar KPIs');
        
        const data = await response.json();

        // Total estudiantes
        const totalEstudiantesEl = document.querySelector('.blue-bg .stat-number');
        if (totalEstudiantesEl) {
            totalEstudiantesEl.textContent = data.total_estudiantes.toLocaleString('es-CO');
        }
        
        // Crecimiento
        const growthEl = document.querySelector('.blue-bg .stat-growth span');
        if (growthEl) {
            growthEl.textContent = `${data.crecimiento_estudiantes >= 0 ? '+' : ''}${data.crecimiento_estudiantes}%`;
        }
        
        const growthContainer = document.querySelector('.blue-bg .stat-growth');
        if (growthContainer) {
            growthContainer.className = `stat-growth ${data.crecimiento_estudiantes >= 0 ? 'positive' : 'negative'}`;
        }

        // Ingresos
        const ingresosEl = document.querySelector('.green-bg .stat-number');
        if (ingresosEl) {
            ingresosEl.textContent = `$${formatearNumero(data.ingresos_totales)}`;
        }

        // Tasa finalización
        const tasaEl = document.querySelector('.purple-bg .stat-number');
        if (tasaEl) {
            tasaEl.textContent = `${data.tasa_finalizacion}%`;
        }
    } catch (error) {
        console.error('Error en cargarKPIs:', error);
        mostrarNotificacion('Error al cargar estadísticas principales', 'error');
    }
}

// ===========================
// CRECIMIENTO USUARIOS
// ===========================
async function cargarUsuariosCrecimiento() {
    try {
        const meses = document.getElementById('filterPeriod')?.value || 6;
        const response = await fetch(`/api/reportes/usuarios-crecimiento?meses=${meses}`);
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const data = await response.json();
        renderizarGraficoUsuarios(data);
    } catch (error) {
        console.error('Error en cargarUsuariosCrecimiento:', error);
        mostrarNotificacion('Error al cargar datos de usuarios', 'error');
    }
}

function renderizarGraficoUsuarios(datos) {
    const container = document.getElementById('usuarios-chart');
    
    if (!container) return;
    
    if (!datos || datos.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 40px; color: #64748b;">No hay datos disponibles</p>';
        return;
    }

    const maxValor = Math.max(...datos.map(d => d.total), 1);
    const alturaGrafico = 300;

    let html = '<div class="chart-bars" style="display: flex; align-items: flex-end; justify-content: space-around; height: ' + alturaGrafico + 'px; margin-top: 20px; padding: 0 10px;">';
    
    datos.forEach(item => {
        const altura = (item.total / maxValor) * alturaGrafico * 0.8;
        html += `
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 80px;">
                <div style="text-align: center; margin-bottom: 8px; font-weight: 600; color: #2563eb; font-size: 14px;">
                    ${item.total}
                </div>
                <div class="bar-animated" style="width: 40px; background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); 
                            border-radius: 8px 8px 0 0; transition: height 0.8s ease; cursor: pointer; height: 0;"
                     data-altura="${altura}"
                     onmouseover="this.style.opacity='0.8'"
                     onmouseout="this.style.opacity='1'">
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #64748b; transform: rotate(-45deg); 
                            white-space: nowrap; margin-left: -10px;">
                    ${item.mes.substring(0, 3)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;

    setTimeout(() => {
        const barras = container.querySelectorAll('.bar-animated');
        barras.forEach(barra => {
            barra.style.height = barra.getAttribute('data-altura') + 'px';
        });
    }, 100);
}

// ===========================
// INGRESOS POR CATEGORÍA
// ===========================
async function cargarIngresosCategoria() {
    try {
        const response = await fetch('/api/reportes/ingresos-categoria');
        if (!response.ok) throw new Error('Error al cargar ingresos');
        
        const data = await response.json();
        renderizarGraficoIngresos(data);
    } catch (error) {
        console.error('Error en cargarIngresosCategoria:', error);
        mostrarNotificacion('Error al cargar ingresos por categoría', 'error');
    }
}

function renderizarGraficoIngresos(datos) {
    const container = document.getElementById('ingresos-chart');
    
    if (!container) return;
    
    if (!datos || datos.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 40px; color: #64748b;">No hay datos de ingresos disponibles</p>';
        return;
    }

    const colores = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
    const total = datos.reduce((sum, item) => sum + item.ingresos, 0);

    let html = '<div style="margin: 20px 0;">';
    
    datos.forEach((item, index) => {
        const porcentaje = total > 0 ? (item.ingresos / total * 100).toFixed(1) : 0;
        const color = colores[index % colores.length];
        
        html += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 500; color: #1e293b;">${item.categoria}</span>
                    <span style="font-weight: 600; color: ${color};">$${formatearNumero(item.ingresos)}</span>
                </div>
                <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
                    <div class="progress-animated" style="width: 0%; background: ${color}; height: 100%; 
                                transition: width 0.8s ease; border-radius: 6px;" data-width="${porcentaje}">
                    </div>
                </div>
                <div style="text-align: right; margin-top: 4px; font-size: 12px; color: #64748b;">
                    ${porcentaje}% del total
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;

    setTimeout(() => {
        const barras = container.querySelectorAll('.progress-animated');
        barras.forEach(barra => {
            barra.style.width = barra.getAttribute('data-width') + '%';
        });
    }, 100);
}

// ===========================
// DIPLOMADOS RENDIMIENTO
// ===========================
async function cargarDiplomadosRendimiento() {
    try {
        const response = await fetch('/api/reportes/diplomados-rendimiento');
        if (!response.ok) throw new Error('Error al cargar diplomados');
        
        const data = await response.json();
        renderizarListaDiplomados(data);
    } catch (error) {
        console.error('Error en cargarDiplomadosRendimiento:', error);
        mostrarNotificacion('Error al cargar diplomados', 'error');
    }
}

function renderizarListaDiplomados(diplomados) {
    const container = document.getElementById('cursos-list');
    
    if (!container) return;
    
    if (!diplomados || diplomados.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 40px; color: #64748b;">No hay diplomados registrados</p>';
        return;
    }

    let html = '<div class="diplomados-list">';
    
    diplomados.forEach(dip => {
        const estadoBadge = dip.estado === 'active' ? 
            '<span style="background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">Activo</span>' :
            '<span style="background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">Inactivo</span>';

        html += `
            <div class="diplomado-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; 
                        background: white; transition: all 0.3s; cursor: pointer;"
                 onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                 onmouseout="this.style.boxShadow='none'">
                
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">${dip.titulo}</h4>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <span style="color: #64748b; font-size: 14px;">
                                <i class="fas fa-tag"></i> ${dip.categoria}
                            </span>
                            <span style="color: #64748b; font-size: 14px;">
                                <i class="fas fa-signal"></i> ${dip.nivel}
                            </span>
                            <span style="color: #64748b; font-size: 14px;">
                                <i class="fas fa-clock"></i> ${dip.duracion}h
                            </span>
                            <span style="color: #64748b; font-size: 14px;">
                                <i class="fas fa-book"></i> ${dip.contenidos}/${dip.lecciones} contenidos
                            </span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        ${estadoBadge}
                        <div style="margin-top: 8px; font-size: 20px; font-weight: 700; color: #10b981;">
                            ${formatearNumero(dip.precio)}
                        </div>
                    </div>
                </div>

                <div style="margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 13px; color: #64748b;">Progreso de contenido</span>
                        <span style="font-size: 13px; font-weight: 600; color: #3b82f6;">${dip.progreso}%</span>
                    </div>
                    <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div class="progress-animated" style="width: 0%; background: linear-gradient(90deg, #3b82f6, #2563eb); 
                                    height: 100%; transition: width 0.8s ease; border-radius: 4px;" data-width="${dip.progreso}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;

    setTimeout(() => {
        const barras = container.querySelectorAll('.progress-animated');
        barras.forEach(barra => {
            barra.style.width = barra.getAttribute('data-width') + '%';
        });
    }, 100);
}

// ===========================
// MÉTRICAS ENGAGEMENT
// ===========================
async function cargarMetricasEngagement() {
    try {
        const response = await fetch('/api/reportes/metricas-engagement');
        if (!response.ok) throw new Error('Error al cargar métricas');
        
        const data = await response.json();

        // Actualizar métricas
        const metricRows = document.querySelectorAll('.metric-row');
        if (metricRows.length >= 2) {
            metricRows[0].querySelector('.metric-value').textContent = data.tiempo_promedio_sesion;
            metricRows[1].querySelector('.metric-value').textContent = data.sesiones_totales.toLocaleString('es-CO');
        }

        // Actualizar barras de progreso
        const progressGroups = document.querySelectorAll('#usuarios .progress-group');
        if (progressGroups.length >= 2) {
            progressGroups[0].querySelector('.metric-value').textContent = `${data.tasa_retencion}%`;
            progressGroups[0].querySelector('.progress-bar-fill').style.width = `${data.tasa_retencion}%`;
            
            progressGroups[1].querySelector('.metric-value').textContent = `${data.usuarios_activos_porcentaje}%`;
            progressGroups[1].querySelector('.progress-bar-fill').style.width = `${data.usuarios_activos_porcentaje}%`;
        }
    } catch (error) {
        console.error('Error en cargarMetricasEngagement:', error);
        mostrarNotificacion('Error al cargar métricas de engagement', 'error');
    }
}

// ===========================
// FILTROS
// ===========================
function configurarFiltros() {
    const filterPeriod = document.getElementById('filterPeriod');
    if (filterPeriod) {
        filterPeriod.addEventListener('change', function() {
            mostrarNotificacion(`Cargando datos de ${this.value} meses...`, 'info');
            cargarUsuariosCrecimiento();
        });
    }
}

// ===========================
// ANIMACIONES
// ===========================
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// ===========================
// EXPORTAR PDF
// ===========================
function exportarPDF() {
    mostrarNotificacion('Generando PDF...', 'info');
    
    const element = document.querySelector('.main');
    const opt = {
        margin: 10,
        filename: `reporte_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save()
            .then(() => mostrarNotificacion('PDF generado correctamente', 'success'))
            .catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('Error al generar el PDF', 'error');
            });
    } else {
        mostrarNotificacion('Librería html2pdf no disponible', 'error');
    }
}

// ===========================
// UTILIDADES
// ===========================
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const existentes = document.querySelectorAll('.notificacion-custom');
    existentes.forEach(n => n.remove());

    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-custom';
    
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    notificacion.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${colores[tipo]};
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 400px;
    `;
    
    notificacion.innerHTML = `
        <i class="fas ${iconos[tipo]}" style="font-size: 20px;"></i>
        <span>${mensaje}</span>
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet)