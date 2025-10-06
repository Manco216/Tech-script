document.addEventListener("DOMContentLoaded", function () {
    // Inicializar todas las funcionalidades
    initSidebar();
    initTabs();
    initDropdown();
    renderCharts();
    setTimeout(animateProgressBars, 300);
});

// ========== SIDEBAR FUNCTIONALITY ==========
function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const overlay = document.getElementById("overlay");

    // Event listeners para toggle buttons
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', toggleSidebar);
    });

    // Cerrar sidebar al hacer click en overlay
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Responsive: cerrar sidebar automáticamente en pantallas grandes
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// ========== DROPDOWN FUNCTIONALITY ==========
function initDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (profileDropdown && dropdownMenu) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
}

// ========== TABS FUNCTIONALITY ==========
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active classes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active classes
            button.classList.add('active');
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

// ========== CHARTS RENDERING ==========
function renderCharts() {
    renderUsuariosChart();
    renderIngresosChart();
    renderCursosList();
}

// Datos
const datosUsuarios = [
    { mes: "Enero", estudiantes: 89, instructores: 12, total: 101 },
    { mes: "Febrero", estudiantes: 134, instructores: 18, total: 152 },
    { mes: "Marzo", estudiantes: 178, instructores: 23, total: 201 },
    { mes: "Abril", estudiantes: 223, instructores: 28, total: 251 },
    { mes: "Mayo", estudiantes: 267, instructores: 34, total: 301 },
    { mes: "Junio", estudiantes: 312, instructores: 39, total: 351 }
];

const datosIngresos = [
    { categoria: "Desarrollo Web", ingresos: 89500, porcentaje: 31.4 },
    { categoria: "Inteligencia Artificial", ingresos: 67200, porcentaje: 23.6 },
    { categoria: "Diseño UX/UI", ingresos: 45800, porcentaje: 16.1 },
    { categoria: "DevOps", ingresos: 38900, porcentaje: 13.7 },
    { categoria: "Ciberseguridad", ingresos: 28400, porcentaje: 10.0 },
    { categoria: "Otros", ingresos: 14950, porcentaje: 5.2 }
];

const datosCursos = [
    { curso: "React Full Stack", estudiantes: 245, completados: 187, tasa: 76.3 },
    { curso: "Python ML", estudiantes: 189, completados: 156, tasa: 82.5 },
    { curso: "UX/UI Design", estudiantes: 167, completados: 134, tasa: 80.2 },
    { curso: "DevOps AWS", estudiantes: 134, completados: 98, tasa: 73.1 },
    { curso: "Cybersecurity", estudiantes: 98, completados: 67, tasa: 68.4 }
];

function renderUsuariosChart() {
    const container = document.getElementById('usuarios-chart');
    if (!container) return;
    
    let html = '';
    datosUsuarios.forEach(dato => {
        html += `
            <div class="month-item">
                <div class="month-info">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="month-name">${dato.mes}</span>
                </div>
                <div class="month-stats">
                    <div class="month-total">${dato.total}</div>
                    <div class="month-breakdown">${dato.estudiantes} est. + ${dato.instructores} inst.</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderIngresosChart() {
    const container = document.getElementById('ingresos-chart');
    if (!container) return;
    
    let html = '';
    datosIngresos.forEach(dato => {
        html += `
            <div class="category-item">
                <div class="category-header">
                    <span class="category-name">${dato.categoria}</span>
                    <span class="category-amount">$${dato.ingresos.toLocaleString()}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${dato.porcentaje}%"></div>
                </div>
                <div class="category-percentage">${dato.porcentaje}% del total</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderCursosList() {
    const container = document.getElementById('cursos-list');
    if (!container) return;
    
    let html = '';
    datosCursos.forEach(curso => {
        html += `
            <div class="course-item">
                <div class="course-header">
                    <h4 class="course-title">${curso.curso}</h4>
                    <span class="course-rate">${curso.tasa}% completado</span>
                </div>
                <div class="course-stats">
                    <span>${curso.estudiantes} estudiantes inscritos</span>
                    <span>${curso.completados} completados</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${curso.tasa}%"></div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ========== ANIMATIONS ==========
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

// ========== PDF EXPORT ==========
function exportarPDF() {
    showLoadingOverlay();
    
    setTimeout(() => {
        const element = document.querySelector('.main');
        const opt = {
            margin: 10,
            filename: `reporte_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save().then(() => {
                hideLoadingOverlay();
                showNotification('Reporte exportado exitosamente', 'success');
            });
        } else {
            const reportData = {
                periodo: document.getElementById('filterPeriod')?.value || '6',
                usuarios: datosUsuarios,
                ingresos: datosIngresos,
                cursos: datosCursos,
                fecha: new Date().toLocaleString('es-ES')
            };
            
            console.log('Datos para exportar:', reportData);
            hideLoadingOverlay();
            showNotification('Preparando exportación...', 'info');
        }
    }, 500);
}

// ========== UTILITY FUNCTIONS ==========
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="spinner"></div>
        <p>Generando PDF...</p>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// ========== EVENT LISTENERS ==========
// Filter period
const filterPeriod = document.getElementById('filterPeriod');
if (filterPeriod) {
    filterPeriod.addEventListener('change', function() {
        const periodo = this.value;
        console.log('Período seleccionado:', periodo + ' meses');
        showNotification(`Mostrando datos de los últimos ${periodo} meses`, 'info');
    });
}