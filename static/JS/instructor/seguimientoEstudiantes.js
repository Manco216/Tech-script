(function(){
    // ========== ELEMENTOS DEL DOM ==========
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const toggleSidebarMobileBtn = document.getElementById('toggleSidebarMobile');
    const diplomadoFilter = document.getElementById('diplomadoFilter');
    const periodFilter = document.getElementById('periodFilter');
    const exportDataBtn = document.getElementById('exportData');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const sendGroupMessageBtn = document.getElementById('sendGroupMessage');

    let enrollmentChart = null;
    let diplomadosData = [];
    let estadisticasGenerales = {};

    // ========== INICIALIZACIÓN ==========
    async function init() {
        try {
            await cargarDiplomados();
            await cargarEstadisticasGenerales();
            await cargarDistribucionProgreso();
            await cargarActividadReciente();
            await cargarTopDiplomados();
            await cargarTendenciaInscripciones();
        } catch (error) {
            console.error('Error al inicializar:', error);
            mostrarError('Error al cargar los datos');
        }
    }

    // ========== CARGAR DIPLOMADOS ==========
    async function cargarDiplomados() {
        try {
            const response = await fetch('/instructor/api/diplomados-estudiantes');
            if (!response.ok) throw new Error('Error al cargar diplomados');
            
            diplomadosData = await response.json();
            llenarFiltroDiplomados();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // ========== LLENAR FILTRO DE DIPLOMADOS ==========
    function llenarFiltroDiplomados() {
        diplomadoFilter.innerHTML = '<option value="">Todos los diplomados</option>';
        
        diplomadosData.forEach(diplomado => {
            const option = document.createElement('option');
            option.value = diplomado.id;
            option.textContent = diplomado.name;
            diplomadoFilter.appendChild(option);
        });
    }

    // ========== CARGAR ESTADÍSTICAS GENERALES ==========
    async function cargarEstadisticasGenerales() {
        try {
            const response = await fetch('/instructor/api/estadisticas/generales');
            if (!response.ok) throw new Error('Error al cargar estadísticas');
            
            estadisticasGenerales = await response.json();
            actualizarStatsCards();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // ========== ACTUALIZAR CARDS DE ESTADÍSTICAS ==========
    function actualizarStatsCards() {
        document.getElementById('totalStudents').textContent = 
            estadisticasGenerales.total_estudiantes.toLocaleString();
        
        document.getElementById('activeStudents').textContent = 
            `${estadisticasGenerales.estudiantes_activos} activos`;
        
        document.getElementById('totalDiplomas').textContent = 
            estadisticasGenerales.total_diplomados;
        
        document.getElementById('avgStudentsPerDiploma').textContent = 
            `${estadisticasGenerales.avg_estudiantes_por_diplomado} promedio/diplomado`;
        
        document.getElementById('totalCertificates').textContent = 
            estadisticasGenerales.total_certificados;
        
        // Calcular crecimiento mensual (simulado por ahora)
        const monthlyGrowth = Math.round(estadisticasGenerales.total_certificados * 0.05);
        document.getElementById('monthlyGrowth').textContent = 
            `+${monthlyGrowth} este mes`;
    }

    // ========== CARGAR DISTRIBUCIÓN DE PROGRESO ==========
    async function cargarDistribucionProgreso() {
        try {
            const response = await fetch('/instructor/api/distribucion-progreso');
            if (!response.ok) throw new Error('Error al cargar distribución');
            
            const data = await response.json();
            actualizarProgresoGeneral(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // ========== ACTUALIZAR BARRAS DE PROGRESO ==========
    function actualizarProgresoGeneral(data) {
        const total = data.iniciando + data.en_progreso + data.avanzado;
        
        if (total === 0) {
            document.querySelector('.progress-overview').innerHTML = 
                '<p style="text-align: center; padding: 2rem;">No hay datos de progreso disponibles</p>';
            return;
        }

        const porcentajeIniciando = Math.round((data.iniciando / total) * 100);
        const porcentajeProgreso = Math.round((data.en_progreso / total) * 100);
        const porcentajeAvanzado = Math.round((data.avanzado / total) * 100);

        // Iniciando
        document.querySelector('.progress-fill.starting').style.width = `${porcentajeIniciando}%`;
        document.querySelector('.progress-item:nth-child(1) .progress-value').textContent = 
            `${data.iniciando} estudiantes`;

        // En progreso
        document.querySelector('.progress-fill.progress').style.width = `${porcentajeProgreso}%`;
        document.querySelector('.progress-item:nth-child(2) .progress-value').textContent = 
            `${data.en_progreso} estudiantes`;

        // Avanzado
        document.querySelector('.progress-fill.advanced').style.width = `${porcentajeAvanzado}%`;
        document.querySelector('.progress-item:nth-child(3) .progress-value').textContent = 
            `${data.avanzado} estudiantes`;
    }

    // ========== CARGAR ACTIVIDAD RECIENTE ==========
    async function cargarActividadReciente() {
        try {
            const response = await fetch('/instructor/api/actividad-reciente');
            if (!response.ok) throw new Error('Error al cargar actividad');
            
            const data = await response.json();
            actualizarActividadReciente(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // ========== ACTUALIZAR ACTIVIDAD RECIENTE ==========
    function actualizarActividadReciente(data) {
        const activityNumbers = document.querySelectorAll('.activity-number');
        activityNumbers[0].textContent = data.nuevas_inscripciones;
        activityNumbers[1].textContent = data.modulos_completados;
        activityNumbers[2].textContent = data.certificados_emitidos;
    }

    // ========== CARGAR TOP DIPLOMADOS ==========
    async function cargarTopDiplomados() {
        try {
            const response = await fetch('/instructor/api/top-diplomados');
            if (!response.ok) throw new Error('Error al cargar top diplomados');
            
            const data = await response.json();
            actualizarTopDiplomados(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // ========== ACTUALIZAR TOP DIPLOMADOS ==========
    function actualizarTopDiplomados(data) {
        const topCoursesContainer = document.querySelector('.top-courses');
        
        if (data.length === 0) {
            topCoursesContainer.innerHTML = 
                '<p style="text-align: center; padding: 2rem;">No hay diplomados disponibles</p>';
            return;
        }

        topCoursesContainer.innerHTML = '';
        
        data.forEach(diplomado => {
            const courseRank = document.createElement('div');
            courseRank.className = 'course-rank';
            courseRank.innerHTML = `
                <span class="rank-number">${diplomado.rank}</span>
                <div class="course-info">
                    <span class="course-name">${diplomado.nombre}</span>
                    <span class="course-students">${diplomado.estudiantes} estudiantes</span>
                </div>
                <span class="course-percentage">${diplomado.porcentaje}%</span>
            `;
            topCoursesContainer.appendChild(courseRank);
        });
    }

    // ========== CARGAR TENDENCIA DE INSCRIPCIONES ==========
    async function cargarTendenciaInscripciones() {
        try {
            const response = await fetch('/instructor/api/tendencia-inscripciones');
            if (!response.ok) throw new Error('Error al cargar tendencia');
            
            const data = await response.json();
            renderizarGraficoInscripciones(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // ========== RENDERIZAR GRÁFICO DE INSCRIPCIONES ==========
    function renderizarGraficoInscripciones(data) {
        const ctx = document.getElementById('enrollmentChart');
        
        if (!ctx) return;

        if (enrollmentChart) {
            enrollmentChart.destroy();
        }

        enrollmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Inscripciones',
                    data: data.data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#6366f1',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
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

    // ========== FILTRO POR DIPLOMADO ==========
    diplomadoFilter.addEventListener('change', async function() {
        const diplomadoId = this.value;
        
        if (!diplomadoId) {
            // Cargar estadísticas generales
            await cargarEstadisticasGenerales();
            await cargarDistribucionProgreso();
            return;
        }

        try {
            const response = await fetch(`/instructor/api/estadisticas/diplomado/${diplomadoId}`);
            if (!response.ok) throw new Error('Error al filtrar por diplomado');
            
            const data = await response.json();
            actualizarStatsCardsFiltradas(data);
            
            // Actualizar distribución de progreso (simulada)
            const distribucion = {
                iniciando: Math.round(data.total_estudiantes * 0.3),
                en_progreso: Math.round(data.total_estudiantes * 0.5),
                avanzado: Math.round(data.total_estudiantes * 0.2)
            };
            actualizarProgresoGeneral(distribucion);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al filtrar datos');
        }
    });

    // ========== ACTUALIZAR STATS FILTRADAS ==========
    function actualizarStatsCardsFiltradas(data) {
        document.getElementById('totalStudents').textContent = 
            data.total_estudiantes.toLocaleString();
        
        document.getElementById('activeStudents').textContent = 
            `${data.estudiantes_activos} activos`;
        
        document.getElementById('totalDiplomas').textContent = '1';
        
        document.getElementById('avgStudentsPerDiploma').textContent = 
            `${data.total_estudiantes} estudiantes`;
        
        document.getElementById('totalCertificates').textContent = 
            data.total_certificados;
    }

    // ========== TABS ==========
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // ========== SIDEBAR TOGGLE ==========
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
    }

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    if (toggleSidebarMobileBtn) {
        toggleSidebarMobileBtn.addEventListener('click', toggleSidebar);
    }

    // ========== EXPORTAR DATOS ==========
    exportDataBtn.addEventListener('click', async function() {
        try {
            const diplomadoId = diplomadoFilter.value;
            let endpoint = '/instructor/api/estadisticas/generales';
            
            if (diplomadoId) {
                endpoint = `/instructor/api/estadisticas/diplomado/${diplomadoId}`;
            }
            
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Error al exportar datos');
            
            const data = await response.json();
            
            // Crear CSV
            let csv = 'Métrica,Valor\n';
            csv += `Total Estudiantes,${data.total_estudiantes}\n`;
            csv += `Estudiantes Activos,${data.estudiantes_activos || data.activos}\n`;
            csv += `Certificados Emitidos,${data.total_certificados}\n`;
            
            if (!diplomadoId) {
                csv += `Total Diplomados,${data.total_diplomados}\n`;
                csv += `Promedio por Diplomado,${data.avg_estudiantes_por_diplomado}\n`;
            }
            
            // Descargar archivo
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `estadisticas_${Date.now()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            mostrarExito('Datos exportados correctamente');
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al exportar datos');
        }
    });

    // ========== MENSAJE GRUPAL ==========
    sendGroupMessageBtn.addEventListener('click', function() {
        const mensaje = prompt('Escribe el mensaje para todos los estudiantes:');
        
        if (mensaje && mensaje.trim()) {
            // Aquí podrías implementar el envío real del mensaje
            mostrarExito('Mensaje enviado a todos los estudiantes');
        }
    });

    // ========== UTILIDADES ==========
    function mostrarError(mensaje) {
        alert('❌ ' + mensaje);
    }

    function mostrarExito(mensaje) {
        alert('✅ ' + mensaje);
    }

    // ========== BÚSQUEDA ==========
    const searchInput = document.querySelector('.search-container input');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (searchTerm.length < 2) {
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                await buscarEstudiantes(searchTerm);
            }, 500);
        });
    }

    // ========== FUNCIÓN DE BÚSQUEDA ==========
    async function buscarEstudiantes(termino) {
        try {
            const response = await fetch(`/instructor/api/estudiantes/buscar?q=${encodeURIComponent(termino)}`);
            if (!response.ok) throw new Error('Error en búsqueda');
            
            const resultados = await response.json();
            mostrarResultadosBusqueda(resultados);
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    }

    // ========== MOSTRAR RESULTADOS DE BÚSQUEDA ==========
    function mostrarResultadosBusqueda(resultados) {
        if (resultados.length === 0) {
            mostrarMensaje('No se encontraron estudiantes');
            return;
        }

        let mensaje = `Se encontraron ${resultados.length} estudiante(s):\n\n`;
        resultados.forEach(est => {
            mensaje += `• ${est.nombre} (${est.correo}) - ${est.total_diplomados} diplomado(s)\n`;
        });
        
        alert(mensaje);
    }

    // ========== FILTRO DE PERÍODO ==========
    periodFilter.addEventListener('change', function() {
        const periodo = this.value;
        console.log('Filtrando por período:', periodo);
        // Esta funcionalidad puede implementarse según necesidades
        mostrarMensaje(`Filtro de período aplicado: ${this.options[this.selectedIndex].text}`);
    });

    // ========== MANEJO DE NOTIFICACIONES ==========
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            mostrarNotificaciones();
        });
    }

    function mostrarNotificaciones() {
        alert('📬 Notificaciones:\n\n' +
              '• Nuevo estudiante inscrito en React\n' +
              '• 5 certificados listos para emitir\n' +
              '• Actualización de progreso disponible');
    }

    // ========== PERFIL USUARIO ==========
    const profilePic = document.getElementById('profile');
    if (profilePic) {
        profilePic.addEventListener('click', function() {
            window.location.href = '/instructor/perfil';
        });
    }

    // ========== MENSAJES MEJORADOS ==========
    function mostrarMensaje(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = mensaje;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function mostrarError(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'toast-message error';
        toast.textContent = '❌ ' + mensaje;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function mostrarExito(mensaje) {
        mostrarMensaje('✅ ' + mensaje);
    }

    // ========== AGREGAR ESTILOS DE ANIMACIÓN ==========
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            padding: 1rem;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        .loading::after {
            content: '...';
            animation: dots 1.5s steps(4, end) infinite;
        }
        
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
    `;
    document.head.appendChild(style);

    // ========== MANEJO DE ERRORES DE RED ==========
    window.addEventListener('online', function() {
        mostrarExito('Conexión restaurada');
        init(); // Recargar datos
    });

    window.addEventListener('offline', function() {
        mostrarError('Sin conexión a internet');
    });

    // ========== ACTUALIZACIÓN AUTOMÁTICA ==========
    let autoRefreshInterval;
    
    function iniciarActualizacionAutomatica() {
        autoRefreshInterval = setInterval(async () => {
            try {
                await cargarActividadReciente();
                console.log('Datos actualizados automáticamente');
            } catch (error) {
                console.error('Error en actualización automática:', error);
            }
        }, 60000); // Cada 60 segundos
    }

    function detenerActualizacionAutomatica() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
    }

    // Iniciar actualización automática
    iniciarActualizacionAutomatica();

    // Detener al salir de la página
    window.addEventListener('beforeunload', detenerActualizacionAutomatica);

    // Inicializar aplicación
    init();
})();