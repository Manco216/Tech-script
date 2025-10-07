    // ======================================================
// Variables globales
// ======================================================
let sidebarOpen = false;
let currentWeek = new Date();
let weeklyChart = null;
let viewMode = 'hours'; // 'hours' o 'sessions'
let weeklyGoal = 25; 

// ======================================================
// Datos simulados del estudiante
// Cada semana empieza en domingo, y cada día contiene minutos, sesiones y logros
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarKpis();
    cargarUsuariosCrecimiento();
    cargarIngresosCategoria();
    cargarMetricasEngagement();
});

// ============================
// KPIs PRINCIPALES
// ============================
async function cargarKpis() {
    try {
        const res = await fetch("/api/reportesIns/kpis");
        const data = await res.json();

        document.getElementById("kpi-estudiantes").textContent = data.total_estudiantes.toLocaleString();
        document.getElementById("kpi-ingresos").textContent = "$" + data.ingresos_totales.toLocaleString();
        document.getElementById("kpi-finalizacion").textContent = data.tasa_finalizacion + "%";
        document.getElementById("kpi-crecimiento").textContent = data.crecimiento_estudiantes + "%";
    } catch (err) {
        console.error("Error cargando KPIs:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarKpis();
    cargarUsuariosCrecimiento();
    cargarIngresosCategoria();
    cargarMetricasEngagement();

    // Esperar que el botón exista
    const exportBtn = document.getElementById("btnExportPDF");
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            console.log("Exportando PDF...");
            exportarPDF();
        });
    } else {
        console.warn("⚠️ No se encontró el botón btnExportPDF en el DOM");
    }
});

function exportarPDF() {
    const element = document.getElementById("reportContent");
    const fecha = new Date().toLocaleDateString("es-CO");

    // Mostrar mensaje temporal
    const loadingMsg = document.createElement("div");
    loadingMsg.textContent = "Generando PDF...";
    loadingMsg.style.position = "fixed";
    loadingMsg.style.top = "20px";
    loadingMsg.style.right = "20px";
    loadingMsg.style.background = "#111";
    loadingMsg.style.color = "#fff";
    loadingMsg.style.padding = "10px 20px";
    loadingMsg.style.borderRadius = "8px";
    loadingMsg.style.zIndex = "9999";
    document.body.appendChild(loadingMsg);

    const opciones = {
        margin: [10, 10, 10, 10],
        filename: `Reporte_Plataforma_${fecha}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    html2pdf()
        .set(opciones)
        .from(element)
        .save()
        .then(() => loadingMsg.remove())
        .catch(() => loadingMsg.remove());
}


// ============================
// CRECIMIENTO DE USUARIOS
// ============================
async function cargarUsuariosCrecimiento() {
    try {
        const res = await fetch("/api/reportesIns/usuarios-crecimiento?meses=6");
        const data = await res.json();
        const ctx = document.getElementById("chartUsuarios").getContext("2d");

        new Chart(ctx, {
            type: "line",
            data: {
                labels: data.map(d => d.mes),
                datasets: [{
                    label: "Usuarios Nuevos",
                    data: data.map(d => d.total),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.2)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

// ============================
// INGRESOS POR CATEGORÍA
// ============================
async function cargarIngresosCategoria() {
    try {
        const res = await fetch("/api/reportesIns/ingresos-categoria");
        const data = await res.json();
        const ctx = document.getElementById("chartIngresos").getContext("2d");

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.map(d => d.categoria),
                datasets: [{
                    label: "Ingresos ($)",
                    data: data.map(d => d.total_ingresos),
                    backgroundColor: "rgba(34,197,94,0.6)",
                    borderColor: "#16a34a",
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    } catch (err) {
        console.error("Error cargando ingresos:", err);
    }
}

// ============================
// MÉTRICAS DE ENGAGEMENT
// ============================
async function cargarMetricasEngagement() {
    try {
        const res = await fetch("/api/reportesIns/metricas-engagement");
        const data = await res.json();

        document.getElementById("eng-activos").textContent = data.usuarios_activos + "%";
        document.getElementById("eng-sesiones").textContent = data.sesiones.toLocaleString();
        document.getElementById("eng-retencion").textContent = data.retencion + "%";
        document.getElementById("eng-tiempo").textContent = data.tiempo_promedio;
    } catch (err) {
        console.error("Error cargando engagement:", err);
    }
}


// ======================================================
// Sidebar - Gestión del menú lateral en móvil
// ======================================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    // Abrir sidebar con botón flotante
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
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
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
                sidebarOpen = false;
            }
        });
    });
    
    // Cerrar sidebar al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarOpen && window.innerWidth <= 1024) {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            sidebarOpen = false;
        }
    });
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