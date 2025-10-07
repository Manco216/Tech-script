document.addEventListener("DOMContentLoaded", function() {

    // ========================
    // DATOS DE CERTIFICADOS
    // ========================
    const certificatesData = [
        {
            id: 1,
            title: "Curso de Oratoria para Hablar en Público",
            image: "https://picsum.photos/400/250?random=1",
            color: "#4F46E5",
            completed: "14/01/2024",
            profesor: "Prof. García",
            semanas: "12 semanas"
        },
        {
            id: 2,
            title: "Curso de Excel Básico",
            image: "https://picsum.photos/400/250?random=2",
            color: "#4F46E5",
            completed: "02/08/2025",
            profesor: "Prof. Martínez",
            semanas: "8 semanas"
        },
        {
            id: 3,
            title: "Curso de tips y trucos de IA",
            image: "https://picsum.photos/400/250?random=3",
            color: "#4F46E5",
            completed: "26/07/2025",
            profesor: "Ana Torres",
            semanas: "10 semanas"
        },
        {
            id: 4,
            title: "Curso de Claude AI",
            image: "https://picsum.photos/400/250?random=4",
            color: "#7C3AED",
            completed: "20/07/2025",
            profesor: "Luis Hernández",
            semanas: "18 semanas"
        },
        {
            id: 5,
            title: "Curso de Prompt Engineering",
            image: "https://picsum.photos/400/250?random=5",
            color: "#7C3AED",
            completed: "19/07/2025",
            profesor: "Sofía Ramírez",
            semanas: "25 semanas"
        },
        {
            id: 6,
            title: "Curso Gratis de Estrategias para Aprender Inglés en Línea",
            image: "https://picsum.photos/400/250?random=6",
            color: "#7C3AED",
            completed: "15/07/2025",
            profesor: "Pedro Morales",
            semanas: "12 semanas"
        }
    ];

    // ========================
    // VARIABLES GLOBALES
    // ========================
    
    let currentFilter = 'all';
    let filteredCertificates = [...certificatesData];

    // ========================
    // ELEMENTOS DEL DOM
    // ========================
    
    const certificatesContainer = document.getElementById('certificatesContainer');
    const totalCertsElement = document.getElementById('totalCerts');
    const thisMonthElement = document.getElementById('thisMonth');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const toastContainer = document.getElementById('toastContainer');
    const sidebar = document.getElementById('sidebar');
    const toggleButtons = document.querySelectorAll('#toggleSidebar, #toggleSidebarTop');
    const overlay = document.getElementById('overlay');

    // ========================
    // INICIALIZACIÓN
    // ========================
    
    function init() {
        updateStats();
        loadCertificates();
        setupEventListeners();
        setupSidebar();
        animateStatsOnLoad();

        // Forzar vista lista siempre
        certificatesContainer.classList.add('list-view');
    }

    // ========================
    // ESTADÍSTICAS
    // ========================
    
    function updateStats() {
        const total = certificatesData.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonth = certificatesData.filter(cert => {
            const certDate = new Date(cert.completed);
            return certDate.getMonth() === currentMonth && 
                   certDate.getFullYear() === currentYear;
        }).length;

        animateCounter(totalCertsElement, total);
        animateCounter(thisMonthElement, thisMonth);
    }

    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 50);
    }

    function animateStatsOnLoad() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = `slideInRight 0.6s ease forwards`;
            }, index * 100);
        });
    }

    // ========================
    // CARGA DE CERTIFICADOS
    // ========================
    
 async function loadCertificates() {
    if (!certificatesContainer) return;

    showLoadingSkeleton();
    
    try {
        const response = await fetch('/estudiante/api/certificados');
        const certificados = await response.json();
        
        certificatesContainer.innerHTML = '';
        
        if (certificados.length === 0) {
            certificatesContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-certificate"></i>
                    <p>Aun no tienes certificados. Completa un diplomado para obtener uno.</p>
                </div>
            `;
            return;
        }
        
        certificados.forEach((cert, index) => {
            const card = document.createElement('div');
            card.className = 'certificate-card';
            card.style.opacity = '0';
            
            card.innerHTML = `
                <div class="certificate-image">
                    <img src="https://picsum.photos/400/250?random=${index}" alt="${cert.diplomado}">
                    <div class="cert-overlay" style="background: linear-gradient(45deg, #6366f140, #8b5cf615);">
                        <div class="cert-badge" style="background: #6366f1;">
                            <i class="fas fa-certificate"></i>
                        </div>
                    </div>
                </div>
                <div class="certificate-info">
                    <h3>${cert.diplomado}</h3>
                    <p class="certificate-prof">Codigo: ${cert.codigo}</p>
                    <p class="certificate-date">Emitido el ${cert.fecha_emision}</p>
                    <div class="certificate-actions">
                        <span class="share-label">Acciones:</span>
                        <div class="social-buttons">
                            <button class="social-btn download" onclick="window.location.href='${cert.url_descarga}'">
                                <i class="fas fa-download"></i>
                            </button>
                           
                        </div>
                    </div>
                </div>
            `;
            
            certificatesContainer.appendChild(card);
        });

        const cards = certificatesContainer.querySelectorAll('.certificate-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
    } catch (error) {
        console.error('Error:', error);
        certificatesContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los certificados</p>
            </div>
        `;
    }
}

    function showLoadingSkeleton() {
        certificatesContainer.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const skeleton = createSkeletonCard();
            certificatesContainer.appendChild(skeleton);
        }
    }

    function createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'certificate-card loading';
        card.innerHTML = `
            <div class="certificate-image loading-skeleton"></div>
            <div class="certificate-info">
                <div class="loading-skeleton" style="height: 20px; margin-bottom: 0.5rem;"></div>
                <div class="loading-skeleton" style="height: 16px; width: 60%; margin-bottom: 1rem;"></div>
                <div class="loading-skeleton" style="height: 12px; width: 40%;"></div>
            </div>
        `;
        return card;
    }

    // ========================
    // CREACIÓN DE TARJETAS
    // ========================
    
    function createCertificateCard(certData, index) {
        const card = document.createElement('div');
        card.className = 'certificate-card';
        card.style.opacity = '0';
       

        
        card.innerHTML = `
            <div class="certificate-image">
                <img src="${certData.image}" alt="${certData.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x250/6366f1/ffffff?text=Certificado'">
                <div class="cert-overlay" style="background: linear-gradient(45deg, ${certData.color}40, ${certData.color}15);">
                    <div class="cert-badge" style="background: ${certData.color};">
                        <i class="fas fa-certificate"></i>
                    </div>
                </div>
            </div>
            <div class="certificate-info">
                <h3>${certData.title}</h3>
                <p class="certificate-prof">Certificado por ${certData.profesor} • ${certData.semanas}</p>
                <p class="certificate-date">Aprobado el ${certData.completed}</p>
                <div class="certificate-actions">
                    <span class="share-label">Compartir en:</span>
                    <div class="social-buttons">
                        <button class="social-btn linkedin" data-action="linkedin" data-cert-id="${certData.id}">
                            <i class="fab fa-linkedin"></i>
                        </button>
                        <button class="social-btn facebook" data-action="facebook" data-cert-id="${certData.id}">
                            <i class="fab fa-facebook"></i>
                        </button>
                        <button class="social-btn copy" data-action="copy" data-cert-id="${certData.id}">
                            <i class="fas fa-link"></i>
                        </button>
                        <button class="social-btn download" data-action="download" data-cert-id="${certData.id}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event listener para abrir modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.social-btn')) {
                openCertificateModal(certData);
            }
        });

        return card;
    }

    // ========================
    // FILTROS
    // ========================
    
    function setupEventListeners() {
        // Filtros de pestañas
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.tab;
                setActiveTab(btn);
                filterCertificates(filter);
            });
        });

        // Modal
        modalClose?.addEventListener('click', closeCertificateModal);
        modalOverlay?.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeCertificateModal();
            }
        });

        // Botones sociales
        document.addEventListener('click', (e) => {
            if (e.target.closest('.social-btn')) {
                e.stopPropagation();
                const button = e.target.closest('.social-btn');
                const action = button.dataset.action;
                const certId = parseInt(button.dataset.certId);
                handleSocialAction(action, certId);
            }
        });

        // Escape para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay?.classList.contains('active')) {
                closeCertificateModal();
            }
        });
    }

    function setActiveTab(activeBtn) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    function filterCertificates(filter) {
        currentFilter = filter;
        
        switch(filter) {
            case 'recent':
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                filteredCertificates = certificatesData.filter(cert => 
                    new Date(cert.completed) >= oneMonthAgo
                );
                break;
            default:
                filteredCertificates = [...certificatesData];
        }

            if (filteredCertificates.length === 0) {
        certificatesContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle"></i>
                <p>No hay resultados en esta categoría</p>
            </div>
        `;
        return; 
    }
        
        loadCertificates();
    }

    // ========================
    // MODAL DE CERTIFICADO
    // ========================
    
    function openCertificateModal(certData) {
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalDate = document.getElementById('modalDate');

        if (modalImage) modalImage.src = certData.image;
        if (modalTitle) modalTitle.textContent = certData.title;
        if (modalDate) modalDate.textContent = `Aprobado el ${certData.date}`;

        modalOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCertificateModal() {
        modalOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ========================
    // ACCIONES SOCIALES
    // ========================
    
    function handleSocialAction(action, certId) {
        const cert = certificatesData.find(c => c.id === certId);
        if (!cert) return;

        const url = window.location.href;
        const text = `¡Acabo de completar el ${cert.title}! 🎓`;
 
        switch(action) {
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                showToast('¡Compartido en LinkedIn!', 'success');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                showToast('¡Compartido en Facebook!', 'success');
                break;
            case 'copy':
                copyToClipboard(`${text} ${url}`);
                showToast('¡Enlace copiado al portapapeles!', 'success');
                break;
            case 'download':
                downloadCertificate(cert);
                showToast('Descargando certificado...', 'info');
                break;
        }
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    function downloadCertificate(cert) {
        // Simular descarga
        const link = document.createElement('a');
        link.href = cert.image;
        link.download = `Certificado_${cert.title.replace(/\s+/g, '_')}.jpg`;
        link.click();
    }

    // ========================
    // SISTEMA DE TOAST
    // ========================
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;

        toastContainer?.appendChild(toast);

        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Ocultar y remover toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // ========================
    // SIDEBAR MÓVIL
    // ========================
    
    function setupSidebar() {
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', toggleSidebar);
        });

        overlay?.addEventListener('click', closeSidebar);

        // Cerrar sidebar al redimensionar
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
    }

    function toggleSidebar() {
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    }

    // ========================
    // BÚSQUEDA (OPCIONAL)
    // ========================
    
    function setupSearch() {
        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const query = e.target.value.toLowerCase().trim();
                    searchCertificates(query);
                }, 300);
            });
        }
    }

    function searchCertificates(query) {
        if (query === '') {
            filteredCertificates = [...certificatesData];
        } else {
            filteredCertificates = certificatesData.filter(cert =>
                cert.title.toLowerCase().includes(query)
            );
        }
        loadCertificates();
    }

    // ========================
    // INICIALIZAR TODO
    // ========================
    
    init();
    setupSearch();
});

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