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
const studentData = {
    weeks: {
        '2025-09-07': {
            days: {
                sunday: { totalMinutes: 60, sessions:[{name:'Music',minutes:60,icon:'fas fa-music'}], achievements:[] },
                monday: { totalMinutes: 180, sessions:[{name:'Math',minutes:60,icon:'fas fa-book'}], achievements:['Repaso completado'] },
                tuesday: { totalMinutes: 150, sessions:[{name:'English',minutes:50,icon:'fas fa-book'}], achievements:[] },
                wednesday: { totalMinutes: 200, sessions:[{name:'Science',minutes:120,icon:'fas fa-flask'}], achievements:['Logro 1'] },
                thursday: { totalMinutes: 0, sessions:[], achievements:[] },
                friday: { totalMinutes: 240, sessions:[{name:'History',minutes:240,icon:'fas fa-book'}], achievements:['Excelente'] },
                saturday: { totalMinutes: 90, sessions:[{name:'Art',minutes:90,icon:'fas fa-paint-brush'}], achievements:[] },
            },
            streak: 3,
            efficiency: 8
        },
        '2025-09-14': {
            days: {
                sunday: { totalMinutes: 30, sessions:[{name:'Music',minutes:30,icon:'fas fa-music'}], achievements:[] },
                monday: { totalMinutes: 120, sessions:[{name:'Math',minutes:60,icon:'fas fa-book'}], achievements:['Repaso'] },
                tuesday: { totalMinutes: 180, sessions:[{name:'English',minutes:90,icon:'fas fa-book'}], achievements:[] },
                wednesday: { totalMinutes: 0, sessions:[], achievements:[] },
                thursday: { totalMinutes: 200, sessions:[{name:'Science',minutes:200,icon:'fas fa-flask'}], achievements:['Logro 2'] },
                friday: { totalMinutes: 150, sessions:[{name:'History',minutes:150,icon:'fas fa-book'}], achievements:[] },
                saturday: { totalMinutes: 100, sessions:[{name:'Art',minutes:100,icon:'fas fa-paint-brush'}], achievements:[] },
            },
            streak: 2,
            efficiency: 7
        }
    }
};

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

// ======================================================
// Inicialización
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
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

// ======================================================
// Funciones de Fechas
// ======================================================
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=domingo
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

// Formatear clave de semana YYYY-MM-DD
function formatWeekKey(date) {
    const startOfWeek = getStartOfWeek(date);
    const year = startOfWeek.getFullYear();
    const month = String(startOfWeek.getMonth() + 1).padStart(2,'0');
    const day = String(startOfWeek.getDate()).padStart(2,'0');
    return `${year}-${month}-${day}`;
}

// ======================================================
// Mostrar rango de la semana en el header
// ======================================================
function updateWeekDisplay() {
    const weekInfo = document.getElementById('currentWeek');
    if(!weekInfo) return;
    const start = getStartOfWeek(currentWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    weekInfo.textContent = `Semana del ${formatDate(start,'d MMM')} - ${formatDate(end,'d MMM yyyy')}`;
}

function formatDate(date, format) {
    const options = {
        'd': date.getDate(),
        'MMM': date.toLocaleDateString('es-ES', { month: 'short' }),
        'yyyy': date.getFullYear()
    };
    return format.replace(/d|MMM|yyyy/g, m => options[m]);
}

// ======================================================
// Cambio de semana
// ======================================================
function changeWeek(direction) {
    currentWeek.setDate(currentWeek.getDate() + direction * 7);
    updateWeekDisplay();
    updateChart();
}

// ======================================================
// Chart - Gráfico semanal
// ======================================================
function initializeChart() {
    const ctx = document.getElementById('weeklyChart');
    if(!ctx) return;

    ctx.height = 400;

    const gradient = ctx.getContext('2d').createLinearGradient(0,0,0,400);
    gradient.addColorStop(0,'rgba(99,102,241,0.3)');
    gradient.addColorStop(1,'rgba(99,102,241,0.05)');

    weeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
            datasets: [{
                label: 'Horas de Estudio',
                data: [0,0,0,0,0,0,0],
                borderColor: '#6366f1',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 5 },
                x: { grid: { display: false } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const h = Math.floor(ctx.parsed.y);
                            const m = Math.round((ctx.parsed.y - h)*60);
                            return `${h}h ${m}m de estudio`;
                        }
                    }
                }
            }
        }
    });
}

function updateChart() {
    if(!weeklyChart) return;
    const weekKey = formatWeekKey(currentWeek);
    const weekData = studentData.weeks[weekKey];
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

    if(weekData) {
        if(viewMode==='hours') {
            weeklyChart.data.datasets[0].data = days.map(d => (weekData.days[d]?.totalMinutes || 0)/60);
            weeklyChart.data.datasets[0].label = 'Horas de Estudio';
            weeklyChart.options.scales.y.max = Math.max(...weeklyChart.data.datasets[0].data)+1;
        } else {
            weeklyChart.data.datasets[0].data = days.map(d => weekData.days[d]?.sessions.length || 0);
            weeklyChart.data.datasets[0].label = 'Sesiones';
            weeklyChart.options.scales.y.max = Math.max(...weeklyChart.data.datasets[0].data)+1;
        }
    } else {
        // Si no hay datos de la semana, resetear
        weeklyChart.data.datasets[0].data = [0,0,0,0,0,0,0];
        weeklyChart.data.datasets[0].label = 'Horas de Estudio';
        weeklyChart.options.scales.y.max = 5;
    }

    weeklyChart.update();
}

// ======================================================
// Manejo de redimensionamiento
// ======================================================
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth > 1024 && sidebar && sidebarOverlay) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        sidebarOpen = false;
    }
});
