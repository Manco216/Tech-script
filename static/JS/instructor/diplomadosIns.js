class DiplomaApp {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.currentView = 'diplomados';
        this.selectedCourse = null;
        this.filteredContent = [];
        this.allContent = [];
        this.objectives = [];
        this.currentEditingCourse = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSidebar();
        this.setupModals();
        this.loadDiplomados();
        this.showView('diplomados');
    }

    setupEventListeners() {
        // Filtros de diplomados
        const searchInput = document.getElementById("search");
        const statusFilter = document.getElementById("status-filter");
        const categoryFilter = document.getElementById("category-filter");
        const clearBtn = document.getElementById("clear-filters");

        if (searchInput) searchInput.addEventListener("input", () => this.applyFilters());
        if (statusFilter) statusFilter.addEventListener("change", () => this.applyFilters());
        if (categoryFilter) categoryFilter.addEventListener("change", () => this.applyFilters());
        if (clearBtn) clearBtn.addEventListener("click", () => this.clearFilters());

        // Navegación
        const backBtn = document.getElementById("backToDiplomados");
        if (backBtn) backBtn.addEventListener("click", () => {
            this.showView('diplomados');
            this.loadDiplomados();
        });

        // Botones principales
        const createCourseBtn = document.getElementById("createCourseBtn");
        const addContentBtn = document.getElementById("addContentBtn");
        
        if (createCourseBtn) createCourseBtn.addEventListener("click", () => this.openCourseModal());
        if (addContentBtn) addContentBtn.addEventListener("click", () => this.navigateToUploadContent());

        // Filtros de contenido
        const contentTypeFilter = document.getElementById("content-type-filter");
        const contentStatusFilter = document.getElementById("content-status-filter");
        const contentSearch = document.getElementById("content-search");

        if (contentTypeFilter) contentTypeFilter.addEventListener("change", () => this.applyContentFilters());
        if (contentStatusFilter) contentStatusFilter.addEventListener("change", () => this.applyContentFilters());
        if (contentSearch) contentSearch.addEventListener("input", () => this.applyContentFilters());

        // Tabs de contenido
        const contentTabs = document.querySelectorAll('.tab-btn[data-tab]');
        contentTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchContentTab(tab.dataset.tab));
        });
    }

    navigateToUploadContent() {
        if (this.selectedCourse) {
            window.location.href = `/subirContenido?diplomado_id=${this.selectedCourse.id}`;
        } else {
            this.showNotification("Error: No se ha seleccionado un diplomado", "error");
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

    setupModals() {
        const modal = document.getElementById("modalOverlay");
        const closeBtn = document.getElementById("closeModal");
        const cancelBtn = document.getElementById("cancelBtn");
        const saveBtn = document.getElementById("saveBtn");

        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) btn.addEventListener("click", () => this.closeCourseModal());
        });

        if (saveBtn) saveBtn.addEventListener("click", () => this.saveCourse());

        const addObjectiveBtn = document.getElementById("addObjective");
        const objectiveInput = document.getElementById("newObjective");

        if (addObjectiveBtn && objectiveInput) {
            addObjectiveBtn.addEventListener("click", () => this.addObjective());
            objectiveInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.addObjective();
                }
            });
        }

        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) this.closeCourseModal();
            });
        }

        this.setupModalTabs();
    }

    setupModalTabs() {
        const modalTabs = document.querySelectorAll("#modalOverlay .modal-tab");
        const tabPanels = document.querySelectorAll("#modalOverlay .tab-panel");

        modalTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                modalTabs.forEach(t => t.classList.remove("active"));
                tabPanels.forEach(p => p.classList.remove("active"));
                tab.classList.add("active");
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
            });
        });
    }

    // =================== CARGAR DIPLOMADOS ===================
    async loadDiplomados() {
        try {
            console.log('🔄 Cargando diplomados...');
            const response = await fetch('/diplomados/api/listar');
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`Error al cargar diplomados: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Diplomados recibidos:', data);
            console.log('📊 Total diplomados:', data.length);
            
            this.courses = data;
            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
        } catch (error) {
            console.error('💥 Error al cargar diplomados:', error);
            this.showNotification('Error al cargar diplomados: ' + error.message, 'error');
        }
    }

    // =================== GESTIÓN DE VISTAS ===================
    showView(viewName) {
        const views = document.querySelectorAll('.view-container');
        views.forEach(v => v.classList.remove('active'));
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }
    }

    // =================== VER CONTENIDO DEL DIPLOMADO ===================
    async viewCourseContent(courseId) {
        try {
            this.selectedCourse = this.courses.find(c => c.id == courseId);
            if (!this.selectedCourse) {
                this.showNotification('Diplomado no encontrado', 'error');
                return;
            }

            // Cargar contenidos desde la base de datos
            const response = await fetch(`/contenido/api/listar/${courseId}`);
            if (!response.ok) throw new Error('Error al cargar contenidos');
            
            this.allContent = await response.json();
            this.filteredContent = [...this.allContent];
            
            this.updateCourseHeader();
            this.renderContent();
            this.showView('content');
        } catch (error) {
            console.error('Error al cargar contenidos:', error);
            this.showNotification('Error al cargar contenidos del diplomado', 'error');
        }
    }

    updateCourseHeader() {
        if (!this.selectedCourse) return;

        const titleEl = document.getElementById('course-title-header');
        const descEl = document.getElementById('course-description-header');
        const nameEl = document.getElementById('selected-course-name');
        const studentsEl = document.getElementById('selected-course-students');
        const contentEl = document.getElementById('selected-course-content');

        if (titleEl) titleEl.textContent = this.selectedCourse.titulo;
        if (descEl) descEl.textContent = this.selectedCourse.descripcion;
        if (nameEl) nameEl.textContent = this.selectedCourse.titulo;
        if (studentsEl) studentsEl.textContent = `0 estudiantes`;
        if (contentEl) contentEl.textContent = `${this.filteredContent.length} contenidos`;
    }

    switchContentTab(tabName) {
        const tabs = document.querySelectorAll('.tab-btn[data-tab]');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(tabName);

        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    // =================== FILTROS ===================
    applyFilters() {
        const searchTerm = document.getElementById("search")?.value.toLowerCase() || "";
        const statusFilter = document.getElementById("status-filter")?.value || "all";
        const categoryFilter = document.getElementById("category-filter")?.value || "all";

        this.filteredCourses = this.courses.filter(course => {
            const matchSearch = course.titulo.toLowerCase().includes(searchTerm) || 
                              course.descripcion.toLowerCase().includes(searchTerm);
            const matchStatus = statusFilter === "all" || course.estado === statusFilter;
            const matchCategory = categoryFilter === "all" || course.categoria === categoryFilter;

            return matchSearch && matchStatus && matchCategory;
        });

        this.renderCourses();
    }

    clearFilters() {
        document.getElementById("search").value = "";
        document.getElementById("status-filter").value = "all";
        document.getElementById("category-filter").value = "all";
        this.filteredCourses = [...this.courses];
        this.renderCourses();
    }

    applyContentFilters() {
        if (!this.selectedCourse) return;

        const typeFilter = document.getElementById("content-type-filter")?.value || "all";
        const statusFilter = document.getElementById("content-status-filter")?.value || "all";
        const searchTerm = document.getElementById("content-search")?.value.toLowerCase() || "";

        this.filteredContent = this.allContent.filter(content => {
            const matchType = typeFilter === "all" || content.tipo === typeFilter;
            const matchStatus = statusFilter === "all" || content.estado === statusFilter;
            const matchSearch = content.titulo.toLowerCase().includes(searchTerm) ||
                              (content.descripcion && content.descripcion.toLowerCase().includes(searchTerm));

            return matchType && matchStatus && matchSearch;
        });

        this.renderContent();
        
        // Actualizar contador
        const contentEl = document.getElementById('selected-course-content');
        if (contentEl) contentEl.textContent = `${this.filteredContent.length} contenidos`;
    }

    // =================== RENDERIZADO ===================
    renderCourses() {
        const container = document.getElementById("courses-list");
        if (!container) return;

        if (this.filteredCourses.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <h3 style="color: #64748b; margin-bottom: 0.5rem;">No se encontraron diplomados</h3>
                    <p style="color: #94a3b8;">Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredCourses.map(course => `
            <div class="course-card">
                <div class="course-gradient-header ${this.getCategoryClass(course.categoria)}">
                    <div class="course-header-content">
                        <h3 class="course-title">${course.titulo}</h3>
                        <p class="course-description">${course.descripcion}</p>
                    </div>
                    <div class="course-level-badge">${course.nivel}</div>
                </div>
                <div class="course-card-body">
                    <div class="course-meta">
                        <div class="course-stats">
                            <div class="course-stat">
                                <i class="fas fa-clock"></i>
                                <span>${course.duracion_horas} horas</span>
                            </div>
                            <div class="course-stat">
                                <i class="fas fa-book-open"></i>
                                <span>${course.lecciones_estimadas} lecciones</span>
                            </div>
                        </div>
                        <div class="course-status">
                            <span class="course-status-badge ${course.estado}">
                                ${this.getStatusLabel(course.estado)}
                            </span>
                            <div class="price">${this.formatPrice(course.precio)}</div>
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="course-action-btn primary" onclick="app.viewCourseContent(${course.id})">
                            <i class="fas fa-folder-open"></i> Contenido
                        </button>
                        <button class="course-action-btn secondary" onclick="app.editCourse(${course.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="course-action-btn danger" onclick="app.deleteCourse(${course.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }

    renderContent() {
        const container = document.getElementById("content-grid");
        if (!container) return;

        if (this.filteredContent.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <h3 style="color: #64748b; margin-bottom: 0.5rem;">No hay contenido disponible</h3>
                    <p style="color: #94a3b8;">Comienza agregando contenido a este diplomado</p>
                    <button class="btn btn-primary" onclick="app.navigateToUploadContent()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Agregar Primer Contenido
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredContent.map(content => `
            <div class="content-item">
                <div class="content-item-header">
                    <span class="content-type-badge ${content.tipo}">${this.getTypeLabel(content.tipo)}</span>
                    <span class="status-badge ${content.estado}">${this.getStatusLabel(content.estado)}</span>
                </div>
                <h4>${content.titulo}</h4>
                <p>${content.descripcion || 'Sin descripción'}</p>
                <div class="content-item-meta">
                    <span><i class="fas fa-layer-group"></i> ${content.leccion || 'General'}</span>
                    <span><i class="fas fa-calendar"></i> ${content.fecha_creacion || 'Sin fecha'}</span>
                </div>
                <div class="content-item-actions">
                    <button class="content-action-btn" onclick="app.viewContent(${content.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="content-action-btn" onclick="app.downloadContent('${content.archivo_url || ''}')" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="content-action-btn danger" onclick="app.deleteContent(${content.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join("");
    }

    // =================== MODALES ===================
    openCourseModal(courseId = null) {
        const modal = document.getElementById("modalOverlay");
        const modalTitle = document.getElementById("modal-title");
        const saveButton = document.getElementById("save-btn-text");

        if (courseId) {
            this.currentEditingCourse = this.courses.find(c => c.id == courseId);
            modalTitle.textContent = "Editar Diplomado";
            saveButton.textContent = "Actualizar Diplomado";
            this.populateCourseForm();
        } else {
            this.currentEditingCourse = null;
            modalTitle.textContent = "Crear Nuevo Diplomado";
            saveButton.textContent = "Crear Diplomado";
            this.resetCourseForm();
        }

        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    closeCourseModal() {
        const modal = document.getElementById("modalOverlay");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "auto";
            this.resetCourseForm();
        }
    }

    // =================== ACCIONES DE CONTENIDO ===================
    viewContent(contentId) {
        const content = this.filteredContent.find(c => c.id == contentId);
        if (content && content.archivo_url) {
            window.open(content.archivo_url, '_blank');
        } else {
            this.showNotification("Contenido no disponible", "info");
        }
    }

    downloadContent(archivo_url) {
        if (archivo_url && archivo_url !== '') {
            const link = document.createElement('a');
            link.href = archivo_url;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showNotification("Descargando contenido...", "info");
        } else {
            this.showNotification("No hay archivo disponible", "error");
        }
    }

    async deleteContent(contentId) {
        if (!confirm("¿Estás seguro de que quieres eliminar este contenido?")) return;

        try {
            const response = await fetch(`/contenido/api/eliminar/${contentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar contenido');

            this.showNotification("Contenido eliminado exitosamente", "success");
            await this.viewCourseContent(this.selectedCourse.id);
        } catch (error) {
            console.error('Error:', error);
            this.showNotification("Error al eliminar contenido", "error");
        }
    }

    editCourse(courseId) {
        this.openCourseModal(courseId);
    }

    async deleteCourse(courseId) {
        if (!confirm("¿Estás seguro de que quieres eliminar este diplomado? Esta acción no se puede deshacer.")) return;

        try {
            const response = await fetch(`/diplomados/api/eliminar/${courseId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar diplomado');

            this.showNotification("Diplomado eliminado exitosamente", "success");
            await this.loadDiplomados();
        } catch (error) {
            console.error('Error:', error);
            this.showNotification("Error al eliminar diplomado", "error");
        }
    }

    getCategoryClass(category) {
        const categoryMap = {
            'Frontend': 'frontend',
            'Backend': 'backend',
            'Data Science': 'data-science',
            'DevOps': 'devops'
        };
        return categoryMap[category] || 'frontend';
    }

    // =================== FORMULARIOS ===================
    populateCourseForm() {
        if (!this.currentEditingCourse) return;

        const course = this.currentEditingCourse;
        document.getElementById("courseTitle").value = course.titulo || "";
        document.getElementById("courseCategory").value = course.categoria || "";
        document.getElementById("courseDescription").value = course.descripcion || "";
        document.getElementById("courseLevel").value = course.nivel || "Principiante";
        document.getElementById("courseDuration").value = course.duracion_horas || "";
        document.getElementById("courseLessons").value = course.lecciones_estimadas || "";
        document.getElementById("coursePrice").value = course.precio || "";
        document.getElementById("courseStatus").value = course.estado || "draft";

        this.objectives = Array.isArray(course.objetivos) ? course.objetivos : [];
        this.renderObjectives();
    }

    resetCourseForm() {
        const inputs = document.querySelectorAll("#modalOverlay input, #modalOverlay select, #modalOverlay textarea");
        inputs.forEach(input => {
            if (input.type === "checkbox" || input.type === "radio") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });

        this.objectives = [];
        this.renderObjectives();
        this.currentEditingCourse = null;

        const modalTabs = document.querySelectorAll("#modalOverlay .modal-tab");
        const tabPanels = document.querySelectorAll("#modalOverlay .tab-panel");
        modalTabs.forEach(t => t.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));
        modalTabs[0]?.classList.add("active");
        tabPanels[0]?.classList.add("active");
    }

    async saveCourse() {
        const title = document.getElementById("courseTitle")?.value.trim();
        const category = document.getElementById("courseCategory")?.value;
        const description = document.getElementById("courseDescription")?.value.trim();
        const level = document.getElementById("courseLevel")?.value;
        const duration = document.getElementById("courseDuration")?.value;
        const lessons = document.getElementById("courseLessons")?.value;
        const price = document.getElementById("coursePrice")?.value;
        const status = document.getElementById("courseStatus")?.value;

        if (!title || !category || !description) {
            this.showNotification("Por favor completa los campos obligatorios (Título, Categoría y Descripción)", "error");
            return;
        }

        const courseData = {
            titulo: title,
            categoria: category,
            descripcion: description,
            nivel: level || "Principiante",
            duracion_horas: parseInt(duration) || 0,
            lecciones_estimadas: parseInt(lessons) || 0,
            objetivos: this.objectives,
            precio: parseFloat(price) || 0,
            estado: status || "draft"
        };

        try {
            let response;
            if (this.currentEditingCourse) {
                response = await fetch(`/diplomados/api/editar/${this.currentEditingCourse.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(courseData)
                });
            } else {
                response = await fetch('/diplomados/api/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(courseData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar diplomado');
            }

            const message = this.currentEditingCourse ? "Diplomado actualizado exitosamente" : "Diplomado creado exitosamente";
            this.showNotification(message, "success");
            this.closeCourseModal();
            await this.loadDiplomados();
        } catch (error) {
            console.error('Error:', error);
            this.showNotification(error.message || "Error al guardar diplomado", "error");
        }
    }

    // =================== OBJETIVOS ===================
    addObjective() {
        const input = document.getElementById("newObjective");
        const value = input?.value.trim();
        
        if (value && !this.objectives.includes(value)) {
            this.objectives.push(value);
            input.value = "";
            this.renderObjectives();
        }
    }

    removeObjective(index) {
        this.objectives.splice(index, 1);
        this.renderObjectives();
    }

    renderObjectives() {
        const container = document.getElementById("objectivesList");
        if (!container) return;

        container.innerHTML = this.objectives.map((obj, index) => `
            <div class="tag">
                ${obj}
                <span class="remove" onclick="app.removeObjective(${index})">&times;</span>
            </div>
        `).join("");
    }

    // =================== UTILIDADES ===================
    getTypeLabel(type) {
        const labels = {
            "video": "Video",
            "document": "Documento",
            "image": "Imagen",
            "quiz": "Evaluación"
        };
        return labels[type] || type;
    }

    getStatusLabel(status) {
        const labels = {
            "published": "Publicado",
            "draft": "Borrador",
            "active": "Activo",
            "archived": "Archivado",
            "processing": "Procesando"
        };
        return labels[status] || status;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    }

    updateStats() {
        const totalCourses = this.courses.length;
        const activeCourses = this.courses.filter(c => c.estado === 'active').length;

        const elements = {
            'total-courses': totalCourses,
            'active-courses': `${activeCourses} activos`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#6366f1"};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = "slideOutRight 0.3s ease-out forwards";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicializar
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DiplomaApp();
});

window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768 && sidebar) {
        sidebar.classList.remove('active');
    }
});

// Animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);