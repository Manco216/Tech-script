document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const toggleSidebarTop = document.getElementById("toggleSidebarTop");
  const overlay = document.getElementById("overlay");

  // ------- Modal del calendario -------
  const modal = document.getElementById("eventModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDate = document.getElementById("modalDate");

  if (document.getElementById("closeModal")) {
    document.getElementById("closeModal").addEventListener("click", function() {
      modal.classList.remove("active");
    });
  }

  window.addEventListener("click", function(e) {
    if (e.target.id === "eventModal") modal.classList.remove("active");
  });

  // ========================
  // NUEVOS MODALES - NOTIFICACIONES Y CHATBOT
  // ========================

  // Referencias a elementos de los nuevos modales
  const notificationBell = document.getElementById('notifications');
  const chatbotBtn = document.getElementById('chatbot');
  const notificationsModal = document.getElementById('notificationsModal');
  const chatbotModal = document.getElementById('chatbotModal');
  const closeNotifications = document.getElementById('closeNotifications');
  const closeChatbot = document.getElementById('closeChatbot');
  
  // Abrir modal de notificaciones
  if (notificationBell) {
    notificationBell.addEventListener('click', function() {
      if (notificationsModal) {
        notificationsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }
  
  // Abrir modal de chatbot
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', function() {
      if (chatbotModal) {
        chatbotModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
          setTimeout(() => chatInput.focus(), 100);
        }
      }
    });
  }
  
  // Cerrar modal de notificaciones
  if (closeNotifications) {
    closeNotifications.addEventListener('click', closeNotificationsModal);
  }
  
  // Cerrar modal de chatbot
  if (closeChatbot) {
    closeChatbot.addEventListener('click', closeChatbotModal);
  }
  
  // Cerrar modales al hacer clic fuera
  if (notificationsModal) {
    notificationsModal.addEventListener('click', function(e) {
      if (e.target === notificationsModal) {
        closeNotificationsModal();
      }
    });
  }
  
  if (chatbotModal) {
    chatbotModal.addEventListener('click', function(e) {
      if (e.target === chatbotModal) {
        closeChatbotModal();
      }
    });
  }
  
  // Funciones para cerrar modales
  function closeNotificationsModal() {
    if (notificationsModal) {
      notificationsModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }
  
  function closeChatbotModal() {
    if (chatbotModal) {
      chatbotModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }
  
  // Cerrar modales con tecla ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (notificationsModal && notificationsModal.classList.contains('active')) {
        closeNotificationsModal();
      }
      if (chatbotModal && chatbotModal.classList.contains('active')) {
        closeChatbotModal();
      }
    }
  });
  
  // ========================
  // FUNCIONALIDAD DE FILTROS DE NOTIFICACIONES
  // ========================
  
  const filterBtns = document.querySelectorAll('.filter-btn');
  const notificationItems = document.querySelectorAll('.notification-item');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.dataset.filter;
      
      // Actualizar botones activos
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Filtrar notificaciones
      notificationItems.forEach(item => {
        if (filter === 'all' || item.dataset.type === filter) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
  
  // Marcar notificación como leída
  notificationItems.forEach(item => {
    item.addEventListener('click', function() {
      this.style.opacity = '0.6';
      const action = this.querySelector('.notification-action');
      if (action) {
        action.innerHTML = '<i class="fas fa-check-circle"></i>';
        action.style.color = '#059669';
      }
    });
  });
  
  // ========================
  // FUNCIONALIDAD DEL CHATBOT
  // ========================
  
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendMessage');
  const chatMessages = document.getElementById('chatMessages');
  const quickBtns = document.querySelectorAll('.quick-btn');
  
  // Enviar mensaje
  function sendMessage() {
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (message) {
      addMessage(message, 'user');
      chatInput.value = '';
      
      // Simular respuesta del bot después de un delay
      setTimeout(() => {
        const botResponse = getBotResponse(message);
        addMessage(botResponse, 'bot');
      }, 1000);
    }
  }
  
  // Agregar mensaje al chat
  function addMessage(text, sender) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
      </div>
      <div class="message-content">
        <p>${text}</p>
        <span class="message-time">${timeString}</span>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Respuestas automáticas del bot
  function getBotResponse(message) {
    const responses = {
      'hola': '¡Hola! ¿En qué puedo ayudarte hoy?',
      'progreso': 'Tu progreso actual es del 75% en Desarrollo Web, 45% en Data Science, 90% en Ciberseguridad y 20% en IA.',
      'tareas': 'Tienes 2 tareas pendientes: Quiz de React (vence en 2 días) y Proyecto de ML (vence en 5 días).',
      'examenes': 'Tu próximo examen es el Final de Ciberseguridad, programado para el 12 de agosto.',
      'ayuda': 'Puedo ayudarte con información sobre tus cursos, progreso, tareas pendientes, exámenes y más. ¿Qué necesitas saber?'
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (let key in responses) {
      if (lowerMessage.includes(key)) {
        return responses[key];
      }
    }
    
    return 'Entiendo tu consulta. ¿Podrías ser más específico? Puedo ayudarte con información sobre cursos, progreso, tareas o exámenes.';
  }
  
  // Event listeners para el chat
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Botones de acción rápida
  quickBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const message = this.dataset.message;
      addMessage(message, 'user');
      
      setTimeout(() => {
        const botResponse = getBotResponse(message);
        addMessage(botResponse, 'bot');
      }, 1000);
    });
  });

  // ------- Sidebar -------
  function toggleSidebarState() {
    if (sidebar) {
      sidebar.classList.toggle("collapsed");
      if (!sidebar.classList.contains("collapsed") && overlay) {
        overlay.classList.add("active");
      } else if (overlay) {
        overlay.classList.remove("active");
      }
    }
  }
  
  if (toggleSidebar) toggleSidebar.addEventListener("click", toggleSidebarState);
  if (toggleSidebarTop) toggleSidebarTop.addEventListener("click", toggleSidebarState);
  if (overlay) {
    overlay.addEventListener("click", () => {
      if (sidebar) sidebar.classList.add("collapsed");
      overlay.classList.remove("active");
    });
  }

  // Helper para comparar fechas YYYY-MM-DD sin zonas horarias
  function ymd(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  // ------- Calendario -------
  const calendarEl = document.getElementById("calendar");
  let calendar;
  
  if (calendarEl) {
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "es",
      headerToolbar: false,
      height: "auto",

      events: [
        { title: "Examen Final",     start: "2025-08-12", extendedProps: { tipo: "rojo" } },
        { title: "Fecha Final del diplomado",          start: "2025-08-10", extendedProps: { tipo: "azul" } },
        { title: "Entrega Proyecto", start: "2025-08-26", extendedProps: { tipo: "verde" } },
        { title: "Proximo Quiz",     start: "2025-08-30", extendedProps: { tipo: "amarillo" } }
      ],

      // Pintamos el círculo del número según el tipo de evento (sin mostrar filas de eventos)
      dayCellDidMount: function(arg){
        const dayISO = ymd(arg.date);
        const eventsForDay = calendar.getEvents().filter(ev => ymd(ev.start) === dayISO);

        if (eventsForDay.length > 0) {
          const tipo = eventsForDay[0].extendedProps?.tipo;
          const numEl = arg.el.querySelector(".fc-daygrid-day-number");
          if (!numEl) return;

          // Respetar el estilo de HOY (negro). Si no es hoy, colorear por tipo.
          if (!arg.el.classList.contains("fc-day-today")) {
            if (tipo === "rojo")    { numEl.style.background = "#fca5a5"; numEl.style.color = "#111827"; }
            if (tipo === "azul")    { numEl.style.background = "#93c5fd"; numEl.style.color = "#111827"; }
            if (tipo === "verde")   { numEl.style.background = "#86efac"; numEl.style.color = "#111827"; }
            if (tipo === "amarillo"){ numEl.style.background = "#fde68a"; numEl.style.color = "#111827"; }
            numEl.style.borderRadius = "50%";
          }

          // Marcamos la celda con una clase por si quieres más estilos en CSS
          if (tipo) arg.el.classList.add(`event-${tipo}`);
        }
      },

      // Dejamos eventClick por si en el futuro vuelves a mostrar los eventos
      eventClick: function(info) {
        if (modalTitle && modalDate && modal) {
          modalTitle.textContent = info.event.title;
          modalDate.textContent = info.event.start.toLocaleDateString("es-ES");
          modal.classList.add("active");
        }
      }
    });

    calendar.render();
    updateCalendarTitle();

    // ------- Clic en DÍA (delegación) para abrir modal con los eventos de ese día -------
    calendarEl.addEventListener("click", function(e){
      const cell = e.target.closest(".fc-daygrid-day");
      if (!cell) return;

      const dayISO = cell.getAttribute("data-date"); // YYYY-MM-DD
      if (!dayISO) return;

      const eventsForDay = calendar.getEvents().filter(ev => ymd(ev.start) === dayISO);
      if (eventsForDay.length === 0) return;

      // Si hay varios eventos ese día, mostramos el primero (puedes adaptar a lista)
      const ev = eventsForDay[0];
      if (modalTitle && modalDate && modal) {
        modalTitle.textContent = ev.title;
        modalDate.textContent = new Date(dayISO).toLocaleDateString("es-ES");
        modal.classList.add("active");
      }
    });

    // ------- Navegación -------
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    
    if (prevMonth) {
      prevMonth.addEventListener('click', function() {
        calendar.prev();
        updateCalendarTitle();
      });
    }
    
    if (nextMonth) {
      nextMonth.addEventListener('click', function() {
        calendar.next();
        updateCalendarTitle();
      });
    }
  }

  function updateCalendarTitle() {
    if (!calendar) return;
    const d = calendar.getDate();
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const titleElement = document.querySelector('.calendar-title');
    if (titleElement) {
      titleElement.textContent = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  // === DROPDOWN PERFIL ===
  function initializeProfileDropdown() {
    const profilePic = document.getElementById('profile');
    const dropdownMenu = document.getElementById('dropdownMenu');
    let dropdownOverlay;

    if (!profilePic || !dropdownMenu) return;

    // Crear overlay si no existe
    dropdownOverlay = document.querySelector('.dropdown-overlay');
    if (!dropdownOverlay) {
      dropdownOverlay = document.createElement('div');
      dropdownOverlay.className = 'dropdown-overlay';
      document.body.appendChild(dropdownOverlay);
    }

    // Toggle dropdown
    function toggleDropdown(e) {
      e.stopPropagation();
      const isActive = dropdownMenu.classList.contains('active');
      
      if (isActive) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }

    function openDropdown() {
      dropdownMenu.classList.add('active');
      dropdownOverlay.classList.add('active');
      document.body.addEventListener('click', closeDropdown);
    }

    function closeDropdown() {
      dropdownMenu.classList.remove('active');
      dropdownOverlay.classList.remove('active');
      document.body.removeEventListener('click', closeDropdown);
    }

    // Event listeners
    profilePic.addEventListener('click', toggleDropdown);
    dropdownOverlay.addEventListener('click', closeDropdown);

    // Prevenir cierre al hacer click dentro del dropdown
    dropdownMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Manejar items del dropdown
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const spanElement = item.querySelector('span');
        if (!spanElement) return;
        
        const text = spanElement.textContent;
        console.log(`Navegando a: ${text}`);
        
        // Aquí puedes agregar la navegación específica
     if (text === 'Cerrar Sesión') {
    console.log('Cerrando sesión...');
    // Redirige a la ruta /logout de Flask
    window.location.href = '/logout';
}
else if (text === 'Mi Cuenta') {
          console.log('Navegando a Mi Cuenta');
          // window.location.href = 'mi-cuenta.html';
        } else if (text === 'Perfil') {
          window.location.href = 'perfilEstudiante.html';
        }
        
        closeDropdown();
      });
    });
  }

  // === NAVEGACIÓN DE CURSOS ===
  function initializeProgressNavigation() {
    const progressSection = document.querySelector('.progress-section');
    const progressGrid = document.querySelector('.progress-grid');
    const progressCards = document.querySelectorAll('.progress-card');
    
    if (!progressSection || !progressGrid || progressCards.length <= 3) return;

    // Crear controles de navegación
    const navigationHTML = `
      <div class="progress-navigation">
        <button class="nav-arrow" id="prevCourses" title="Cursos anteriores">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="nav-arrow" id="nextCourses" title="Siguientes cursos">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    progressSection.insertAdjacentHTML('afterbegin', navigationHTML);

    // Referencias a elementos
    const prevBtn = document.getElementById('prevCourses');
    const nextBtn = document.getElementById('nextCourses');
    
    if (!prevBtn || !nextBtn) return;
    
    // Variables de control
    const cardWidth = 352; // 320px + 32px gap
    const visibleCards = Math.floor(progressGrid.clientWidth / cardWidth) || 3;
    const totalCards = progressCards.length;
    const maxScroll = progressGrid.scrollWidth - progressGrid.clientWidth;
    
    let currentIndex = 0;
    const maxIndex = Math.max(0, totalCards - visibleCards);

    // Función para actualizar estado de botones
    function updateNavButtons() {
      const scrollLeft = progressGrid.scrollLeft;
      const isAtStart = scrollLeft <= 10;
      const isAtEnd = scrollLeft >= maxScroll - 10;

      prevBtn.disabled = isAtStart;
      nextBtn.disabled = isAtEnd;
      
      // Actualizar índice actual basado en scroll
      currentIndex = Math.round(scrollLeft / cardWidth);
    }

    // Función para navegar
    function navigateToIndex(index) {
      const targetScroll = Math.min(index * cardWidth, maxScroll);
      
      progressGrid.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      currentIndex = index;
    }

    // Event listeners para botones
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        navigateToIndex(currentIndex - 1);
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < maxIndex) {
        navigateToIndex(currentIndex + 1);
      }
    });

    // Actualizar botones cuando se hace scroll manual
    progressGrid.addEventListener('scroll', () => {
      updateNavButtons();
    });

    // Soporte para teclado
    progressSection.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
        e.preventDefault();
        prevBtn.click();
      } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
        e.preventDefault();
        nextBtn.click();
      }
    });

    // Hacer la sección focuseable para soporte de teclado
    progressSection.setAttribute('tabindex', '0');

    // Inicializar estado
    updateNavButtons();
    
    // Actualizar en resize
    window.addEventListener('resize', () => {
      setTimeout(updateNavButtons, 100);
    });
  }

  // === INDICADOR DE SCROLL MEJORADO ===
  function initializeScrollIndicator() {
    const progressSection = document.querySelector('.progress-section');
    const progressGrid = document.querySelector('.progress-grid');
    const progressCards = document.querySelectorAll('.progress-card');
    
    if (!progressSection || !progressGrid || progressCards.length <= 3) return;

    // Crear indicador de scroll
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    
    const visibleCards = 3;
    const totalPages = Math.ceil(progressCards.length / visibleCards);
    let currentPage = 0;

    scrollIndicator.innerHTML = `
      <span class="scroll-text">Desliza para ver más cursos</span>
      <div class="scroll-dots">
        ${Array.from({length: totalPages}, (_, i) => 
          `<div class="scroll-dot ${i === 0 ? 'active' : ''}" data-page="${i}"></div>`
        ).join('')}
      </div>
      <div class="scroll-arrow">→</div>
    `;

    progressSection.appendChild(scrollIndicator);
    progressSection.classList.add('scrollable');

    const scrollDots = scrollIndicator.querySelectorAll('.scroll-dot');
    const scrollText = scrollIndicator.querySelector('.scroll-text');
    const scrollArrow = scrollIndicator.querySelector('.scroll-arrow');

    function updateScrollState() {
      const scrollLeft = progressGrid.scrollLeft;
      const maxScroll = progressGrid.scrollWidth - progressGrid.clientWidth;
      const cardWidth = 352;
      
      currentPage = Math.round(scrollLeft / cardWidth);
      
      scrollDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPage);
      });

      if (scrollLeft === 0) {
        scrollText.textContent = `Ver ${progressCards.length - visibleCards} cursos más `;
        scrollIndicator.className = 'scroll-indicator visible start';
      } else if (scrollLeft >= maxScroll - 5) {
        scrollText.textContent = '← Volver al inicio';
        scrollIndicator.className = 'scroll-indicator visible end';
      } else {
        scrollText.textContent = `${currentPage + 1} de ${totalPages} páginas`;
        scrollIndicator.className = 'scroll-indicator visible middle';
      }
    }

    function scrollToPage(pageIndex) {
      const cardWidth = 352;
      const targetScroll = pageIndex * cardWidth;
      
      progressGrid.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }

    // Event listeners
    scrollDots.forEach((dot, index) => {
      dot.addEventListener('click', () => scrollToPage(index));
    });

    if (scrollArrow) {
      scrollArrow.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
          scrollToPage(currentPage + 1);
        } else {
          scrollToPage(0);
        }
      });
    }

    progressGrid.addEventListener('scroll', updateScrollState);

    // Auto-mostrar después de 2 segundos
    setTimeout(() => {
      scrollIndicator.classList.add('visible');
      updateScrollState();
    }, 2000);

    // Sistema de auto-hide
    let hideTimer;
    function resetHideTimer() {
      clearTimeout(hideTimer);
      scrollIndicator.classList.add('visible');
      
      hideTimer = setTimeout(() => {
        if (!scrollIndicator.matches(':hover')) {
          scrollIndicator.classList.remove('visible');
        }
      }, 5000);
    }

    progressSection.addEventListener('mouseenter', resetHideTimer);
    progressGrid.addEventListener('scroll', resetHideTimer);
    scrollIndicator.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    scrollIndicator.addEventListener('mouseleave', resetHideTimer);

    updateScrollState();
  }

  // ======= FUNCIONALIDAD: NOTIFICACIONES MODERNAS EXISTENTES =======
  const viewMoreBtn = document.getElementById('viewMoreNotifications');
  const hiddenNotifications = document.querySelectorAll('.hidden-notification');
  const notificationCount = document.querySelector('.notification-count');
  let isExpanded = false;

  // Función para mostrar/ocultar notificaciones
  function toggleNotifications() {
    const viewMoreText = viewMoreBtn?.querySelector('.view-more-text');
    const viewMoreIcon = viewMoreBtn?.querySelector('.view-more-icon');

    if (!isExpanded) {
      // Mostrar notificaciones ocultas
      hiddenNotifications.forEach((notification, index) => {
        setTimeout(() => {
          notification.classList.add('show');
        }, index * 100);
      });

      // Cambiar texto y estilo del botón
      if (viewMoreText) viewMoreText.textContent = 'Ver menos';
      if (viewMoreBtn) viewMoreBtn.classList.add('expanded', 'collapsed');
      isExpanded = true;

      // Actualizar contador (simular que se marcan como vistas)
      setTimeout(() => {
        updateNotificationCount();
      }, 500);

    } else {
      // Ocultar notificaciones
      hiddenNotifications.forEach((notification, index) => {
        setTimeout(() => {
          notification.classList.remove('show');
        }, index * 50);
      });

      // Cambiar texto y estilo del botón
      if (viewMoreText) viewMoreText.textContent = 'Ver más';
      if (viewMoreBtn) viewMoreBtn.classList.remove('expanded', 'collapsed');
      isExpanded = false;
    }
  }

  // Event listener para el botón ver más
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener('click', toggleNotifications);
  }

  // Función para actualizar contador de notificaciones
  function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item-modern:not(.read)').length;
    if (notificationCount) {
      notificationCount.textContent = unreadCount;
      notificationCount.classList.add('updated');
      
      setTimeout(() => {
        notificationCount.classList.remove('updated');
      }, 600);

      // Ocultar contador si no hay notificaciones
      notificationCount.style.display = unreadCount > 0 ? 'block' : 'none';
    }
  }

  // Manejar clicks en notificaciones individuales existentes
  const allNotifications = document.querySelectorAll('.notification-item-modern');
  
  allNotifications.forEach((item) => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Marcar como leída
      this.classList.add('read');
      
      // Actualizar contador
      updateNotificationCount();
      
      // Agregar efecto visual de click
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);

      // Simular navegación según el tipo de notificación
      const titleElement = this.querySelector('.notification-title');
      const title = titleElement ? titleElement.textContent : '';
      const notificationType = this.getAttribute('data-tipo');
      
      console.log('Notificación clickeada:', title, 'Tipo:', notificationType);
      
      // Aquí puedes agregar navegación específica según el tipo
      switch(notificationType) {
        case 'rojo':
          console.log('Navegando a examen/urgente');
          // window.location.href = 'examenes.html';
          break;
        case 'azul':
          console.log('Navegando a mensajes/tareas');
          // window.location.href = 'mensajes.html';
          break;
        case 'verde':
          console.log('Navegando a proyectos completados');
          // window.location.href = 'certificados.html';
          break;
        case 'amarillo':
          console.log('Navegando a recordatorios');
          // window.location.href = 'calendario.html';
          break;
        default:
          console.log('Navegación general');
      }
    });
  });

  // Inicializar contador de notificaciones
  updateNotificationCount();

  // ------- Event Listeners Existentes -------
  const elementsWithEventListeners = [
    { id: 'diplomados', action: () => setActiveNavItem('diplomados') },
    { id: 'tutorias', action: () => setActiveNavItem('tutorias') },
    { id: 'pagos', action: () => setActiveNavItem('pagos') },
    { id: 'mensajes', action: () => setActiveNavItem('mensajes') },
    { id: 'certificados', action: () => setActiveNavItem('certificados') },
    { id: 'configuracion', action: () => setActiveNavItem('configuracion') },
    { id: 'mi-cuenta', action: () => setActiveNavItem('mi-cuenta') },
    { id: 'web-fullstack', action: () => console.log('Web Full Stack') },
    { id: 'data-science', action: () => console.log('Data Science') },
    { id: 'cybersecurity', action: () => console.log('Cybersecurity') },
    { id: 'ai-course', action: () => console.log('AI course') },
    { id: 'recomendaciones', action: () => console.log('Recomendaciones') },
    { id: 'notificaciones-recientes', action: () => console.log('Notificaciones') }
  ];

  elementsWithEventListeners.forEach(({ id, action }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', action);
    }
  });

  // Event listener para búsqueda
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e){
      console.log('Searching for:', e.target.value);
      // Aquí podrías implementar búsqueda en tiempo real
    });
  }

  // Función para cambiar ítem activo en navegación (si existe)
  function setActiveNavItem(itemId) {
    // Remover clase active de todos los ítems
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Agregar clase active al ítem seleccionado
    const activeItem = document.getElementById(itemId);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    console.log('Active nav item set to:', itemId);
  }

  // ------- Inicializar funcionalidades -------
  initializeProfileDropdown();
  initializeProgressNavigation();
  initializeScrollIndicator();

  // ========================
  // FUNCIONALIDAD DE BÚSQUEDA MEJORADA
  // ========================

  const contentArea = document.querySelector("main");

  if (searchInput && contentArea) {
    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function removeHighlights() {
      const highlights = contentArea.querySelectorAll("span.highlight");
      highlights.forEach(span => {
        const textNode = document.createTextNode(span.textContent);
        const parent = span.parentNode;
        parent.replaceChild(textNode, span);
        parent.normalize();
      });
      contentArea.normalize();
    }

    function isExcludedNode(node) {
      if (!node || !node.parentElement) return true;
      return !!node.parentElement.closest(
        ".welcome-calendar, .calendar-card, #calendar, #profile, .profile-pic, header, .modal-overlay"
      );
    }

    searchInput.addEventListener("input", function () {
      const rawQuery = this.value;
      const query = rawQuery.trim();
      removeHighlights();

      if (!query) return;

      const regex = new RegExp(escapeRegExp(query), "gi");
      const walker = document.createTreeWalker(
        contentArea,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parentTag = node.parentElement && node.parentElement.tagName && node.parentElement.tagName.toLowerCase();
            if (parentTag === "script" || parentTag === "style" || parentTag === "noscript") return NodeFilter.FILTER_REJECT;
            if (isExcludedNode(node)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      let node;
      const matches = [];

      while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        if (!text) continue;

        if (text.toLowerCase().indexOf(query.toLowerCase()) === -1) continue;

        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        regex.lastIndex = 0;
        let m;
        while ((m = regex.exec(text)) !== null) {
          const start = m.index;
          const end = regex.lastIndex;
          if (start > lastIndex) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
          }
          const span = document.createElement("span");
          span.className = "highlight";
          span.textContent = text.slice(start, end);
          frag.appendChild(span);
          matches.push(span);
          lastIndex = end;
          if (regex.lastIndex === m.index) regex.lastIndex++;
        }
        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        node.parentNode.replaceChild(frag, node);
      }

      if (matches.length === 0) return;

      requestAnimationFrame(() => {
        try {
          const currentScroll = window.scrollY;

          let nextMatch = matches.find(sp => {
            const spTop = sp.getBoundingClientRect().top + window.scrollY;
            return spTop > currentScroll + 5;
          });

          if (!nextMatch) nextMatch = matches[0];

          const rect = nextMatch.getBoundingClientRect();
          const matchTop = rect.top + window.scrollY;
          let targetTop = Math.round(matchTop - (window.innerHeight / 2));

          targetTop = Math.max(0, Math.min(targetTop, document.documentElement.scrollHeight - window.innerHeight));

          window.scrollTo({ top: targetTop, behavior: "smooth" });

          searchInput.focus();
        } catch (err) {
          console.error("Error al desplazar a la coincidencia", err);
        }
      });
    });
  }
});

// ========================
// FUNCIONES AUXILIARES PARA SIDEBAR (compatibilidad)
// ========================

function setupSidebar() {
  const toggleButtons = document.querySelectorAll('.toggle-btn');
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', toggleSidebar);
  });

  overlay?.addEventListener('click', closeSidebar);

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeSidebar();
    }
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  
  sidebar?.classList.toggle('active');
  overlay?.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  
  sidebar?.classList.remove('active');
  overlay?.classList.remove('active');
}

// ========================
// FUNCIONES ADICIONALES PARA MODAL
// ========================

// Función para mostrar notificación toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Función para actualizar badge de notificaciones
function updateNotificationBadge(count) {
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Función para simular carga de mensajes del chatbot
function showTypingIndicator() {
  if (!document.getElementById('chatMessages')) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.classList.add('message', 'bot-message', 'typing-indicator');
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content typing">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  document.getElementById('chatMessages').appendChild(typingDiv);
  document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
  
  return typingDiv;
}

function removeTypingIndicator() {
  const typingIndicator = document.querySelector('.typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Inicializar funcionalidades adicionales cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Configurar sidebar adicional si es necesario
  setupSidebar();
  
  // Agregar soporte para animaciones suaves en los modales
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.addEventListener('transitionend', function(e) {
      if (e.target === modal && !modal.classList.contains('active')) {
        // Modal completamente cerrado
        console.log('Modal cerrado completamente');
      }
    });
  });
});