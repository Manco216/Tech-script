// Esperar a que cargue el DOM
    // ==========================
    // FILTROS Y BÚSQUEDA
    // ==========================
    const searchInput = document.getElementById("searchInput");
    const filterRole = document.getElementById("filterRole");
    const filterStatus = document.getElementById("filterStatus");
    const filterCity = document.getElementById("filterCity");
    const userRows = document.querySelectorAll(".user-row");

    function filtrarUsuarios() {
        const search = searchInput.value.toLowerCase();
        const role = filterRole.value;
        const status = filterStatus.value;
        const city = filterCity ? filterCity.value : "todas";

        let encontrados = 0;

        userRows.forEach(row => {
            const nombre = row.querySelector("div:nth-child(1)").textContent.toLowerCase();
            const correo = row.querySelector("div:nth-child(3)").textContent.toLowerCase();
            const rol = row.querySelector("div:nth-child(5)").textContent.toLowerCase();
            const estado = row.querySelector("div:nth-child(6)").textContent.toLowerCase();
            const ciudad = row.dataset.city ? row.dataset.city.toLowerCase() : "todas";

            const coincideBusqueda = nombre.includes(search) || correo.includes(search);
            const coincideRol = (role === "todos") || (rol.includes(role));
            const coincideEstado = (status === "todos") || (estado.includes(status));
            const coincideCiudad = (city === "todas") || (ciudad.includes(city));

            if (coincideBusqueda && coincideRol && coincideEstado && coincideCiudad) {
                row.style.display = "block";
                encontrados++;
            } else {
                row.style.display = "none";
            }
        });

        if (encontrados === 0) {
            if (!document.getElementById("noUsersMessage")) {
                const mensaje = document.createElement("p");
                mensaje.id = "noUsersMessage";
                mensaje.textContent = "No hay usuarios con esos criterios.";
                document.querySelector("#usuarios-tab").appendChild(mensaje);
            }
        } else {
            const mensaje = document.getElementById("noUsersMessage");
            if (mensaje) mensaje.remove();
        }
    }

    searchInput.addEventListener("input", filtrarUsuarios);
    filterRole.addEventListener("change", filtrarUsuarios);
    filterStatus.addEventListener("change", filtrarUsuarios);
    if (filterCity) filterCity.addEventListener("change", filtrarUsuarios);

    // ==========================
    // MODAL EDITAR USUARIO
    // ==========================
document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".btn-edit");
  const editModal = document.getElementById("editUserModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const editForm = document.getElementById("editUserForm");

  const editUserId = document.getElementById("editUserId");
  const editNombre = document.getElementById("editNombre");
  const editCorreo = document.getElementById("editCorreo");
  const editTelefono = document.getElementById("editTelefono");
  const editRol = document.getElementById("editRol");

  // Abrir modal
  editButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      editUserId.value = btn.dataset.id;
      editNombre.value = btn.dataset.nombre;
      editCorreo.value = btn.dataset.correo;
      editTelefono.value = btn.dataset.telefono;
      editRol.value = btn.dataset.rol;

      editModal.classList.remove("hidden"); // mostrar
    });
  });

  // Cerrar modal
  closeModalBtn.addEventListener("click", () => {
    editModal.classList.add("hidden"); // ocultar
  });

  // Guardar cambios
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = editUserId.value;
    const data = {
      nombre: editNombre.value,
      correo: editCorreo.value,
      telefono: editTelefono.value,
      rol: editRol.value
    };

    try {
      const response = await fetch(`/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert("Usuario actualizado ✅");
        location.reload();
      } else {
        alert("Error al actualizar ❌");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });
});


// SOLICITUDES
function renderApprovals() {
    const approvalsList = document.getElementById('approvalsList');
    if (!approvalsList) return;
    
    if (solicitudesPendientes.length === 0) {
        approvalsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #10b981;"></i>
                <h4 style="margin-bottom: 0.5rem;">Todo al día</h4>
                <p>No hay solicitudes pendientes de aprobación</p>
            </div>
        `;
        return;
    }

    approvalsList.innerHTML = solicitudesPendientes.map(solicitud => `
        <div class="approval-card">
            <div class="approval-header">
                <div class="approval-user-info">
                    <div class="user-avatar">
                        ${getInitials(solicitud.nombre)}
                    </div>
                    <div class="approval-details">
                        <h4>${solicitud.nombre}</h4>
                        <p class="approval-email"><i class="fas fa-envelope"></i> ${solicitud.email}</p>
                        <div class="approval-meta">
                            <span><i class="fas fa-phone"></i> ${solicitud.telefono}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${solicitud.ciudad}</span>
                            <span><i class="fas fa-clock"></i> ${formatTime(solicitud.fechaSolicitud)}</span>
                        </div>
                    </div>
                </div>
                <span class="badge badge-status pendiente">
                    <i class="fas fa-hourglass-half"></i> Pendiente
                </span>
            </div>
            
            <div class="approval-content">
                <div class="approval-section">
                    <h5><i class="fas fa-briefcase"></i> Experiencia</h5>
                    <p>${solicitud.experiencia}</p>
                </div>
                
                <div class="approval-section">
                    <h5><i class="fas fa-star"></i> Especialidad</h5>
                    <p>${solicitud.especialidad}</p>
                </div>
                
                <div class="approval-section">
                    <h5><i class="fas fa-heart"></i> Motivación</h5>
                    <p>${solicitud.motivacion}</p>
                </div>
                
                <div class="approval-section">
                    <h5><i class="fas fa-graduation-cap"></i> Educación</h5>
                    <p>${solicitud.educacion}</p>
                </div>
                
                <div class="approval-links">
                    <a href="${solicitud.portafolio}" target="_blank" class="approval-link">
                        <i class="fas fa-globe"></i> Portafolio
                    </a>
                    <a href="${solicitud.linkedin}" target="_blank" class="approval-link">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </a>
                </div>
            </div>
            
            <div class="approval-actions">
                <button class="btn btn-outline" onclick="viewApprovalDetails(${solicitud.id})">
                    <i class="fas fa-eye"></i> Ver detalles
                </button>
                <button class="btn btn-success" onclick="approveInstructor(${solicitud.id})">
                    <i class="fas fa-check"></i> Aprobar como Instructor
                </button>
                <button class="btn btn-danger" onclick="rejectInstructor(${solicitud.id})">
                    <i class="fas fa-times"></i> Rechazar
                </button>
            </div>
        </div>
    `).join('');
}

// FUNCIONES AUXILIARES
function getInitials(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getRoleIcon(rol) {
    const icons = {
        'Estudiante': '<i class="fas fa-graduation-cap"></i>',
        'Instructor': '<i class="fas fa-user-check"></i>',
        'Admin': '<i class="fas fa-shield-alt"></i>'
    };
    return icons[rol] || '<i class="fas fa-user"></i>';
}

function renderUserMetrics(usuario) {
    if (usuario.rol === 'Estudiante') {
        return `
            <div class="user-metrics">
                <strong>Cursos:</strong> ${usuario.cursosInscritos} inscritos, ${usuario.cursosCompletados} completados
            </div>
        `;
    } else if (usuario.rol === 'Instructor') {
        return `
            <div class="user-metrics">
                <strong>Cursos creados:</strong> ${usuario.cursosCreados} | 
                <strong>Estudiantes:</strong> ${usuario.estudiantes} | 
                <strong>Ingresos:</strong> $${usuario.ingresos?.toLocaleString() || 0}
            </div>
        `;
    }
    return '';
}

function renderActionButtons(usuario) {
    if (usuario.estado === 'Pendiente') {
        return `
            <button class="btn btn-success" onclick="approveUser(${usuario.id})">
                <i class="fas fa-check-circle"></i>
                Aprobar
            </button>
        `;
    } else if (usuario.estado === 'Activo') {
        return `
            <button class="btn btn-warning" onclick="suspendUser(${usuario.id})">
                <i class="fas fa-pause-circle"></i>
                Suspender
            </button>
        `;
    } else if (usuario.estado === 'Suspendido') {
        return `
            <button class="btn btn-success" onclick="activateUser(${usuario.id})">
                <i class="fas fa-play-circle"></i>
                Activar
            </button>
        `;
    } else if (usuario.estado === 'Inactivo') {
        return `
            <button class="btn btn-primary" onclick="activateUser(${usuario.id})">
                <i class="fas fa-power-off"></i>
                Activar
            </button>
        `;
    }
    return '';
}

function formatTime(dateString) {
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// FILTROS
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterRole = document.getElementById('filterRole');
    const filterStatus = document.getElementById('filterStatus');
    const filterCity = document.getElementById('filterCity');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterRole) filterRole.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
    if (filterCity) filterCity.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('filterRole')?.value || 'todos';
    const statusFilter = document.getElementById('filterStatus')?.value || 'todos';
    const cityFilter = document.getElementById('filterCity')?.value || 'todas';
    
    usuariosFiltrados = usuarios.filter(usuario => {
        const matchSearch = usuario.nombre.toLowerCase().includes(searchTerm) ||
                          usuario.email.toLowerCase().includes(searchTerm);
        const matchRole = roleFilter === 'todos' || usuario.rol.toLowerCase() === roleFilter;
        const matchStatus = statusFilter === 'todos' || usuario.estado.toLowerCase() === statusFilter;
        const matchCity = cityFilter === 'todas' || usuario.ciudad === cityFilter;
        
        return matchSearch && matchRole && matchStatus && matchCity;
    });
    
    renderUsers();
}

// ESTADÍSTICAS
function updateStats() {
    const totalUsuarios = usuarios.length;
    const totalEstudiantes = usuarios.filter(u => u.rol === 'Estudiante').length;
    const totalInstructores = usuarios.filter(u => u.rol === 'Instructor').length;
    const totalAdmins = usuarios.filter(u => u.rol === 'Admin').length;
    
    const primaryStat = document.querySelector('.stat-card.primary .stat-info h3');
    const successStat = document.querySelector('.stat-card.success .stat-info h3');
    const warningStat = document.querySelector('.stat-card.warning .stat-info h3');
    const infoStat = document.querySelector('.stat-card.info .stat-info h3');
    
    if (primaryStat) primaryStat.textContent = totalUsuarios;
    if (successStat) successStat.textContent = totalEstudiantes;
    if (warningStat) warningStat.textContent = totalInstructores;
    if (infoStat) infoStat.textContent = totalAdmins;
}

// ACCIONES
function viewUser(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="modal-detail">
            <label><i class="fas fa-user"></i> Nombre completo</label>
            <p>${usuario.nombre}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-envelope"></i> Correo electrónico</label>
            <p>${usuario.email}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-phone"></i> Teléfono</label>
            <p>${usuario.telefono}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-map-marker-alt"></i> Ciudad</label>
            <p>${usuario.ciudad}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-user-tag"></i> Rol</label>
            <p>${usuario.rol}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-signal"></i> Estado</label>
            <p>${usuario.estado}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-calendar-plus"></i> Fecha de registro</label>
            <p>${formatDate(usuario.fechaRegistro)}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-clock"></i> Última actividad</label>
            <p>${formatDate(usuario.ultimaActividad)}</p>
        </div>
        ${usuario.rol === 'Estudiante' ? `
            <div class="modal-detail">
                <label><i class="fas fa-book"></i> Cursos inscritos</label>
                <p>${usuario.cursosInscritos}</p>
            </div>
            <div class="modal-detail">
                <label><i class="fas fa-check-circle"></i> Cursos completados</label>
                <p>${usuario.cursosCompletados}</p>
            </div>
        ` : ''}
        ${usuario.rol === 'Instructor' ? `
            <div class="modal-detail">
                <label><i class="fas fa-chalkboard-teacher"></i> Cursos creados</label>
                <p>${usuario.cursosCreados}</p>
            </div>
            <div class="modal-detail">
                <label><i class="fas fa-users"></i> Estudiantes</label>
                <p>${usuario.estudiantes}</p>
            </div>
            <div class="modal-detail">
                <label><i class="fas fa-dollar-sign"></i> Ingresos totales</label>
                <p>$${usuario.ingresos?.toLocaleString() || 0}</p>
            </div>
        ` : ''}
    `;
    
    showModal();
}

function viewApprovalDetails(id) {
    const solicitud = solicitudesPendientes.find(s => s.id === id);
    if (!solicitud) return;
    
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="modal-detail">
            <label><i class="fas fa-user"></i> Nombre completo</label>
            <p>${solicitud.nombre}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-envelope"></i> Correo electrónico</label>
            <p>${solicitud.email}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-phone"></i> Teléfono</label>
            <p>${solicitud.telefono}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-map-marker-alt"></i> Ciudad</label>
            <p>${solicitud.ciudad}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-briefcase"></i> Experiencia</label>
            <p>${solicitud.experiencia}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-star"></i> Especialidad</label>
            <p>${solicitud.especialidad}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-heart"></i> Motivación</label>
            <p>${solicitud.motivacion}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-graduation-cap"></i> Educación</label>
            <p>${solicitud.educacion}</p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-globe"></i> Portafolio</label>
            <p><a href="${solicitud.portafolio}" target="_blank">${solicitud.portafolio}</a></p>
        </div>
        <div class="modal-detail">
            <label><i class="fab fa-linkedin"></i> LinkedIn</label>
            <p><a href="${solicitud.linkedin}" target="_blank">${solicitud.linkedin}</a></p>
        </div>
        <div class="modal-detail">
            <label><i class="fas fa-calendar"></i> Fecha de solicitud</label>
            <p>${formatDate(solicitud.fechaSolicitud)}</p>
        </div>
    `;
    
    showModal();
}

function approveInstructor(id) {
    if (confirm('¿Estás seguro de que quieres aprobar a este usuario como instructor?')) {
        const solicitud = solicitudesPendientes.find(s => s.id === id);
        if (solicitud) {
            const nuevoInstructor = {
                id: usuarios.length + 1,
                nombre: solicitud.nombre,
                email: solicitud.email,
                rol: "Instructor",
                estado: "Activo",
                ciudad: solicitud.ciudad,
                telefono: solicitud.telefono,
                fechaRegistro: new Date().toISOString().split('T')[0],
                ultimaActividad: new Date().toISOString().split('T')[0],
                cursosCreados: 0,
                estudiantes: 0,
                ingresos: 0
            };
            
            usuarios.push(nuevoInstructor);
            
            const index = solicitudesPendientes.findIndex(s => s.id === id);
            solicitudesPendientes.splice(index, 1);
            
            usuariosFiltrados = [...usuarios];
            renderUsers();
            renderApprovals();
            updateStats();
            updateTabBadges();
            
            showNotification(`${solicitud.nombre} ha sido aprobado como instructor exitosamente`, 'success');
        }
    }
}

function rejectInstructor(id) {
    if (confirm('¿Estás seguro de que quieres rechazar esta solicitud? Esta acción no se puede deshacer.')) {
        const solicitud = solicitudesPendientes.find(s => s.id === id);
        if (solicitud) {
            const index = solicitudesPendientes.findIndex(s => s.id === id);
            solicitudesPendientes.splice(index, 1);
            
            renderApprovals();
            updateTabBadges();
            showNotification(`Solicitud de ${solicitud.nombre} rechazada`, 'error');
        }
    }
}

function editUser(id) {
    const usuario = usuarios.find(u => u.id === id);
    showNotification(`Función de editar usuario "${usuario.nombre}" - En desarrollo`, 'info');
}

function approveUser(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario) {
        usuario.estado = 'Activo';
        renderUsers();
        updateStats();
        showNotification(`Usuario "${usuario.nombre}" aprobado exitosamente`, 'success');
    }
}

function suspendUser(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario) {
        usuario.estado = 'Suspendido';
        renderUsers();
        updateStats();
        showNotification(`Usuario "${usuario.nombre}" suspendido`, 'error');
    }
}

function activateUser(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario) {
        usuario.estado = 'Activo';
        renderUsers();
        updateStats();
        showNotification(`Usuario "${usuario.nombre}" activado exitosamente`, 'success');
    }
}

function deleteUser(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre}"?`)) {
        const index = usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
            usuarios.splice(index, 1);
            applyFilters();
            updateStats();
            updateTabBadges();
            showNotification(`Usuario "${usuario.nombre}" eliminado`, 'error');
        }
    }
}

// MODAL
function showModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'none';
}

// NOTIFICACIONES
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notification.className = `notification ${type}`;
        notificationText.textContent = message;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            closeNotification();
        }, 4000);
    }
}

function closeNotification() {
    const notification = document.getElementById('notification');
    if (notification) notification.style.display = 'none';
}

// EVENTOS
document.addEventListener('click', function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeNotification();
    }
});
// Resto del código JavaScript permanece igual...
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