document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const toggleSidebarTop = document.getElementById("toggleSidebarTop");
  const overlay = document.getElementById("overlay");

  // ------- Modal -------
  const modal = document.getElementById("eventModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDate = document.getElementById("modalDate");

  document.getElementById("closeModal").addEventListener("click", function() {
    modal.classList.remove("active");
  });

  window.addEventListener("click", function(e) {
    if (e.target.id === "eventModal") modal.classList.remove("active");
  });

  // ------- Sidebar -------
  function toggleSidebarState() {
    sidebar.classList.toggle("collapsed");
    if (!sidebar.classList.contains("collapsed")) overlay.classList.add("active");
    else overlay.classList.remove("active");
  }
  if (toggleSidebar) toggleSidebar.addEventListener("click", toggleSidebarState);
  if (toggleSidebarTop) toggleSidebarTop.addEventListener("click", toggleSidebarState);
  if (overlay) overlay.addEventListener("click", () => {
    sidebar.classList.add("collapsed");
    overlay.classList.remove("active");
  });

  // Helper para comparar fechas YYYY-MM-DD sin zonas horarias
  function ymd(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  // ------- Calendario -------
  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    headerToolbar: false,
    height: "auto",

    events: [
      { title: "Examen Final",     start: "2025-08-12", extendedProps: { tipo: "rojo" } },
      { title: "Reunión",          start: "2025-08-10", extendedProps: { tipo: "azul" } },
      { title: "Entrega Proyecto", start: "2025-08-26", extendedProps: { tipo: "verde" } },
      { title: "Recordatorio",     start: "2025-08-30", extendedProps: { tipo: "amarillo" } }
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
      modalTitle.textContent = info.event.title;
      modalDate.textContent = info.event.start.toLocaleDateString("es-ES");
      modal.classList.add("active");
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
    modalTitle.textContent = ev.title;
    modalDate.textContent = new Date(dayISO).toLocaleDateString("es-ES");
    modal.classList.add("active");
  });

  // ------- Navegación -------
  document.getElementById('prevMonth').addEventListener('click', function() {
    calendar.prev();
    updateCalendarTitle();
  });
  document.getElementById('nextMonth').addEventListener('click', function() {
    calendar.next();
    updateCalendarTitle();
  });

  function updateCalendarTitle() {
    const d = calendar.getDate();
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    document.querySelector('.calendar-title').textContent = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }

  // === DROPDOWN PERFIL ===
  function initializeProfileDropdown() {
    const profilePic = document.getElementById('profile');
    const dropdownMenu = document.getElementById('dropdownMenu');
    let dropdownOverlay;

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
    if (profilePic) {
      profilePic.addEventListener('click', toggleDropdown);
    }

    if (dropdownOverlay) {
      dropdownOverlay.addEventListener('click', closeDropdown);
    }

    // Prevenir cierre al hacer click dentro del dropdown
    if (dropdownMenu) {
      dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Manejar items del dropdown
      const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
      dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {

          const text = item.querySelector('span').textContent;
          console.log(`Navegando a: ${text}`);
          
          // Aquí puedes agregar la navegación específica
          if (text === 'Cerrar Sesión') {
            console.log('Cerrando sesión...');
            // window.location.href = 'login.html';
          } else if (text === 'Mi Cuenta') {
            console.log('Navegando a Mi Cuenta');
            // window.location.href = 'mi-cuenta.html';
          } else if (text === 'Perfil') {
            window.location.href = 'perfilEstudiante.html';
          }
          
          closeDropdown();
        });
      });
    }
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
    
    if (progressCards.length <= 3) return;

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
      <div class="scroll-arrow"></div>
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

    scrollArrow.addEventListener('click', () => {
      if (currentPage < totalPages - 1) {
        scrollToPage(currentPage + 1);
      } else {
        scrollToPage(0);
      }
    });

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

  // ======= NUEVA FUNCIONALIDAD: NOTIFICACIONES MODERNAS =======
  const viewMoreBtn = document.getElementById('viewMoreNotifications');
  const hiddenNotifications = document.querySelectorAll('.hidden-notification');
  const notificationCount = document.querySelector('.notification-count');
  let isExpanded = false;

  // Función para mostrar/ocultar notificaciones
  function toggleNotifications() {
    const viewMoreText = viewMoreBtn.querySelector('.view-more-text');
    const viewMoreIcon = viewMoreBtn.querySelector('.view-more-icon');

    if (!isExpanded) {
      // Mostrar notificaciones ocultas
      hiddenNotifications.forEach((notification, index) => {
        setTimeout(() => {
          notification.classList.add('show');
        }, index * 100);
      });

      // Cambiar texto y estilo del botón
      viewMoreText.textContent = 'Ver menos';
      viewMoreBtn.classList.add('expanded', 'collapsed');
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
      viewMoreText.textContent = 'Ver más';
      viewMoreBtn.classList.remove('expanded', 'collapsed');
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

  // Manejar clicks en notificaciones individuales
  const allNotifications = document.querySelectorAll('.notification-item-modern');
  
  allNotifications.forEach((item, index) => {
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
      const title = this.querySelector('.notification-title').textContent;
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

  // Función para simular nuevas notificaciones (opcional)
  function simulateNewNotification() {
    const unreadCount = document.querySelectorAll('.notification-item-modern:not(.read)').length;
    if (unreadCount < 10) { // Limitar simulación
      // Encontrar una notificación leída y marcarla como no leída
      const readNotifications = document.querySelectorAll('.notification-item-modern.read');
      if (readNotifications.length > 0) {
        const randomRead = readNotifications[Math.floor(Math.random() * readNotifications.length)];
        randomRead.classList.remove('read');
        updateNotificationCount();
      }
    }
  }

  // Inicializar contador de notificaciones
  updateNotificationCount();

  // ------- Event Listeners Existentes -------
  document.getElementById('diplomados').addEventListener('click', function(){ setActiveNavItem('diplomados'); });
  document.getElementById('tutorias').addEventListener('click', function(){ setActiveNavItem('tutorias'); });
  document.getElementById('pagos').addEventListener('click', function(){ setActiveNavItem('pagos'); });
  document.getElementById('mensajes').addEventListener('click', function(){ setActiveNavItem('mensajes'); });
  document.getElementById('certificados').addEventListener('click', function(){ setActiveNavItem('certificados'); });
  
  // Event listeners condicionales para elementos que pueden no existir
  const configuracionElement = document.getElementById('configuracion');
  if (configuracionElement) {
    configuracionElement.addEventListener('click', function(){ setActiveNavItem('configuracion'); });
  }
  
  const miCuentaElement = document.getElementById('mi-cuenta');
  if (miCuentaElement) {
    miCuentaElement.addEventListener('click', function(){ setActiveNavItem('mi-cuenta');
     });
  }

  document.getElementById('web-fullstack').addEventListener('click', function(){ console.log('Web Full Stack'); });
  document.getElementById('data-science').addEventListener('click', function(){ console.log('Data Science'); });
  document.getElementById('cybersecurity').addEventListener('click', function(){ console.log('Cybersecurity'); });
  document.getElementById('ai-course').addEventListener('click', function(){ console.log('AI course'); });

  // Event listeners para notificaciones y otros elementos
  if (document.getElementById('recomendaciones')) {
    document.getElementById('recomendaciones').addEventListener('click', function(){ console.log('Recomendaciones'); });
  }
  if (document.getElementById('notificaciones-recientes')) {
    document.getElementById('notificaciones-recientes').addEventListener('click', function(){ console.log('Notificaciones'); });
  }

  document.getElementById('notifications').addEventListener('click', function(){
    console.log('Notification bell clicked');
    // Aquí podrías abrir un dropdown de notificaciones o navegar a la página de notificaciones
  });

  document.getElementById('chatbot').addEventListener('click', function(){ 
    console.log('Chatbot opened'); 
    // Aquí podrías abrir el chatbot
  });

  document.getElementById('search-input').addEventListener('input', function(e){
    console.log('Searching for:', e.target.value);
    // Aquí podrías implementar búsqueda en tiempo real
  });

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
});

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





    
// static/JS/student.js
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const contentArea = document.querySelector("main");

  if (!searchInput) {
    console.warn("student.js: #search-input no encontrado");
    return;
  }
  if (!contentArea) {
    console.warn("student.js: <main> no encontrado");
    return;
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function removeHighlights() {
    const highlights = contentArea.querySelectorAll("span.highlight");
    highlights.forEach(span => {
      // Reemplazamos cada <span> por su contenido textual y normalizamos
      const textNode = document.createTextNode(span.textContent);
      const parent = span.parentNode;
      parent.replaceChild(textNode, span);
      parent.normalize();
    });
    contentArea.normalize();
  }

  function isExcludedNode(node) {
    // True si el nodo está dentro de secciones que queremos IGNORAR
    if (!node || !node.parentElement) return true;
    return !!node.parentElement.closest(
      ".welcome-calendar, .calendar-card, #calendar, #profile, .profile-pic, header"
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

    // Reemplazamos nodos de texto por fragmentos con <span.highlight>
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
        span.textContent = text.slice(start, end); // NO insertar HTML, solo texto
        frag.appendChild(span);
        matches.push(span);
        lastIndex = end;
        // Previene loops infinitos en algunos motores
        if (regex.lastIndex === m.index) regex.lastIndex++;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      node.parentNode.replaceChild(frag, node);
    }

    if (matches.length === 0) return;

    // Esperar al próximo frame para que el navegador calcule layout correcto
    requestAnimationFrame(() => {
      try {
        // Posición actual del scroll (top de la ventana)
        const currentScroll = window.scrollY;

        // Buscamos la PRIMERA coincidencia que esté *por debajo* del viewport actual (siguiente)
        let nextMatch = matches.find(sp => {
          const spTop = sp.getBoundingClientRect().top + window.scrollY;
          return spTop > currentScroll + 5; // +5 px de margen
        });

        // Si no hay coincidencia por debajo (p. ej. ya pasaste todas), usar la primer coincidencia
        if (!nextMatch) nextMatch = matches[0];

        // Calcular posición objetivo: centramos la coincidencia en la pantalla
        const rect = nextMatch.getBoundingClientRect();
        const matchTop = rect.top + window.scrollY;
        let targetTop = Math.round(matchTop - (window.innerHeight / 2));

        // Asegurar que targetTop esté dentro de límites válidos
        targetTop = Math.max(0, Math.min(targetTop, document.documentElement.scrollHeight - window.innerHeight));

        // Ejecutar el scroll suave
        window.scrollTo({ top: targetTop, behavior: "smooth" });

        // Mantener foco en input (útil en móviles para seguir escribiendo)
        searchInput.focus();
      } catch (err) {
        console.error("student.js: error al desplazar a la coincidencia", err);
      }
    });
  });
});
