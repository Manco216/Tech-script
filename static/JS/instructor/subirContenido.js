console.log("%c✅ subirContenido.js cargado", "color: white; background: #16a34a; padding:4px;");

const mockContent = [
    { id: "1", title: "Introducción a React Hooks", type: "video", course: "Desarrollo Web con React", lesson: "Lección 1", size: "245 MB", uploadDate: "2024-01-14", status: "published", views: 156, duration: "15:30", description: "Video introductorio sobre React Hooks y su implementación" },
    { id: "2", title: "Ejercicios de useState", type: "document", course: "Desarrollo Web con React", lesson: "Lección 1", size: "2.5 MB", uploadDate: "2024-01-14", status: "published", views: 89, description: "Documento PDF con ejercicios prácticos de useState" },
    { id: "3", title: "Diagrama de Componentes", type: "image", course: "Desarrollo Web con React", lesson: "Lección 2", size: "1.2 MB", uploadDate: "2024-01-13", status: "published", views: 67, description: "Diagrama explicativo de la arquitectura de componentes" },
    { id: "4", title: "Quiz: Fundamentos de Python", type: "quiz", course: "Python para Data Science", lesson: "Lección 3", size: "0.5 MB", uploadDate: "2024-01-12", status: "draft", views: 0, description: "Evaluación de conocimientos básicos de Python" },
    { id: "5", title: "Proyecto Final: API REST", type: "assignment", course: "Microservicios con Spring Boot", lesson: "Proyecto Final", size: "5.8 MB", uploadDate: "2024-01-10", status: "processing", views: 23, description: "Especificaciones del proyecto final del curso" }
];

// Variable global para el tipo seleccionado
let selectedType = '';

document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 Inicializando UI de subirContenido...");

    const modalOverlay = document.getElementById("modalOverlay");
    const createNewBtn = document.getElementById("createNewBtn");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancel-btn");

    // Abrir modal
    createNewBtn.addEventListener("click", () => {
        modalOverlay.style.display = "flex";
    });

    // Cerrar modal con el botón de cerrar
    closeModal.addEventListener("click", () => {
        modalOverlay.style.display = "none";
    });

    // Cerrar modal con el botón cancelar
    cancelBtn.addEventListener("click", () => {
        modalOverlay.style.display = "none";
    });

    // Cerrar modal al hacer click fuera del contenido
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = "none";
        }
    });

    // ---- Tabs dentro del modal ----
    const tabBtns = document.querySelectorAll(".modal-tab");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");

            // quitar "active" a todos
            tabBtns.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active"));

            // activar el clickeado
            btn.classList.add("active");
            document.getElementById(`tab-${target}`).classList.add("active");
        });
    });

    // ----------------------
    // Validación del formulario
    // ----------------------
    function validateForm() {
        const requiredFields = [
            { id: 'title', name: 'Título del Contenido' },
            { id: 'course', name: 'Diplomado' },
            { id: 'lesson', name: 'Lección' }
        ];
        
        const errors = [];
        
        // Validar tipo de contenido seleccionado
        if (!selectedType) {
            errors.push('Debe seleccionar un tipo de contenido');
        }
        
        // Validar campos obligatorios
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                errors.push(`${field.name} es obligatorio`);
            }
        });
        
        // Validar archivo (excepto para quiz)
        if (selectedType && selectedType !== 'quiz') {
            const fileInput = document.getElementById('file-input');
            if (!fileInput || !fileInput.files.length) {
                errors.push('Debe subir un archivo');
            }
        }
        
        return errors;
    }

    function showValidationErrors(errors) {
        // Remover errores previos
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        errors.forEach(error => {
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                margin: 0.5rem 0;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                animation: slideInError 0.3s ease-out;
            `;
            errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error}`;
            
            // Insertar al inicio del modal body
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(errorEl, modalBody.firstChild);
            }
        });
        
        // Scroll al primer error
        const firstError = document.querySelector('.error-message');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Función para manejar guardado
    function handleSave(action) {
        // Validar formulario
        const errors = validateForm();
        
        if (errors.length > 0) {
            showValidationErrors(errors);
            return;
        }
        
        // Remover mensajes de error si la validación pasa
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Aquí continuaría tu lógica de guardado
        const actionText = action === 'draft' ? 'borrador guardado' : 'contenido publicado';
        showSuccessMessage(`✅ ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} exitosamente`);
        
        // Cerrar modal después de un delay
        setTimeout(() => {
            modalOverlay.style.display = "none";
        }, 1500);
    }

    // Inicializar botones de guardado
    function initializeButtons() {
        const saveDraftBtn = document.getElementById('save-draft-btn');
        const createPublishBtn = document.getElementById('create-publish-btn');
        
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => handleSave('draft'));
        }
        
        if (createPublishBtn) {
            createPublishBtn.addEventListener('click', () => handleSave('publish'));
        }
    }

    // Función para mostrar mensajes de éxito


    // Llamar a initializeButtons cuando se cargue el DOM
    initializeButtons();

    // ----------------------
    // Elementos
    // ----------------------
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const fileList = document.getElementById("fileList");
    const contentListContainer = document.getElementById("contentList");
    const tabTriggers = document.querySelectorAll(".tab-trigger");

    // ----------------------
    // Tabs principales
    // ----------------------
    tabTriggers.forEach(trigger => {
        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab(trigger.dataset.tab);
        });
    });

    function switchTab(tabName) {
        document.querySelectorAll(".tab-trigger").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");

        const triggerEl = document.querySelector(`[data-tab="${tabName}"]`);
        if (triggerEl) triggerEl.classList.add("active");

        let contentId = tabName === "upload" ? "upload-content" :
                        tabName === "content" ? "content-tab" : "analytics-tab";

        const contentEl = document.getElementById(contentId);
        if (contentEl) contentEl.style.display = "block";

        if (tabName === "content") populateContentList();
    }

    // ----------------------
    // Drag & Drop
    // ----------------------
    if (dropZone && fileInput) {
        dropZone.addEventListener("click", () => fileInput.click());
        dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
        dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
        dropZone.addEventListener("drop", (e) => { e.preventDefault(); dropZone.classList.remove("dragover"); handleFiles(e.dataTransfer.files); });
        fileInput.addEventListener("change", () => handleFiles(fileInput.files));
    }

    function handleFiles(files) {
        fileList.innerHTML = "";
        Array.from(files).forEach(file => {
            const el = document.createElement("div");
            el.className = "file-item";
            el.innerHTML = `<i data-lucide="file"></i> ${file.name} (${formatFileSize(file.size)})`;
            fileList.appendChild(el);
        });
    }

    // ----------------------
    // Contenido
    // ----------------------
    function populateContentList() {
        contentListContainer.innerHTML = "";
        mockContent.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "content-item";
            itemEl.innerHTML = `
                <div><strong>${item.title}</strong> (${item.course})</div>
                <div>
                    <button onclick="viewContent('${item.id}')">👁️</button>
                    <button onclick="editContent('${item.id}')">✏️</button>
                    <button onclick="downloadContent('${item.id}')">⬇️</button>
                    <button onclick="deleteContent('${item.id}')">🗑️</button>
                </div>
            `;
            contentListContainer.appendChild(itemEl);
        });
    }

    // ----------------------
    // Cargar modal dinámico
    // ----------------------
    const modalWrapper = document.getElementById("modal-wrapper");
    const createBtn = document.getElementById("createNewBtn");

    if (modalWrapper && createBtn) {
        fetch("modalContenido.html")
            .then(res => res.text())
            .then(html => {
                modalWrapper.innerHTML = html;

                const modal = document.getElementById("modal-overlay");
                const closeBtn = document.getElementById("close-modal");
                const cancelBtn = document.getElementById("cancel-btn");

                // Abrir modal
                createBtn.addEventListener("click", () => {
                    modal.style.display = "flex";
                    document.body.style.overflow = "hidden";
                });

                // Cerrar modal
                [closeBtn, cancelBtn].forEach(btn => {
                    if (btn) {
                        btn.addEventListener("click", () => {
                            modal.style.display = "none";
                            document.body.style.overflow = "auto";
                        });
                    }
                });

                // 👇 Cargar el JS del modal dinámicamente después de insertar el HTML
                const script = document.createElement("script");
                script.src = "../../static/JS/instructor/modalContenido.js";
                document.body.appendChild(script);
            })
            .catch(err => console.error("Error cargando modal:", err));
    }

    // ----------------------
    // Inicializa tab upload
    // ----------------------
    switchTab("upload");
});

// ----------------------
// Funciones globales
// ----------------------
function viewContent(id) {
    const c = mockContent.find(x => x.id === id);
    alert(`Ver: ${c.title}`);
}
function editContent(id) { alert(`Editar: ${id}`); }
function downloadContent(id) { alert(`Descargar: ${id}`); }
function deleteContent(id) {
    if (confirm("¿Seguro de eliminar?")) {
        const idx = mockContent.findIndex(x => x.id === id);
        mockContent.splice(idx, 1);
        document.getElementById("contentList").innerHTML = "";
    }
}
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

(() => {
    let tags = [];
    let isUploading = false;
    let dragActive = false;

    // ---------------------- Inicialización ----------------------
    document.addEventListener('DOMContentLoaded', () => {
        initializeModal();
        initializeTabs();
        initializeContentTypes();
        initializeTags();
        initializeUpload();
        initializeSwitches();
        initializeButtons();
    });

    // ---------------------- Modal ----------------------
    function initializeModal() {
        const modal = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const openBtn = document.getElementById('createNewBtn');

        if (!modal) return;

        // Abrir modal con animación
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
                modal.classList.add("fadeInScale");
                document.body.style.overflow = 'hidden';
                initializeTabs();
            });
        }

        // Cerrar modal
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) btn.addEventListener('click', closeModal);
        });

        // Click fuera
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });
    }

    function closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.classList.remove("fadeInScale");
            modal.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
    }

    // ---------------------- Tabs ----------------------
    function initializeTabs() {
        const tabs = document.querySelectorAll(".tab-btn");
        const contents = document.querySelectorAll(".tab-content");

        if (tabs.length === 0 || contents.length === 0) {
            console.warn("⚠️ No tabs found in modal");
            return;
        }

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const target = tab.getAttribute("data-tab");

                // Quitar activo de todos
                tabs.forEach(t => t.classList.remove("active"));
                contents.forEach(c => c.style.display = "none");

                // Activar el tab clicado
                tab.classList.add("active");

                // Mostrar el contenido correspondiente
                const activeContent = document.getElementById(target);
                if (activeContent) {
                    activeContent.style.display = "block";
                }
            });
        });

        // Inicializa el primer tab visible
        tabs[0].classList.add("active");
        contents.forEach(c => c.style.display = "none");
        const firstContent = document.getElementById(tabs[0].getAttribute("data-tab"));
        if (firstContent) {
            firstContent.style.display = "block";
        }
    }

    function switchToTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
            if (content.id === `tab-${tabName}`) content.classList.add("slideIn");
        });
    }

    // ---------------------- Selección de tipo de contenido ----------------------
    function initializeContentTypes() {
        const typeCards = document.querySelectorAll('.content-type-card');
        const selectedTypeInfo = document.getElementById('selected-type-info');
        const selectedTypeName = document.getElementById('selected-type-name');
        
        if (!typeCards.length) return;

        typeCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remover selección previa
                typeCards.forEach(c => c.classList.remove('selected'));
                
                // Seleccionar la tarjeta actual
                card.classList.add('selected');
                
                // Obtener el tipo seleccionado
                selectedType = card.getAttribute('data-type');
                
                // Actualizar información
                if (selectedTypeName) {
                    const typeNames = {
                        'video': 'Video',
                        'document': 'Documento', 
                        'image': 'Imagen',
                        'quiz': 'Evaluación'
                    };
                    selectedTypeName.textContent = typeNames[selectedType] || selectedType;
                }
                
                // Mostrar información de selección
                if (selectedTypeInfo) {
                    selectedTypeInfo.classList.add('show');
                }
                
                // Configurar zona de upload según el tipo
                updateUploadZone();
                
                // Mostrar/ocultar configuración de quiz
                const quizConfig = document.getElementById('quiz-config');
                if (quizConfig) {
                    if (selectedType === 'quiz') {
                        quizConfig.classList.add('show');
                    } else {
                        quizConfig.classList.remove('show');
                    }
                }
            });
        });
    }

    function updateUploadZone() {
        const uploadInfo = document.getElementById('upload-info');
        const fileInput = document.getElementById('file-input');
        
        if (!uploadInfo || !fileInput) return;
        
        const typeConfig = {
            'video': {
                accept: '.mp4,.avi,.mov',
                info: 'Archivos de video: MP4, AVI, MOV (máx. 500MB)'
            },
            'document': {
                accept: '.pdf,.docx,.pptx',
                info: 'Documentos: PDF, DOCX, PPTX (máx. 50MB)'
            },
            'image': {
                accept: '.png,.jpg,.jpeg,.svg',
                info: 'Imágenes: PNG, JPG, SVG (máx. 10MB)'
            },
            'quiz': {
                accept: '',
                info: 'Las evaluaciones se crean con el editor integrado'
            }
        };
        
        if (selectedType && typeConfig[selectedType]) {
            uploadInfo.textContent = typeConfig[selectedType].info;
            fileInput.accept = typeConfig[selectedType].accept;
        }
    }

    // ---------------------- Funciones placeholder ----------------------
    function initializeTags() {
        console.log("🏷️ Tags initialized");
    }
    
    function initializeUpload() {
        console.log("📤 Upload initialized");
    }
    
    function initializeSwitches() {
        console.log("🔄 Switches initialized");
    }
    
    function initializeButtons() {
        console.log("🔘 Buttons initialized");
    }

    // ---------------------- Estilos animaciones ----------------------
    const style = document.createElement("style");
    style.innerHTML = `
        /* Mejoras para inputs */
        .form-input,
        .form-select,
        input[type="text"],
        input[type="number"],
        input[type="datetime-local"],
        select,
        textarea {
            padding: 0.875rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            background: #fff;
            color: #1e293b;
            font-family: inherit;
        }

        .form-input:hover,
        .form-select:hover,
        input[type="text"]:hover,
        input[type="number"]:hover,
        input[type="datetime-local"]:hover,
        select:hover,
        textarea:hover {
            border-color: #a855f7;
            box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.1);
            transform: translateY(-1px);
        }

        .form-input:focus,
        .form-select:focus,
        input[type="text"]:focus,
        input[type="number"]:focus,
        input[type="datetime-local"]:focus,
        select:focus,
        textarea:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
            transform: translateY(-1px);
        }

        ::placeholder {
            color: #94a3b8;
            opacity: 1;
        }

        .tags-input-container:focus-within {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }

        /* Selección de tipo de contenido */
        .content-type-card.selected {
            border-color: #6366f1;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.2);
            transform: translateY(-4px);
        }

        .content-type-card.selected::before {
            content: '';
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .content-type-card.selected::after {
            content: '✓';
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
        }

        /* Animaciones */
        .fadeInScale {
            animation: fadeInScale 0.4s ease forwards;
        }
        
        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.7); }
            to { opacity: 1; transform: scale(1); }
        }

        .slideIn {
            animation: slideIn 0.4s ease;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInError {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes neonFade {
            0% { opacity: 0; }
            20% { opacity: 1; text-shadow: 0 0 10px #ff00cc, 0 0 20px #3333ff; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

})();