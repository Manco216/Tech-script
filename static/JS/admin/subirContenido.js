console.log("%c✅ subirContenido.js cargado", "color: white; background: #16a34a; padding:4px;");

// Variables globales
let selectedType = '';
let selectedFile = null;
let diplomados = [];

document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 Inicializando UI de subirContenido...");
    
    initializeModal();
    initializeTabs();
    initializeContentTypes();
    initializeUpload();
    initializeButtons();
    loadDiplomados();
    loadAllContent(); // Cargar contenido al iniciar
    initializeFilters();
});

// =================== MODAL ===================
function initializeModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    const createNewBtn = document.getElementById("createNewBtn");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancel-btn");

    if (createNewBtn) {
        createNewBtn.addEventListener("click", () => {
            modalOverlay.style.display = "flex";
            document.body.style.overflow = 'hidden';
            resetForm();
        });
    }

    [closeModal, cancelBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                modalOverlay.style.display = "none";
                document.body.style.overflow = 'auto';
            });
        }
    });

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = "none";
            document.body.style.overflow = 'auto';
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// =================== TABS ===================
function initializeTabs() {
    // Tabs principales
    const mainTabBtns = document.querySelectorAll(".tab-btn");
    const mainTabContents = document.querySelectorAll(".tab-content");

    mainTabBtns.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-tab");
            
            mainTabBtns.forEach(t => t.classList.remove("active"));
            mainTabContents.forEach(c => c.classList.remove("active"));
            
            tab.classList.add("active");
            document.getElementById(target).classList.add("active");
        });
    });

    // Tabs del modal
    const modalTabBtns = document.querySelectorAll(".modal-tab");
    const modalTabPanels = document.querySelectorAll(".tab-panel");

    modalTabBtns.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-tab");
            
            modalTabBtns.forEach(t => t.classList.remove("active"));
            modalTabPanels.forEach(p => p.classList.remove("active"));
            
            tab.classList.add("active");
            document.getElementById(`tab-${target}`).classList.add("active");
        });
    });
}

// =================== SELECCIÓN DE TIPO ===================
function initializeContentTypes() {
    const typeCards = document.querySelectorAll('.content-type-card');
    const selectedTypeInfo = document.getElementById('selected-type-info');
    const selectedTypeName = document.getElementById('selected-type-name');
    
    if (!typeCards.length) return;

    typeCards.forEach(card => {
        card.addEventListener('click', () => {
            typeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            selectedType = card.getAttribute('data-type');
            
            const typeNames = {
                'video': 'Video',
                'document': 'Documento', 
                'image': 'Imagen',
                'quiz': 'Evaluación'
            };
            
            if (selectedTypeName) {
                selectedTypeName.textContent = typeNames[selectedType] || selectedType;
            }
            
            if (selectedTypeInfo) {
                selectedTypeInfo.classList.add('show');
            }
            
            updateUploadZone();
            
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
            accept: '.mp4,.avi,.mov,.mkv',
            info: 'Archivos de video: MP4, AVI, MOV (máx. 500MB)'
        },
        'document': {
            accept: '.pdf,.docx,.pptx',
            info: 'Documentos: PDF, DOCX, PPTX (máx. 50MB)'
        },
        'image': {
            accept: '.png,.jpg,.jpeg,.svg,.gif',
            info: 'Imágenes: PNG, JPG, SVG (máx. 10MB)'
        },
        'quiz': {
            accept: '',
            info: 'Las evaluaciones no requieren archivo'
        }
    };
    
    if (selectedType && typeConfig[selectedType]) {
        uploadInfo.textContent = typeConfig[selectedType].info;
        fileInput.accept = typeConfig[selectedType].accept;
    }
}

// =================== UPLOAD ===================
function initializeUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-files');

    if (!uploadZone || !fileInput) return;

    browseBtn.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('click', () => {
        if (selectedType && selectedType !== 'quiz') {
            fileInput.click();
        }
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (selectedType && selectedType !== 'quiz') {
            uploadZone.classList.add('dragover');
        }
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (selectedType && selectedType !== 'quiz' && e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    selectedFile = file;
    
    const uploadZone = document.getElementById('upload-zone');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadSuccess = document.getElementById('upload-success');
    
    uploadZone.style.display = 'none';
    uploadProgress.style.display = 'block';
    uploadSuccess.style.display = 'none';
    
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const progressText = document.getElementById('progress-text');
    const progressFilename = document.querySelector('.progress-filename');
    const progressSize = document.querySelector('.progress-size');
    
    progressFilename.textContent = file.name;
    progressSize.textContent = formatFileSize(file.size);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        progressPercent.textContent = progress + '%';
        progressText.textContent = progress < 100 ? 'Preparando archivo...' : 'Archivo listo';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                uploadSuccess.style.display = 'block';
                
                const fileDetails = document.getElementById('file-details');
                fileDetails.textContent = `${file.name} (${formatFileSize(file.size)})`;
            }, 500);
        }
    }, 100);
}

// =================== CARGAR DIPLOMADOS ===================
async function loadDiplomados() {
    try {
        const response = await fetch('/contenido/api/diplomados');
        if (!response.ok) throw new Error('Error al cargar diplomados');
        
        diplomados = await response.json();
        
        const courseSelect = document.getElementById('course');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">Seleccionar Diplomado</option>';
            diplomados.forEach(dip => {
                const option = document.createElement('option');
                option.value = dip.id;
                option.textContent = dip.titulo;
                courseSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando diplomados:', error);
        showError('No se pudieron cargar los diplomados');
    }
}

// =================== CARGAR TODO EL CONTENIDO ===================
async function loadAllContent() {
    try {
        showLoading('Cargando contenido...');
        
        const response = await fetch('/contenido/api/listar-todos');
        if (!response.ok) throw new Error('Error al cargar contenidos');
        
        const contenidos = await response.json();
        console.log('Contenidos cargados:', contenidos);
        
        // Guardar en variable global para filtros
        window.allContent = contenidos;
        
        // Actualizar estadísticas
        updateContentStats(contenidos);
        
        // Renderizar lista
        renderContentList(contenidos);
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        console.error('Error cargando contenidos:', error);
        const contentList = document.getElementById('contentList');
        if (contentList) {
            contentList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar contenidos</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// =================== RENDERIZAR LISTA DE CONTENIDOS ===================
function renderContentList(contenidos) {
    const contentList = document.getElementById('contentList');
    if (!contentList) return;

    if (!contenidos || contenidos.length === 0) {
        contentList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No hay contenidos</h3>
                <p>Crea tu primer contenido usando el botón "Crear Nuevo Contenido"</p>
            </div>
        `;
        return;
    }

    contentList.innerHTML = contenidos.map(item => {
        // Generar preview del archivo según tipo
        let filePreview = '';
        const fileUrl = item.archivo_url || '';
        
        if (fileUrl) {
            switch(item.tipo) {
                case 'video':
                    filePreview = `
                        <div class="content-preview video-preview">
                            <video width="100%" height="300" controls>
                                <source src="${fileUrl}" type="video/mp4">
                                Tu navegador no soporta video.
                            </video>
                        </div>
                    `;
                    break;
                case 'image':
                    filePreview = `
                        <div class="content-preview image-preview">
                            <img src="${fileUrl}" alt="${item.titulo}">
                        </div>
                    `;
                    break;
                case 'document':
                    const ext = fileUrl.split('.').pop().toLowerCase();
                    const isPdf = ext === 'pdf';
                    filePreview = `
                        <div class="content-preview document-preview">
                            ${isPdf ? `
                                <iframe src="${fileUrl}" width="100%" height="400"></iframe>
                            ` : `
                                <div class="document-icon">
                                    <i class="fas fa-file-${ext === 'docx' ? 'word' : ext === 'pptx' ? 'powerpoint' : 'alt'}"></i>
                                    <p>Documento ${ext.toUpperCase()}</p>
                                </div>
                            `}
                        </div>
                    `;
                    break;
            }
        }

        return `
            <div class="content-item" data-id="${item.id}">
                <div class="content-item-header">
                    <div class="content-type-badge ${item.tipo}">${getTipoIcon(item.tipo)}</div>
                    <div class="content-title-section">
                        <h4>${item.titulo}</h4>
                        <p class="content-diplomado">
                            <i class="fas fa-graduation-cap"></i> 
                            ${item.diplomado_titulo || 'Sin diplomado'}
                        </p>
                    </div>
                </div>
                
                ${item.leccion ? `
                    <p class="content-lesson">
                        <i class="fas fa-book-open"></i> ${item.leccion}
                    </p>
                ` : ''}
                
                <p class="content-description">${item.descripcion || 'Sin descripción'}</p>
                
                ${filePreview}
                
                ${fileUrl ? `
                    <a href="${fileUrl}" download="${item.titulo}" class="btn-download">
                        <i class="fas fa-download"></i> Descargar ${item.tipo}
                    </a>
                ` : ''}
                
                <div class="content-meta">
                    <div class="content-badges">
                        <span class="badge ${getEstadoClass(item.estado)}">${getEstadoText(item.estado)}</span>
                        <span class="badge ${getDificultadClass(item.dificultad)}">${getDificultadText(item.dificultad)}</span>
                    </div>
                    <span class="content-date">
                        <i class="fas fa-clock"></i> ${item.fecha_creacion}
                    </span>
                </div>
                
                <div class="content-actions">
                    <button onclick="viewContent(${item.id})" class="btn-icon" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteContent(${item.id})" class="btn-icon btn-icon-danger" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// =================== FUNCIONES AUXILIARES ===================
function getTipoIcon(tipo) {
    const icons = {
        'video': '<i class="fas fa-video"></i>',
        'document': '<i class="fas fa-file-alt"></i>',
        'image': '<i class="fas fa-image"></i>',
        'quiz': '<i class="fas fa-question-circle"></i>'
    };
    return icons[tipo] || '';
}

function getEstadoClass(estado) {
    const classes = {
        'published': 'green',
        'draft': 'gray',
        'private': 'blue'
    };
    return classes[estado] || 'gray';
}

function getEstadoText(estado) {
    const estados = {
        'published': 'Publicado',
        'draft': 'Borrador',
        'private': 'Privado',
        'processing': 'Procesando'
    };
    return estados[estado] || estado;
}

function getDificultadClass(dificultad) {
    const classes = {
        'beginner': 'green',
        'intermediate': 'blue',
        'advanced': 'red'
    };
    return classes[dificultad] || 'gray';
}

function getDificultadText(dificultad) {
    const texts = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado'
    };
    return texts[dificultad] || dificultad;
}

// =================== ACTUALIZAR ESTADÍSTICAS ===================
function updateContentStats(contenidos) {
    const totalEl = document.querySelector('.stat-card:nth-child(1) .stat-info p');
    const videosEl = document.querySelector('.stat-card:nth-child(2) .stat-info p');
    const docsEl = document.querySelector('.stat-card:nth-child(3) .stat-info p');
    const publishedEl = document.querySelector('.stat-card:nth-child(4) .stat-info p');
    
    if (!totalEl) return;
    
    const stats = {
        total: contenidos.length,
        videos: contenidos.filter(c => c.tipo === 'video').length,
        documents: contenidos.filter(c => c.tipo === 'document').length,
        images: contenidos.filter(c => c.tipo === 'image').length,
        quizzes: contenidos.filter(c => c.tipo === 'quiz').length,
        published: contenidos.filter(c => c.estado === 'published').length,
        draft: contenidos.filter(c => c.estado === 'draft').length
    };
    
    totalEl.textContent = stats.total;
    totalEl.nextElementSibling.textContent = `${stats.published} publicados, ${stats.draft} borradores`;
    
    videosEl.textContent = stats.videos;
    videosEl.nextElementSibling.textContent = `Videos del curso`;
    
    docsEl.textContent = stats.documents;
    docsEl.nextElementSibling.textContent = `${stats.images} imágenes, ${stats.quizzes} quizzes`;
    
    publishedEl.textContent = stats.published;
    publishedEl.nextElementSibling.textContent = `${stats.total - stats.published} pendientes`;
}

// =================== FILTROS ===================
function initializeFilters() {
    const contentFilter = document.getElementById('content-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (contentFilter) {
        contentFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Botón de recarga
    const reloadBtn = document.getElementById('reload-content-btn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            loadAllContent();
        });
    }
}

function applyFilters() {
    if (!window.allContent) return;
    
    const contentType = document.getElementById('content-filter')?.value || 'all';
    const status = document.getElementById('status-filter')?.value || 'all';
    
    let filtered = window.allContent;
    
    if (contentType !== 'all') {
        filtered = filtered.filter(item => item.tipo === contentType);
    }
    
    if (status !== 'all') {
        filtered = filtered.filter(item => item.estado === status);
    }
    
    renderContentList(filtered);
}

// =================== BOTONES DE ACCIÓN ===================
function initializeButtons() {
    const createPublishBtn = document.getElementById('create-publish-btn');
    
    if (createPublishBtn) {
        createPublishBtn.addEventListener('click', handleCreateContent);
    }
    
    const changeFileBtn = document.getElementById('change-file-btn');
    if (changeFileBtn) {
        changeFileBtn.addEventListener('click', () => {
            const uploadZone = document.getElementById('upload-zone');
            const uploadSuccess = document.getElementById('upload-success');
            uploadZone.style.display = 'block';
            uploadSuccess.style.display = 'none';
            selectedFile = null;
        });
    }
}

// =================== CREAR CONTENIDO ===================
async function handleCreateContent() {
    const errors = validateForm();
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    removeValidationErrors();
    
    const formData = new FormData();
    
    formData.append('tipo', selectedType);
    formData.append('titulo', document.getElementById('title').value);
    formData.append('descripcion', document.getElementById('description').value);
    formData.append('diplomado_id', document.getElementById('course').value);
    formData.append('leccion', document.getElementById('lesson').value);
    formData.append('orden', document.getElementById('order').value || 0);
    formData.append('dificultad', document.getElementById('difficulty').value || 'beginner');
    formData.append('estado', 'published');
    
    formData.append('is_public', document.getElementById('is-public').checked);
    formData.append('allow_download', document.getElementById('allow-download').checked);
    formData.append('enable_comments', document.getElementById('enable-comments').checked);
    
    const publishDate = document.getElementById('publish-date').value;
    if (publishDate) formData.append('publish_date', publishDate);
    
    const expireDate = document.getElementById('expire-date').value;
    if (expireDate) formData.append('expire_date', expireDate);
    
    formData.append('notify', document.getElementById('notify-students').value);
    formData.append('prerequisito', document.getElementById('prerequisites').value);
    
    if (selectedType === 'quiz') {
        formData.append('quiz_preguntas', document.getElementById('quiz-questions').value);
        formData.append('quiz_tiempo', document.getElementById('quiz-time').value);
        formData.append('quiz_score_min', document.getElementById('quiz-score').value);
        formData.append('quiz_intentos', document.getElementById('quiz-attempts').value);
    } else {
        if (selectedFile) {
            formData.append('archivo', selectedFile);
        }
    }
    
    try {
        showLoading('Creando contenido...');
        
        const response = await fetch('/contenido/api/crear', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al crear contenido');
        }
        
        showSuccess('Contenido creado exitosamente');
        
        setTimeout(() => {
            document.getElementById('modalOverlay').style.display = 'none';
            document.body.style.overflow = 'auto';
            resetForm();
            loadAllContent();
        }, 1500);
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error:', error);
    }
}

// =================== VALIDACIÓN ===================
function validateForm() {
    const errors = [];
    
    if (!selectedType) {
        errors.push('Debe seleccionar un tipo de contenido');
    }
    
    const titulo = document.getElementById('title').value.trim();
    if (!titulo) {
        errors.push('El título es obligatorio');
    }
    
    const diplomadoId = document.getElementById('course').value;
    if (!diplomadoId) {
        errors.push('Debe seleccionar un diplomado');
    }
    
    const leccion = document.getElementById('lesson').value;
    if (!leccion) {
        errors.push('Debe seleccionar una lección');
    }
    
    if (selectedType !== 'quiz' && !selectedFile) {
        errors.push('Debe subir un archivo');
    }
    
    if (selectedType === 'quiz') {
        const preguntas = document.getElementById('quiz-questions').value;
        if (!preguntas || preguntas < 1) {
            errors.push('Número de preguntas inválido');
        }
    }
    
    return errors;
}

function showValidationErrors(errors) {
    removeValidationErrors();
    
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
        
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.insertBefore(errorEl, modalBody.firstChild);
        }
    });
    
    const firstError = document.querySelector('.error-message');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function removeValidationErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

// =================== ACCIONES DE CONTENIDO ===================
function viewContent(id) {
    alert(`Ver contenido ID: ${id} - Funcionalidad pendiente`);
}

async function deleteContent(id) {
    if (!confirm('¿Estás seguro de eliminar este contenido?')) {
        return;
    }
    
    try {
        showLoading('Eliminando contenido...');
        
        const response = await fetch(`/contenido/api/eliminar/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al eliminar');
        }
        
        showSuccess('Contenido eliminado exitosamente');
        loadAllContent();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error:', error);
    }
}

// =================== UTILIDADES ===================
function resetForm() {
    selectedType = '';
    selectedFile = null;
    
    document.querySelectorAll('.content-type-card').forEach(c => c.classList.remove('selected'));
    
    const selectedTypeInfo = document.getElementById('selected-type-info');
    if (selectedTypeInfo) selectedTypeInfo.classList.remove('show');
    
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('course').value = '';
    document.getElementById('lesson').value = '';
    document.getElementById('order').value = '';
    document.getElementById('difficulty').value = '';
    
    const uploadZone = document.getElementById('upload-zone');
    const uploadSuccess = document.getElementById('upload-success');
    if (uploadZone) uploadZone.style.display = 'block';
    if (uploadSuccess) uploadSuccess.style.display = 'none';
    
    removeValidationErrors();
    
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('.modal-tab[data-tab="tipo"]').classList.add('active');
    document.getElementById('tab-tipo').classList.add('active');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    loadingDiv.innerHTML = `
        <div style="background: white; padding: 2rem 3rem; border-radius: 16px; text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: #1e293b; font-weight: 600;">${message}</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.remove();
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    } else {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        notification.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + message;
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}