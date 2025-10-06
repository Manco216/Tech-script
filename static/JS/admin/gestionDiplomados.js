const courses = [
    {
        id: "1",
        title: "Desarrollo Web con React",
        description: "Aprende a crear aplicaciones web modernas con React, hooks y estado global.",
        category: "Frontend",
        level: "Intermedio",
        duration: 40,
        students: 156,
        rating: 4.8,
        reviews: 89,
        status: "active",
        progress: 100,
        thumbnail: "https://via.placeholder.com/300x200",
        price: 150000,
        lessons: 24,
        contentCount: 18
    },
    {
        id: "2",
        title: "Python para Data Science",
        description: "Domina Python y sus librerías para análisis de datos y machine learning.",
        category: "Data Science",
        level: "Principiante",
        duration: 35,
        students: 203,
        rating: 4.9,
        reviews: 127,
        status: "active",
        progress: 100,
        thumbnail: "https://via.placeholder.com/300x200",
        price: 180000,
        lessons: 28,
        contentCount: 25
    },
    {
        id: "3",
        title: "Microservicios con Spring Boot",
        description: "Arquitectura de microservicios usando Spring Boot y tecnologías cloud.",
        category: "Backend",
        level: "Avanzado",
        duration: 50,
        students: 78,
        rating: 4.7,
        reviews: 45,
        status: "active",
        progress: 85,
        thumbnail: "https://via.placeholder.com/300x200",
        price: 220000,
        lessons: 32,
        contentCount: 31
    },
    {
        id: "4",
        title: "Introducción a DevOps",
        description: "Conceptos fundamentales de DevOps, CI/CD y automatización.",
        category: "DevOps",
        level: "Principiante",
        duration: 25,
        students: 0,
        rating: 0,
        reviews: 0,
        status: "draft",
        progress: 60,
        thumbnail: "https://via.placeholder.com/300x200",
        price: 120000,
        lessons: 18,
        contentCount: 5
    }
];

const mockContent = [
    { 
        id: "1", 
        courseId: "1",
        title: "Introducción a React Hooks", 
        type: "video", 
        lesson: "Lección 1", 
        size: "245 MB", 
        uploadDate: "2024-01-14", 
        status: "published", 
        views: 156, 
        duration: "15:30", 
        description: "Video introductorio sobre React Hooks y su implementación" 
    },
    { 
        id: "2", 
        courseId: "1",
        title: "Ejercicios de useState", 
        type: "document", 
        lesson: "Lección 1", 
        size: "2.5 MB", 
        uploadDate: "2024-01-14", 
        status: "published", 
        views: 89, 
        description: "Documento PDF con ejercicios prácticos de useState" 
    },
    { 
        id: "3", 
        courseId: "1",
        title: "Quiz: Fundamentos de React", 
        type: "quiz", 
        lesson: "Lección 2", 
        size: "0.5 MB", 
        uploadDate: "2024-01-12", 
        status: "published", 
        views: 134, 
        description: "Evaluación de conocimientos básicos de React" 
    },
    { 
        id: "4", 
        courseId: "2",
        title: "Introducción a NumPy", 
        type: "video", 
        lesson: "Lección 1", 
        size: "180 MB", 
        uploadDate: "2024-01-13", 
        status: "published", 
        views: 203, 
        duration: "12:45", 
        description: "Video sobre las bases de NumPy para análisis de datos" 
    },
    { 
        id: "5", 
        courseId: "2",
        title: "Ejercicios de Pandas", 
        type: "document", 
        lesson: "Lección 3", 
        size: "3.2 MB", 
        uploadDate: "2024-01-10", 
        status: "draft", 
        views: 0, 
        description: "Ejercicios prácticos con la librería Pandas" 
    }
];

const notificacionesDiplomados = [
    {
        id: 1,
        diplomadoId: 'new_1',
        titulo: "Desarrollo Mobile con React Native",
        instructor: "Patricia Jiménez",
        categoria: "Desarrollo Mobile",
        fechaEnvio: "2024-03-25T10:30:00",
        descripcion: "Curso completo de desarrollo de aplicaciones móviles multiplataforma",
        duracion: 45,
        lecciones: 32,
        estado: "pendiente"
    },
    {
        id: 2,
        diplomadoId: 'new_2',
        titulo: "Blockchain y Criptomonedas",
        instructor: "Eduardo Ruiz",
        categoria: "Blockchain",
        fechaEnvio: "2024-03-24T15:20:00",
        descripcion: "Introducción completa al mundo de blockchain y desarrollo de smart contracts",
        duracion: 38,
        lecciones: 28,
        estado: "pendiente"
    },
    {
        id: 3,
        diplomadoId: 'new_3',
        titulo: "Data Science con R",
        instructor: "María Gonzalez",
        categoria: "Data Science",
        fechaEnvio: "2024-03-23T09:15:00",
        descripcion: "Análisis de datos y machine learning usando el lenguaje R",
        duracion: 52,
        lecciones: 35,
        estado: "pendiente"
    }
];

class NotificacionesManager {
    constructor() {
        this.notificaciones = [...notificacionesDiplomados];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNotificationBadge();
        this.renderNotifications();
        this.renderApprovals();
    }

    setupEventListeners() {
        const notificationIcon = document.querySelector('.notification-icon');
        const notificationsPanel = document.getElementById('notificationsPanel');
        const notificationsOverlay = document.getElementById('notificationsOverlay');
        const closeNotifications = document.getElementById('closeNotifications');

        if (notificationIcon) {
            notificationIcon.addEventListener('click', () => {
                this.openNotificationsPanel();
            });
        }

        if (closeNotifications) {
            closeNotifications.addEventListener('click', () => {
                this.closeNotificationsPanel();
            });
        }

        if (notificationsOverlay) {
            notificationsOverlay.addEventListener('click', () => {
                this.closeNotificationsPanel();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && notificationsPanel && notificationsPanel.classList.contains('active')) {
                this.closeNotificationsPanel();
            }
        });
    }

    openNotificationsPanel() {
        const panel = document.getElementById('notificationsPanel');
        const overlay = document.getElementById('notificationsOverlay');
        
        if (panel && overlay) {
            panel.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeNotificationsPanel() {
        const panel = document.getElementById('notificationsPanel');
        const overlay = document.getElementById('notificationsOverlay');
        
        if (panel && overlay) {
            panel.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        const pendientes = this.notificaciones.filter(n => n.estado === 'pendiente').length;
        
        if (badge) {
            badge.textContent = pendientes;
            badge.style.display = pendientes > 0 ? 'flex' : 'none';
            
            if (pendientes > 0) {
                badge.classList.add('pulse');
            } else {
                badge.classList.remove('pulse');
            }
        }
    }

    renderApprovals() {
        const container = document.getElementById('approvals-list');
        if (!container) return;

        const pendientes = this.notificaciones.filter(n => n.estado === 'pendiente');

        if (pendientes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #10b981;"></i>
                    <h4 style="margin-bottom: 0.5rem;">Todo al día</h4>
                    <p>No hay solicitudes pendientes de aprobación</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendientes.map(notif => `
            <div class="approval-card" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.125rem;">${notif.titulo}</h4>
                        <p style="color: #64748b; margin: 0 0 0.75rem 0; font-size: 0.875rem;">${notif.descripcion}</p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem; color: #64748b;">
                            <span><i class="fas fa-user" style="color: #6366f1;"></i> ${notif.instructor}</span>
                            <span><i class="fas fa-tag" style="color: #6366f1;"></i> ${notif.categoria}</span>
                            <span><i class="fas fa-clock" style="color: #6366f1;"></i> ${notif.duracion}h</span>
                            <span><i class="fas fa-book" style="color: #6366f1;"></i> ${notif.lecciones} lecciones</span>
                        </div>
                    </div>
                    <span style="background: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
                        ${this.formatTime(notif.fechaEnvio)}
                    </span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="notificacionesManager.aprobarDiplomado(${notif.id})" style="flex: 1;">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn btn-secondary" onclick="notificacionesManager.verDetalles(${notif.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-danger" onclick="notificacionesManager.rechazarDiplomado(${notif.id})">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderNotifications() {
        const container = document.getElementById('notificationsContent');
        if (!container) return;

        const pendientes = this.notificaciones.filter(n => n.estado === 'pendiente');

        if (pendientes.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h4>No hay solicitudes pendientes</h4>
                    <p>Todas las solicitudes han sido procesadas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendientes.map(notif => `
            <div class="notification-item pending">
                <div class="notification-header">
                    <div class="notification-title">${notif.titulo}</div>
                    <div class="notification-time">${this.formatTime(notif.fechaEnvio)}</div>
                </div>
                
                <div class="notification-details">
                    <div class="notification-detail">
                        <span class="label">Instructor:</span>
                        <span class="value">${notif.instructor}</span>
                    </div>
                    <div class="notification-detail">
                        <span class="label">Categoría:</span>
                        <span class="value">${notif.categoria}</span>
                    </div>
                    <div class="notification-detail">
                        <span class="label">Duración:</span>
                        <span class="value">${notif.duracion} horas</span>
                    </div>
                    <div class="notification-detail">
                        <span class="label">Lecciones:</span>
                        <span class="value">${notif.lecciones}</span>
                    </div>
                </div>

                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.4;">
                    ${notif.descripcion}
                </p>

                <div class="notification-actions">
                    <button class="notification-btn view" onclick="notificacionesManager.verDetalles(${notif.id})">
                        <i class="fas fa-eye"></i>
                        Ver
                    </button>
                    <button class="notification-btn approve" onclick="notificacionesManager.aprobarDiplomado(${notif.id})">
                        <i class="fas fa-check"></i>
                        Aprobar
                    </button>
                    <button class="notification-btn reject" onclick="notificacionesManager.rechazarDiplomado(${notif.id})">
                        <i class="fas fa-times"></i>
                        Rechazar
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) {
            return 'Hace menos de 1h';
        } else if (diffHours < 24) {
            return `Hace ${diffHours}h`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else {
            return `Hace ${diffDays} días`;
        }
    }

    verDetalles(notificationId) {
        const notif = this.notificaciones.find(n => n.id === notificationId);
        if (notif) {
            this.showNotification(`Viendo detalles de: ${notif.titulo}`, 'info');
        }
    }

    aprobarDiplomado(notificationId) {
        if (confirm('¿Estás seguro de que quieres aprobar este diplomado?')) {
            const notif = this.notificaciones.find(n => n.id === notificationId);
            if (notif) {
                notif.estado = 'aprobado';
                
                if (window.app) {
                    const nuevoDiplomado = {
                        id: notif.diplomadoId,
                        title: notif.titulo,
                        description: notif.descripcion,
                        category: notif.categoria,
                        level: "Intermedio",
                        duration: notif.duracion,
                        students: 0,
                        rating: 0,
                        reviews: 0,
                        status: "active",
                        progress: 100,
                        thumbnail: "https://via.placeholder.com/300x200",
                        price: 180000,
                        lessons: notif.lecciones,
                        contentCount: 0
                    };
                    
                    app.courses.push(nuevoDiplomado);
                    app.filteredCourses = [...app.courses];
                    app.renderCourses();
                    app.updateStats();
                }
                
                this.updateNotificationBadge();
                this.renderNotifications();
                this.renderApprovals();
                this.showNotification(`Diplomado "${notif.titulo}" aprobado exitosamente`, 'success');
            }
        }
    }

    rechazarDiplomado(notificationId) {
        if (confirm('¿Estás seguro de que quieres rechazar este diplomado?')) {
            const notif = this.notificaciones.find(n => n.id === notificationId);
            if (notif) {
                notif.estado = 'rechazado';
                
                this.updateNotificationBadge();
                this.renderNotifications();
                this.renderApprovals();
                this.showNotification(`Diplomado "${notif.titulo}" rechazado`, 'warning');
            }
        }
    }

    showNotification(message, type = "info") {
        if (window.app && typeof app.showNotification === 'function') {
            app.showNotification(message, type);
        } else {
            const notification = document.createElement("div");
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#6366f1"};
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
                font-family: "Montserrat", sans-serif;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = "slideOutRight 0.3s ease-out forwards";
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        }
    }

    agregarNotificacion(nuevaNotificacion) {
        this.notificaciones.unshift({
            ...nuevaNotificacion,
            id: Date.now(),
            estado: 'pendiente',
            fechaEnvio: new Date().toISOString()
        });
        
        this.updateNotificationBadge();
        this.renderNotifications();
        this.renderApprovals();
    }
}

class DiplomaApp {
    constructor() {
        this.courses = courses;
        this.filteredCourses = [...courses];
        this.currentView = 'diplomados';
        this.selectedCourse = null;
        this.filteredContent = [];
        this.objectives = [];
        this.currentEditingCourse = null;
        this.currentEditingContent = null;
        this.currentCourseForContent = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSidebar();
        this.setupModals();
        this.renderCourses();
        this.updateStats();
        this.showView('diplomados');
    }

    setupEventListeners() {
        const searchInput = document.getElementById("search");
        const statusFilter = document.getElementById("status-filter");
        const categoryFilter = document.getElementById("category-filter");
        const clearBtn = document.getElementById("clear-filters");

        if (searchInput) searchInput.addEventListener("input", () => this.applyFilters());
        if (statusFilter) statusFilter.addEventListener("change", () => this.applyFilters());
        if (categoryFilter) categoryFilter.addEventListener("change", () => this.applyFilters());
        if (clearBtn) clearBtn.addEventListener("click", () => this.clearFilters());

        const backBtn = document.getElementById("backToDiplomados");
        const breadcrumbHome = document.getElementById("breadcrumb-home");
        
        if (backBtn) backBtn.addEventListener("click", () => this.showView('diplomados'));
        if (breadcrumbHome) breadcrumbHome.addEventListener("click", () => this.showView('diplomados'));

        const createCourseBtn = document.getElementById("createCourseBtn");
        const addContentBtn = document.getElementById("addContentBtn");
        
        if (createCourseBtn) createCourseBtn.addEventListener("click", () => this.openCourseModal());
        if (addContentBtn) addContentBtn.addEventListener("click", () => this.navigateToUploadContent());

        const contentTypeFilter = document.getElementById("content-type-filter");
        const contentStatusFilter = document.getElementById("content-status-filter");
        const contentSearch = document.getElementById("content-search");

        if (contentTypeFilter) contentTypeFilter.addEventListener("change", () => this.applyContentFilters());
        if (contentStatusFilter) contentStatusFilter.addEventListener("change", () => this.applyContentFilters());
        if (contentSearch) contentSearch.addEventListener("input", () => this.applyContentFilters());

        const contentTabs = document.querySelectorAll('.tab-btn[data-tab]');
        contentTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchContentTab(tab.dataset.tab));
        });
    }

    navigateToUploadContent() {
        if (this.selectedCourse) {
            localStorage.setItem('selectedCourseId', this.selectedCourse.id);
            localStorage.setItem('selectedCourseTitle', this.selectedCourse.title);
            localStorage.setItem('fromDiplomadosPage', 'true');
            window.location.href = 'subirContenido.html';
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
                if (sidebar && !sidebar.contains(e.target) && toggleMobileBtn && !toggleMobileBtn.contains(e.target)) {
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

        const contentModal = document.getElementById("contentModalOverlay");
        const closeContentBtn = document.getElementById("closeContentModal");
        const cancelContentBtn = document.getElementById("cancel-content-btn");
        const saveContentBtn = document.getElementById("save-content-btn");

        [closeContentBtn, cancelContentBtn].forEach(btn => {
            if (btn) btn.addEventListener("click", () => this.closeContentModal());
        });

        if (saveContentBtn) saveContentBtn.addEventListener("click", () => this.saveContent());

        this.setupModalTabs();

        const addObjectiveBtn = document.getElementById("addObjective");
        const objectiveInput = document.getElementById("newObjective");

        if (addObjectiveBtn && objectiveInput) {
            addObjectiveBtn.addEventListener("click", () => this.addObjective());
            objectiveInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.addObjective();
            });
        }

        [modal, contentModal].forEach(m => {
            if (m) {
                m.addEventListener("click", (e) => {
                    if (e.target === m) {
                        if (m === modal) this.closeCourseModal();
                        else this.closeContentModal();
                    }
                });
            }
        });
    }

    setupModalTabs() {
        const modalTabs = document.querySelectorAll("#modalOverlay .modal-tab");
        const tabPanels = document.querySelectorAll("#modalOverlay .tab-panel");

        modalTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                modalTabs.forEach(t => t.classList.remove("active"));
                tabPanels.forEach(p => p.classList.remove("active"));
                tab.classList.add("active");
                const targetPanel = document.getElementById(`tab-${tab.dataset.tab}`);
                if (targetPanel) {
                    targetPanel.classList.add("active");
                }
            });
        });
    }

    showView(viewName) {
        const views = document.querySelectorAll('.view-container');
        views.forEach(v => v.classList.remove('active'));
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        this.updateBreadcrumbs(viewName);
    }

    updateBreadcrumbs(viewName) {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (!breadcrumbs) return;

        if (viewName === 'diplomados') {
            breadcrumbs.innerHTML = `
                <a href="#" class="breadcrumb-item active">
                    <i class="fas fa-home"></i> Mis Diplomados
                </a>
            `;
        } else if (viewName === 'content' && this.selectedCourse) {
            breadcrumbs.innerHTML = `
                <a href="#" class="breadcrumb-item" onclick="app.showView('diplomados')">
                    <i class="fas fa-home"></i> Mis Diplomados
                </a>
                <a href="#" class="breadcrumb-item active">
                    <i class="fas fa-folder"></i> ${this.selectedCourse.title}
                </a>
            `;
        }
    }

    viewCourseContent(courseId) {
        this.selectedCourse = this.courses.find(c => c.id === courseId);
        if (!this.selectedCourse) return;

        this.currentCourseForContent = this.selectedCourse;
        this.filteredContent = mockContent.filter(c => c.courseId === courseId);
        this.updateCourseHeader();
        this.renderContent();
        this.showView('content');
    }

    updateCourseHeader() {
        if (!this.selectedCourse) return;

        const titleEl = document.getElementById('course-title-header');
        const descEl = document.getElementById('course-description-header');
        const nameEl = document.getElementById('selected-course-name');
        const studentsEl = document.getElementById('selected-course-students');
        const contentEl = document.getElementById('selected-course-content');

        if (titleEl) titleEl.textContent = this.selectedCourse.title;
        if (descEl) descEl.textContent = this.selectedCourse.description;
        if (nameEl) nameEl.textContent = this.selectedCourse.title;
        if (studentsEl) studentsEl.textContent = `${this.selectedCourse.students} estudiantes`;
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

    applyFilters() {
        const searchTerm = document.getElementById("search")?.value.toLowerCase() || "";
        const statusFilter = document.getElementById("status-filter")?.value || "all";
        const categoryFilter = document.getElementById("category-filter")?.value || "all";

        this.filteredCourses = this.courses.filter(course => {
            const matchSearch = course.title.toLowerCase().includes(searchTerm) || 
                              course.description.toLowerCase().includes(searchTerm);
            const matchStatus = statusFilter === "all" || course.status === statusFilter;
            const matchCategory = categoryFilter === "all" || course.category === categoryFilter;

            return matchSearch && matchStatus && matchCategory;
        });

        this.renderCourses();
    }

    clearFilters() {
        const searchEl = document.getElementById("search");
        const statusEl = document.getElementById("status-filter");
        const categoryEl = document.getElementById("category-filter");
        
        if (searchEl) searchEl.value = "";
        if (statusEl) statusEl.value = "all";
        if (categoryEl) categoryEl.value = "all";
        
        this.filteredCourses = [...this.courses];
        this.renderCourses();
    }

    applyContentFilters() {
        if (!this.selectedCourse) return;

        const typeFilter = document.getElementById("content-type-filter")?.value || "all";
        const statusFilter = document.getElementById("content-status-filter")?.value || "all";
        const searchTerm = document.getElementById("content-search")?.value.toLowerCase() || "";

        const courseContent = mockContent.filter(c => c.courseId === this.selectedCourse.id);

        this.filteredContent = courseContent.filter(content => {
            const matchType = typeFilter === "all" || content.type === typeFilter;
            const matchStatus = statusFilter === "all" || content.status === statusFilter;
            const matchSearch = content.title.toLowerCase().includes(searchTerm) ||
                              content.description.toLowerCase().includes(searchTerm);

            return matchType && matchStatus && matchSearch;
        });

        this.renderContent();
    }

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
                <div class="course-gradient-header ${this.getCategoryClass(course.category)}">
                    <div class="course-header-content">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description}</p>
                    </div>
                    <div class="course-level-badge">${course.level}</div>
                </div>
                <div class="course-card-body">
                    <div class="course-meta">
                        <div class="course-stats">
                            <div class="course-stat">
                                <i class="fas fa-users"></i>
                                <span>${course.students} estudiantes</span>
                            </div>
                            <div class="course-stat">
                                <i class="fas fa-clock"></i>
                                <span>${course.duration} horas</span>
                            </div>
                            <div class="course-stat">
                                <i class="fas fa-star"></i>
                                <span>${course.rating > 0 ? course.rating + ' rating' : 'Sin calificar'}</span>
                            </div>
                        </div>
                        <div class="course-status">
                            <span class="course-status-badge ${course.status}">
                                ${this.getStatusLabel(course.status)}
                            </span>
                            <div class="price">${this.formatPrice(course.price)}</div>
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="course-action-btn primary" onclick="app.viewCourseContent('${course.id}')">
                            <i class="fas fa-folder-open"></i> Contenido
                        </button>
                        <button class="course-action-btn secondary" onclick="app.editCourse('${course.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="course-action-btn danger" onclick="app.deleteCourse('${course.id}')">
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
                    <span class="content-type-badge ${content.type}">${this.getTypeLabel(content.type)}</span>
                    <span class="status-badge ${content.status}">${this.getStatusLabel(content.status)}</span>
                </div>
                <h4>${content.title}</h4>
                <p>${content.description}</p>
                <div class="content-item-meta">
                    <span>${content.lesson}</span>
                    <span>${content.size}</span>
                    <span>${content.uploadDate}</span>
                </div>
                ${content.type === 'video' && content.duration ? `<div class="content-item-meta"><i class="fas fa-play"></i> ${content.duration}</div>` : ''}
                ${content.views !== undefined ? `<div class="content-item-meta"><i class="fas fa-eye"></i> ${content.views} visualizaciones</div>` : ''}
                <div class="content-item-actions">
                    <button class="content-action-btn" onclick="app.viewContent('${content.id}')" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="content-action-btn" onclick="app.editContent('${content.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="content-action-btn" onclick="app.downloadContent('${content.id}')" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="content-action-btn danger" onclick="app.deleteContent('${content.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join("");
    }

    openCourseModal(courseId = null) {
        const modal = document.getElementById("modalOverlay");
        const modalTitle = document.getElementById("modal-title");
        const saveButton = document.getElementById("save-btn-text");

        if (courseId) {
            this.currentEditingCourse = this.courses.find(c => c.id === courseId);
            if (modalTitle) modalTitle.textContent = "Editar Diplomado";
            if (saveButton) saveButton.textContent = "Actualizar Diplomado";
            this.populateCourseForm();
        } else {
            this.currentEditingCourse = null;
            if (modalTitle) modalTitle.textContent = "Crear Nuevo Diplomado";
            if (saveButton) saveButton.textContent = "Crear Diplomado";
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

    openContentModal(contentId = null) {
        const modal = document.getElementById("contentModalOverlay");
        const modalTitle = document.getElementById("content-modal-title");

        if (contentId) {
            this.currentEditingContent = mockContent.find(c => c.id === contentId);
            if (modalTitle) modalTitle.textContent = "Editar Contenido";
        } else {
            this.currentEditingContent = null;
            if (this.currentCourseForContent && modalTitle) {
                modalTitle.textContent = `Agregar Contenido - ${this.currentCourseForContent.title}`;
            } else if (modalTitle) {
                modalTitle.textContent = "Agregar Contenido";
            }
        }

        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    closeContentModal() {
        const modal = document.getElementById("contentModalOverlay");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "auto";
        }
    }

    viewContent(contentId) {
        const content = mockContent.find(c => c.id === contentId);
        if (content) {
            this.showNotification(`Visualizando: ${content.title}`, "info");
        }
    }

    editContent(contentId) {
        this.openContentModal(contentId);
    }

    downloadContent(contentId) {
        const content = mockContent.find(c => c.id === contentId);
        if (content) {
            this.showNotification(`Descargando: ${content.title}`, "info");
        }
    }

    deleteContent(contentId) {
        if (confirm("¿Estás seguro de que quieres eliminar este contenido?")) {
            const index = mockContent.findIndex(c => c.id === contentId);
            if (index !== -1) {
                mockContent.splice(index, 1);
                this.applyContentFilters();
                this.showNotification("Contenido eliminado exitosamente", "success");
            }
        }
    }

    editCourse(courseId) {
        this.openCourseModal(courseId);
    }

    deleteCourse(courseId) {
        if (confirm("¿Estás seguro de que quieres eliminar este diplomado? Esta acción no se puede deshacer.")) {
            const courseIndex = this.courses.findIndex(c => c.id === courseId);
            if (courseIndex !== -1) {
                const courseName = this.courses[courseIndex].title;
                this.courses.splice(courseIndex, 1);
                this.filteredCourses = [...this.courses];
                this.renderCourses();
                this.updateStats();
                this.showNotification(`Diplomado "${courseName}" eliminado exitosamente`, "success");
            }
        }
    }

    getCategoryClass(category) {
        return category.toLowerCase().replace(/\s+/g, '-');
    }

    populateCourseForm() {
        if (!this.currentEditingCourse) return;

        const course = this.currentEditingCourse;
        const titleEl = document.getElementById("courseTitle");
        const categoryEl = document.getElementById("courseCategory");
        const descEl = document.getElementById("courseDescription");
        const levelEl = document.getElementById("courseLevel");
        const durationEl = document.getElementById("courseDuration");
        const lessonsEl = document.getElementById("courseLessons");
        const priceEl = document.getElementById("coursePrice");
        const statusEl = document.getElementById("courseStatus");

        if (titleEl) titleEl.value = course.title || "";
        if (categoryEl) categoryEl.value = course.category || "";
        if (descEl) descEl.value = course.description || "";
        if (levelEl) levelEl.value = course.level || "Principiante";
        if (durationEl) durationEl.value = course.duration || "";
        if (lessonsEl) lessonsEl.value = course.lessons || "";
        if (priceEl) priceEl.value = course.price || "";
        if (statusEl) statusEl.value = course.status || "draft";
    }

    resetCourseForm() {
        const form = document.querySelector("#modalOverlay .modal-body");
        const inputs = form?.querySelectorAll("input, select, textarea");
        inputs?.forEach(input => {
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
        if (modalTabs[0]) modalTabs[0].classList.add("active");
        if (tabPanels[0]) tabPanels[0].classList.add("active");
    }

    saveCourse() {
        const titleEl = document.getElementById("courseTitle");
        const categoryEl = document.getElementById("courseCategory");
        const descEl = document.getElementById("courseDescription");
        const levelEl = document.getElementById("courseLevel");
        const durationEl = document.getElementById("courseDuration");
        const lessonsEl = document.getElementById("courseLessons");
        const priceEl = document.getElementById("coursePrice");
        const statusEl = document.getElementById("courseStatus");

        const title = titleEl?.value;
        const category = categoryEl?.value;
        const description = descEl?.value;
        const level = levelEl?.value;
        const duration = durationEl?.value;
        const lessons = lessonsEl?.value;
        const price = priceEl?.value;
        const status = statusEl?.value;

        if (!title || !category || !description) {
            this.showNotification("Por favor completa los campos obligatorios", "error");
            return;
        }

        if (this.currentEditingCourse) {
            const courseIndex = this.courses.findIndex(c => c.id === this.currentEditingCourse.id);
            if (courseIndex !== -1) {
                this.courses[courseIndex] = {
                    ...this.courses[courseIndex],
                    title,
                    description,
                    category,
                    level: level || "Principiante",
                    duration: parseInt(duration) || 0,
                    lessons: parseInt(lessons) || 0,
                    price: parseInt(price) || 0,
                    status: status || "draft"
                };
                this.showNotification("Diplomado actualizado exitosamente", "success");
            }
        } else {
            const newCourse = {
                id: String(this.courses.length + 1),
                title,
                description,
                category,
                level: level || "Principiante",
                duration: parseInt(duration) || 0,
                students: 0,
                rating: 0,
                reviews: 0,
                status: status || "draft",
                progress: 0,
                thumbnail: "https://via.placeholder.com/300x200",
                price: parseInt(price) || 0,
                lessons: parseInt(lessons) || 0,
                contentCount: 0
            };
            
            this.courses.push(newCourse);
            this.showNotification("Diplomado creado exitosamente", "success");
        }

        this.filteredCourses = [...this.courses];
        this.renderCourses();
        this.updateStats();
        this.closeCourseModal();
    }

    saveContent() {
        this.showNotification("Contenido guardado exitosamente", "success");
        this.closeContentModal();
        
        if (this.currentView === 'content') {
            this.applyContentFilters();
        }
    }

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

    getLevelColor(level) {
        const colors = {
            "Principiante": "green",
            "Intermedio": "blue",
            "Avanzado": "red"
        };
        return colors[level] || "gray";
    }

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
            "processing": "Procesando",
            "active": "Activo"
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
        const activeCourses = this.courses.filter(c => c.status === 'active').length;
        const totalStudents = this.courses.reduce((sum, c) => sum + c.students, 0);
        const totalContent = this.courses.reduce((sum, c) => sum + (c.contentCount || 0), 0);

        const elements = {
            'total-courses': totalCourses,
            'active-courses': `${activeCourses} activos`,
            'total-students': totalStudents,
            'total-content': totalContent
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
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#6366f1"};
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
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

let app;
let notificacionesManager;

document.addEventListener('DOMContentLoaded', function() {
    app = new DiplomaApp();
    notificacionesManager = new NotificacionesManager();
});

window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768 && sidebar) {
        sidebar.classList.remove('active');
    }
});

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiplomaApp, NotificacionesManager };
}