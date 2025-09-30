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
        price: 299,
        lessons: 24,
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
        price: 349,
        lessons: 28,
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
        price: 399,
        lessons: 32,
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
        price: 249,
        lessons: 18,
    },
];

class CoursesApp {
    constructor() {
        this.courses = courses;
        this.filteredCourses = [...courses];
        this.objectives = [];
        this.skills = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSidebar();
        this.setupTabs();
        this.setupModal();
        this.renderCourses();
        this.updateStats();
    }

    setupEventListeners() {
        // Filtros
        const searchInput = document.getElementById("search");
        const statusFilter = document.getElementById("status-filter");
        const categoryFilter = document.getElementById("category-filter");
        const clearBtn = document.getElementById("clear-filters");

        if (searchInput) searchInput.addEventListener("input", () => this.applyFilters());
        if (statusFilter) statusFilter.addEventListener("change", () => this.applyFilters());
        if (categoryFilter) categoryFilter.addEventListener("change", () => this.applyFilters());
        if (clearBtn) clearBtn.addEventListener("click", () => this.clearFilters());

        // Botón crear curso
        const createBtn = document.getElementById("createCourseBtn");
        if (createBtn) createBtn.addEventListener("click", () => this.openModal());
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

    setupTabs() {
        const tabButtons = document.querySelectorAll(".tab-btn");
        const tabContents = document.querySelectorAll(".tab-content");

        tabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                tabButtons.forEach(b => b.classList.remove("active"));
                tabContents.forEach(c => c.classList.remove("active"));
                btn.classList.add("active");
                document.getElementById(btn.dataset.tab).classList.add("active");
            });
        });
    }

    setupModal() {
        const modal = document.getElementById("modalOverlay");
        const closeBtn = document.getElementById("closeModal");
        const cancelBtn = document.getElementById("cancelBtn");
        const saveBtn = document.getElementById("saveBtn");

        // Modal tabs
        const modalTabs = document.querySelectorAll(".modal-tab");
        const tabPanels = document.querySelectorAll(".tab-panel");

        modalTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                modalTabs.forEach(t => t.classList.remove("active"));
                tabPanels.forEach(p => p.classList.remove("active"));
                tab.classList.add("active");
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
            });
        });

        // Close modal
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener("click", () => this.closeModal());
            }
        });

        // Save course
        if (saveBtn) {
            saveBtn.addEventListener("click", () => this.saveCourse());
        }

        // Objetivos
        const addObjectiveBtn = document.getElementById("addObjective");
        const objectiveInput = document.getElementById("newObjective");

        if (addObjectiveBtn && objectiveInput) {
            addObjectiveBtn.addEventListener("click", () => this.addObjective());
            objectiveInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.addObjective();
            });
        }

        // Close modal on overlay click
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    openModal() {
        const modal = document.getElementById("modalOverlay");
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    closeModal() {
        const modal = document.getElementById("modalOverlay");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "auto";
            this.resetForm();
        }
    }

    resetForm() {
        // Reset form fields
        const form = document.querySelector(".modal-body");
        const inputs = form.querySelectorAll("input, select, textarea");
        inputs.forEach(input => {
            if (input.type === "checkbox" || input.type === "radio") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });

        // Reset objectives and skills
        this.objectives = [];
        this.skills = [];
        this.renderObjectives();

        // Reset to first tab
        const modalTabs = document.querySelectorAll(".modal-tab");
        const tabPanels = document.querySelectorAll(".tab-panel");
        modalTabs.forEach(t => t.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));
        modalTabs[0]?.classList.add("active");
        tabPanels[0]?.classList.add("active");
    }

    addObjective() {
        const input = document.getElementById("newObjective");
        const value = input.value.trim();
        
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

    saveCourse() {
        const title = document.getElementById("courseTitle")?.value;
        const category = document.getElementById("courseCategory")?.value;
        const description = document.getElementById("courseDescription")?.value;
        const level = document.getElementById("courseLevel")?.value;
        const duration = document.getElementById("courseDuration")?.value;
        const lessons = document.getElementById("courseLessons")?.value;
        const price = document.getElementById("coursePrice")?.value;
        const status = document.getElementById("courseStatus")?.value;

        // Validation
        if (!title || !category || !description) {
            alert("Por favor completa los campos obligatorios");
            return;
        }

        // Create new course
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
        };

        this.courses.push(newCourse);
        this.filteredCourses = [...this.courses];
        this.renderCourses();
        this.updateStats();
        this.closeModal();

        // Show success message
        this.showNotification("Curso creado exitosamente", "success");
    }

    showNotification(message, type = "info") {
        // Simple notification - you can enhance this
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#10b981" : "#6366f1"};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
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
        document.getElementById("search").value = "";
        document.getElementById("status-filter").value = "all";
        document.getElementById("category-filter").value = "all";
        this.filteredCourses = [...this.courses];
        this.renderCourses();
    }

    getLevelColor(level) {
        const colors = {
            "Principiante": "green",
            "Intermedio": "blue",
            "Avanzado": "red"
        };
        return colors[level] || "gray";
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(price);
    }

    renderCourses() {
        const container = document.getElementById("courses-list");
        if (!container) return;

        if (this.filteredCourses.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <h3 style="color: #64748b; margin-bottom: 0.5rem;">No se encontraron cursos</h3>
                    <p style="color: #94a3b8;">Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredCourses.map(course => `
            <div class="course-card">
                <img src="${course.thumbnail}" alt="${course.title}">
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <div class="course-badges">
                        <span class="badge ${this.getLevelColor(course.level)}">${course.level}</span>
                        <span class="badge gray">${course.category}</span>
                    </div>
                    <p>${course.description}</p>
                    <div class="course-stats">
                        <div class="course-meta">
                            <div><strong>${course.students}</strong> estudiantes</div>
                            <div>${course.duration}h · ${course.lessons} lecciones</div>
                            <div>⭐ ${course.rating > 0 ? course.rating : "Sin calificar"}</div>
                        </div>
                        <div class="price">${this.formatPrice(course.price)}</div>
                    </div>
                </div>
            </div>
        `).join("");
    }

    updateStats() {
     const totalStudents = this.courses.reduce((sum, c) => sum + c.students, 0);
        const totalReviews = this.courses.reduce((sum, c) => sum + c.reviews, 0);
        const avgRating = totalReviews > 0 
            ? (this.courses.reduce((sum, c) => sum + (c.rating * c.reviews), 0) / totalReviews).toFixed(1)
            : 0;
        const totalIncome = totalStudents * 150; // Estimación promedio

        // Update DOM
        const elements = {
            'total-courses': totalCourses,
            'active-courses': `${activeCourses} activos`,
            'total-students': totalStudents,
            'avg-rating': avgRating,
            'total-income': this.formatPrice(totalIncome)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CoursesApp();
});

// Handle window resize
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoursesApp;
}