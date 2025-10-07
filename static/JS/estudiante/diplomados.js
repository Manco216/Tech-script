// diplomados.js - Integrado con backend Flask

class DiplomadosApp {
    constructor() {
        this.diplomados = [];
        this.filteredDiplomados = [];
        this.init();
    }

    async init() {
        await this.loadDiplomados();
        this.setupEventListeners();
        this.setupSidebar();
    }

    // =================== CARGAR DIPLOMADOS DESDE EL BACKEND ===================
    async loadDiplomados() {
        try {
            const response = await fetch('/estudiante/api/diplomados');
            
            if (!response.ok) {
                throw new Error('Error al cargar diplomados');
            }
            
            const data = await response.json();
            this.diplomados = data;
            this.filteredDiplomados = [...data];
            this.renderDiplomados();
            
        } catch (error) {
            console.error('Error al cargar diplomados:', error);
            this.showError('No se pudieron cargar los diplomados');
        }
    }

    // =================== MOSTRAR ERROR ===================
    showError(message) {
        const grid = document.getElementById('diplomadosGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <h3 style="color: #64748b; margin-bottom: 0.5rem;">${message}</h3>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    // =================== SETUP EVENT LISTENERS ===================
    setupEventListeners() {
        const categoryFilter = document.getElementById('categoryFilter');
        const levelFilter = document.getElementById('levelFilter');
        const applyFiltersBtn = document.getElementById('applyFilters');

        if (categoryFilter && levelFilter && applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
            categoryFilter.addEventListener('change', () => this.applyFilters());
            levelFilter.addEventListener('change', () => this.applyFilters());
        }

        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    // =================== SETUP SIDEBAR ===================
    setupSidebar() {
        const toggleBtn = document.getElementById('toggleSidebar');
        const toggleMobileBtn = document.getElementById('toggleSidebarMobile');
        const sidebar = document.getElementById('sidebar');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        if (toggleMobileBtn) {
            toggleMobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !toggleMobileBtn?.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // =================== APLICAR FILTROS ===================
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const levelFilter = document.getElementById('levelFilter').value;

        this.filteredDiplomados = this.diplomados.filter(diplomado => {
            const categoryMatch = !categoryFilter || 
                                 diplomado.category.toLowerCase() === categoryFilter.toLowerCase();
            const levelMatch = !levelFilter || 
                              diplomado.level.toLowerCase() === levelFilter.toLowerCase();
            return categoryMatch && levelMatch;
        });

        this.renderDiplomados();
    }

    // =================== BUSCAR ===================
    handleSearch(query) {
        if (!query.trim()) {
            this.filteredDiplomados = [...this.diplomados];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredDiplomados = this.diplomados.filter(diplomado =>
                diplomado.title.toLowerCase().includes(lowerQuery) ||
                diplomado.description.toLowerCase().includes(lowerQuery) ||
                diplomado.instructor.toLowerCase().includes(lowerQuery) ||
                diplomado.category.toLowerCase().includes(lowerQuery)
            );
        }
        this.renderDiplomados();
    }

    // =================== STATUS BADGE HTML ===================
    getStatusBadgeHTML(status) {
        const statusMap = {
            'comprar': { text: 'Comprar', class: 'status-comprar', icon: 'fa-shopping-cart' },
            'continuar': { text: 'Continuar', class: 'status-continuar', icon: 'fa-play-circle' },
            'inscribirse': { text: 'Gratis', class: 'status-inscribirse', icon: 'fa-gift' },
            'completado': { text: 'Completado', class: 'status-continuar', icon: 'fa-check-circle' },
            'inactivo': { text: 'Inactivo', class: 'status-inactivo', icon: 'fa-ban' }
        };

        const statusInfo = statusMap[status] || statusMap['inscribirse'];

        return `<div class="status-tag ${statusInfo.class}">
                    <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
                </div>`;
    }

    // =================== FORMATEAR PRECIO ===================
    formatPrice(price) {
        if (!price || price === 0) return '';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    }

    // =================== PRECIO HTML ===================
    getPriceHTML(currentPrice, originalPrice, status) {
        if (status === 'inscribirse' || currentPrice === 0) {
            return '<div class="free-badge">Gratuito</div>';
        }

        let priceHTML = `<div class="price-section">
            <div class="current-price">${this.formatPrice(currentPrice)}</div>`;
        
        if (originalPrice && originalPrice > currentPrice) {
            priceHTML += `<div class="original-price">${this.formatPrice(originalPrice)}</div>`;
        }
        
        priceHTML += '</div>';
        return priceHTML;
    }

    // =================== INICIALES INSTRUCTOR ===================
    getInstructorInitials(instructor) {
        return instructor
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    // =================== CREAR TARJETA DE DIPLOMADO ===================
    createDiplomadoCard(diplomado) {
        const statusTag = this.getStatusBadgeHTML(diplomado.status);
        const priceHTML = this.getPriceHTML(
            diplomado.currentPrice, 
            diplomado.originalPrice, 
            diplomado.status
        );
        const instructorInitials = this.getInstructorInitials(diplomado.instructor);

        return `
            <div class="diplomado-card" data-id="${diplomado.id}"> 
                <div class="card-header" style="background: ${diplomado.gradient}">
                    <div class="card-level">${diplomado.level}</div>
                    <h3 class="card-title">${diplomado.title}</h3>
                    <p class="card-description">${diplomado.description}</p>
                </div>
                <div class="card-body">
                    <div class="card-stats">
                        <div class="stat-row">
                            <div class="stat-item">
                                <i class="fas fa-star"></i>
                                <span>${diplomado.rating}</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <span>${diplomado.students}</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-clock"></i>
                                <span>${diplomado.duration}</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-book-open"></i>
                                <span>${diplomado.modules} módulos</span>
                            </div>
                            ${statusTag}
                        </div>
                    </div>
                    
                    <div class="instructor-info">
                        <div class="instructor-avatar">${instructorInitials}</div>
                        <div class="instructor-details">
                            <h4>Instructor</h4>
                            <span>${diplomado.instructor}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    ${priceHTML}
                    <div class="card-actions">
                        <button class="btn btn-primary ver-mas-btn" data-id="${diplomado.id}">
                            <i class="fas fa-eye"></i>
                            Ver Más
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // =================== RENDERIZAR DIPLOMADOS ===================
    renderDiplomados() {
        const grid = document.getElementById('diplomadosGrid');
        if (!grid) return;

        if (this.filteredDiplomados.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <h3 style="color: #64748b; margin-bottom: 0.5rem;">No se encontraron diplomados</h3>
                    <p style="color: #94a3b8;">Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        const diplomadosHTML = this.filteredDiplomados
            .map(diplomado => this.createDiplomadoCard(diplomado))
            .join('');

        grid.innerHTML = diplomadosHTML;
        this.setupCardEventListeners();
    }

    // =================== SETUP CARD EVENT LISTENERS ===================
    setupCardEventListeners() {
        const verMasBtns = document.querySelectorAll('.ver-mas-btn');
        
        verMasBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const diplomadoId = btn.dataset.id;
                this.navegarAModulos(diplomadoId);
            });
        });
    }

    // =================== NAVEGAR A MÓDULOS ===================
    navegarAModulos(diplomadoId) {
        window.location.href = `/estudiante/modulos/${diplomadoId}`;
    }

    // =================== MATRICULARSE (OPCIONAL) ===================
    async matricularEnDiplomado(diplomadoId) {
        try {
            const response = await fetch(`/estudiante/api/diplomados/${diplomadoId}/matricular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al matricularse');
            }

            const data = await response.json();
            alert(data.message);
            
            // Recargar diplomados
            await this.loadDiplomados();
            
        } catch (error) {
            console.error('Error al matricularse:', error);
            alert(error.message);
        }
    }
}

// =================== INICIALIZAR APP ===================
document.addEventListener('DOMContentLoaded', () => {
    new DiplomadosApp();
});

// =================== RESPONSIVE ===================
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        sidebar?.classList.remove('active');
    }
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