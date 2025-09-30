// Datos de ejemplo para los diplomados
const diplomadosData = [
    {
        id: 1,
        title: "Desarrollo Web Full Stack",
        description: "Aprende a crear aplicaciones web completas desde cero",
        level: "Intermedio",
        category: "desarrollo-web",
        rating: 4.8,
        students: 1250,
        duration: "12 semanas",
        modules: 8,
        instructor: "Prof. García",
        currentPrice: 29900,
        originalPrice: 39900,
        status: "comprar",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
        id: 2,
        title: "Inteligencia Artificial y Machine Learning",
        description: "Domina los fundamentos de IA y ML con Python",
        level: "Avanzado",
        category: "inteligencia-artificial",
        rating: 4.9,
        students: 890,
        duration: "16 semanas",
        modules: 12,
        instructor: "Dr. López",
        currentPrice: 44900,
        originalPrice: 59900,
        status: "continuar",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
        id: 3,
        title: "Ciberseguridad Básica",
        description: "Fundamentos de seguridad informática y protección de datos",
        level: "Principiante",
        category: "ciberseguridad",
        rating: 4.6,
        students: 650,
        duration: "8 semanas",
        modules: 6,
        instructor: "Prof. Martínez",
        currentPrice: 0,
        originalPrice: null,
        status: "inscribirse",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
        id: 4,
        title: "Data Science con Python",
        description: "Análisis de datos y visualización con herramientas modernas",
        level: "Intermedio",
        category: "data-science",
        rating: 4.7,
        students: 980,
        duration: "14 semanas",
        modules: 10,
        instructor: "Dra. Rodríguez",
        currentPrice: 34900,
        originalPrice: 44900,
        status: "comprar",
        gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    {
        id: 5,
        title: "Desarrollo Móvil con React Native",
        description: "Crea aplicaciones móviles multiplataforma",
        level: "Avanzado",
        category: "desarrollo-web",
        rating: 4.5,
        students: 720,
        duration: "10 semanas",
        modules: 8,
        instructor: "Prof. Sánchez",
        currentPrice: 39900,
        originalPrice: 49900,
        status: "comprar",
        gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    },
    {
        id: 6,
        title: "Blockchain y Criptomonedas",
        description: "Tecnología blockchain y desarrollo de smart contracts",
        level: "Avanzado",
        category: "desarrollo-web",
        rating: 4.4,
        students: 540,
        duration: "12 semanas",
        modules: 9,
        instructor: "Dr. Torres",
        currentPrice: 0,
        originalPrice: null,
        status: "inactivo",
        gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    }
];

class DiplomadosApp {
    constructor() {
        this.diplomados = diplomadosData;
        this.filteredDiplomados = [...diplomadosData];

        this.routes = {
            detalle:      (id) => `index.html?view=detalle&id=${id}`,
            continuar:    (id) => `index.html?view=continuar&id=${id}`,
            comprar:      (id) => `index.html?view=checkout&id=${id}`,
            inscribirse:  (id) => `index.html?view=inscripcion&id=${id}`,
            modulos:      (id) => `modulos.html?id=${id}`
        };

        this.init();
    }

    navigateTo(url) {
        window.location.href = url;
    }

    init() {
        this.renderDiplomados();
        this.setupEventListeners();
        this.setupSidebar();
    }

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
                if (!sidebar.contains(e.target) && !toggleMobileBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const levelFilter = document.getElementById('levelFilter').value;

        this.filteredDiplomados = this.diplomados.filter(diplomado => {
            const categoryMatch = !categoryFilter || diplomado.category === categoryFilter;
            const levelMatch = !levelFilter || diplomado.level.toLowerCase() === levelFilter.toLowerCase();
            return categoryMatch && levelMatch;
        });

        this.renderDiplomados();
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredDiplomados = [...this.diplomados];
        } else {
            this.filteredDiplomados = this.diplomados.filter(diplomado =>
                diplomado.title.toLowerCase().includes(query.toLowerCase()) ||
                diplomado.description.toLowerCase().includes(query.toLowerCase()) ||
                diplomado.instructor.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.renderDiplomados();
    }

    getStatusBadgeHTML(status) {
        const statusMap = {
            'comprar': { text: 'Comprar', class: 'status-comprar', icon: 'fa-shopping-cart' },
            'continuar': { text: 'Continuar', class: 'status-continuar', icon: 'fa-play-circle' },
            'inscribirse': { text: 'Inscribirse', class: 'status-inscribirse', icon: 'fa-edit' },
            'inactivo': { text: 'Inactivo', class: 'status-inactivo', icon: 'fa-ban' }
        };

        const statusInfo = statusMap[status];
        if (!statusInfo) return '';

        return `<div class="status-tag ${statusInfo.class}">
                    <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
                </div>`;
    }

    formatPrice(price) {
        if (!price || price === 0) return '';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    }

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

    getInstructorInitials(instructor) {
        return instructor
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    // ✅ Versión modificada con stats en una sola fila
    createDiplomadoCard(diplomado) {
        const statusTag = this.getStatusBadgeHTML(diplomado.status);
        const priceHTML = this.getPriceHTML(diplomado.currentPrice, diplomado.originalPrice, diplomado.status);
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
                        <button class="btn btn-primary ver-mas-btn">
                            <i class="fas fa-eye"></i>
                            Ver Más
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

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

    setupCardEventListeners() {
        const cards = document.querySelectorAll('.diplomado-card');
        
        cards.forEach(card => {
            const diplomadoId = parseInt(card.dataset.id);
            const diplomado = this.diplomados.find(d => d.id === diplomadoId);
            
            const verMasBtn = card.querySelector('.ver-mas-btn');
            if (verMasBtn) {
                verMasBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.navigateTo(this.routes.modulos(diplomado.id));
                });
            }
        });
    }

    addDiplomado(diplomado) {
        const newId = Math.max(...this.diplomados.map(d => d.id)) + 1;
        const newDiplomado = { ...diplomado, id: newId };
        this.diplomados.push(newDiplomado);
        this.filteredDiplomados = [...this.diplomados];
        this.renderDiplomados();
    }

    removeDiplomado(id) {
        this.diplomados = this.diplomados.filter(d => d.id !== id);
        this.filteredDiplomados = this.filteredDiplomados.filter(d => d.id !== id);
        this.renderDiplomados();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DiplomadosApp();
});

window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiplomadosApp;
}
