document.addEventListener("DOMContentLoaded", () => {
  // ========= ELEMENTOS =========
  const progressFill = document.querySelector(".progress-fill");
  const playBtn = document.querySelector(".control-btn.play-pause");
  const video = document.querySelector("video");
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const toggleSidebarTop = document.getElementById("toggleSidebarTop");
  const overlay = document.querySelector(".sidebar-overlay");
  const profileDropdown = document.getElementById("profileDropdown");
  const dropdownMenu = document.getElementById("dropdownMenu");

  // ========= INICIALIZACIÓN =========
  initializeAnimations();
  initializeVideoControls();
  initializeSidebar();
  initializeProfileDropdown();
  initializeFileCards();
  initializeClassNavigation();

  // ========= ANIMACIONES DE ENTRADA =========
  function initializeAnimations() {
    // Animar elementos al cargar
    const elementsToAnimate = document.querySelectorAll('.header, .video-section, .materials-section, .comments-section');
    elementsToAnimate.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.6s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 150);
    });

    // El efecto de escritura del título ha sido eliminado
  }

  // ========= CONTROLES DE VIDEO =========
  function initializeVideoControls() {
    let progress = 0;
    let isPlaying = false;

    // Simulación de progreso mejorada
    const progressInterval = setInterval(() => {
      if (isPlaying && progress < 100) {
        progress += 0.5;
        updateProgress(progress);
      }
    }, 100);

    function updateProgress(percentage) {
      progressFill.style.width = percentage + "%";
      const thumb = document.querySelector('.progress-thumb');
      if (thumb) {
        thumb.style.left = percentage + "%";
      }
      
      // Actualizar tiempo
      const currentTime = document.querySelector('.current-time');
      const totalTime = document.querySelector('.total-time');
      if (currentTime && totalTime) {
        const current = Math.floor((percentage / 100) * 600); // 10 minutos = 600 segundos
        const minutes = Math.floor(current / 60);
        const seconds = current % 60;
        currentTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    // Play/Pause mejorado
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        const icon = playBtn.querySelector('i');
        
        if (isPlaying) {
          if (video) video.play();
          icon.classList.remove('fa-play');
          icon.classList.add('fa-pause');
          playBtn.style.background = 'var(--secondary-gradient)';
        } else {
          if (video) video.pause();
          icon.classList.remove('fa-pause');
          icon.classList.add('fa-play');
          playBtn.style.background = 'var(--primary-gradient)';
        }
        
        // Efecto ripple
        createRippleEffect(playBtn);
      });
    }

    // Control de volumen
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeFill = document.querySelector('.volume-fill');
    
    if (volumeSlider) {
      volumeSlider.addEventListener('click', (e) => {
        const rect = volumeSlider.getBoundingClientRect();
        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
        volumeFill.style.width = percentage + '%';
        
        if (video) {
          video.volume = percentage / 100;
        }
      });
    }

    // Control de velocidad
    const speedBtn = document.querySelector('.control-btn.speed');
    const speeds = ['0.5x', '1x', '1.25x', '1.5x', '2x'];
    let currentSpeedIndex = 1;
    
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
        speedBtn.textContent = speeds[currentSpeedIndex];
        
        if (video) {
          video.playbackRate = parseFloat(speeds[currentSpeedIndex]);
        }
        
        createRippleEffect(speedBtn);
      });
    }

    // Pantalla completa
    const fullscreenBtn = document.querySelector('.control-btn.fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (video) {
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
          }
        }
        createRippleEffect(fullscreenBtn);
      });
    }

    // Barra de progreso interactiva
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
        progress = Math.max(0, Math.min(100, percentage));
        updateProgress(progress);
        
        if (video) {
          video.currentTime = (percentage / 100) * video.duration;
        }
      });
    }
  }

  // ========= NAVEGACIÓN ENTRE CLASES =========
  function initializeClassNavigation() {
    const prevBtn = document.getElementById('prevClass');
    const nextBtn = document.getElementById('nextClass');
    const classNumber = document.querySelector('.class-number');
    
    // Simular datos de clases
    const totalClasses = 12;
    let currentClass = 1; // Obtener de la clase actual
    
    // Actualizar estado de los botones
    function updateNavigationButtons() {
      if (prevBtn) {
        prevBtn.disabled = currentClass <= 1;
      }
      if (nextBtn) {
        nextBtn.disabled = currentClass >= totalClasses;
      }
    }
    
    // Event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentClass > 1) {
          currentClass--;
          updateClassInfo(currentClass);
          createRippleEffect(prevBtn);
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentClass < totalClasses) {
          currentClass++;
          updateClassInfo(currentClass);
          createRippleEffect(nextBtn);
        }
      });
    }
    
    // Actualizar información de la clase
    function updateClassInfo(classNum) {
      if (classNumber) {
        classNumber.textContent = `Clase ${classNum}`;
      }
      updateNavigationButtons();
      showNotification(`Navegando a Clase ${classNum}`, 'info');
      
      // Aquí podrías agregar lógica para cargar el contenido real de la clase
      // Por ejemplo: loadClassContent(classNum);
    }
    
    // Inicializar
    updateNavigationButtons();
  }

  // ========= SIDEBAR =========
  function initializeSidebar() {
    function toggleSidebarState() {
      sidebar.classList.toggle("collapsed");
      
      // Animar navegación
      const navItems = sidebar.querySelectorAll('.nav-item');
      navItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.transform = sidebar.classList.contains('collapsed') 
            ? 'translateX(-10px)' 
            : 'translateX(0)';
        }, index * 50);
      });

      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
      }
    }

    if (toggleSidebar) {
      toggleSidebar.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSidebarState();
        createRippleEffect(toggleSidebar);
      });
    }

    if (toggleSidebarTop) {
      toggleSidebarTop.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSidebarState();
        createRippleEffect(toggleSidebarTop);
      });
    }

    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      });
    }

    // Efecto hover mejorado para nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        const ripple = item.querySelector('.icon-ripple');
        if (ripple) {
          ripple.style.opacity = '0.3';
          ripple.style.transform = 'scale(1)';
        }
      });

      item.addEventListener('mouseleave', () => {
        const ripple = item.querySelector('.icon-ripple');
        if (ripple) {
          ripple.style.opacity = '0';
          ripple.style.transform = 'scale(0)';
        }
      });

      item.addEventListener('click', () => {
        // Remover active de todos los items
        navItems.forEach(navItem => navItem.classList.remove('active'));
        // Agregar active al item clickeado
        item.classList.add('active');
        createRippleEffect(item);
      });
    });
  }

  // ========= DROPDOWN DE PERFIL =========
  function initializeProfileDropdown() {
    const profile = document.getElementById('profile');
    
    if (profile && profileDropdown && dropdownMenu) {
      profile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
        createRippleEffect(profile);
      });

      // Cerrar dropdown al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target)) {
          dropdownMenu.classList.remove('active');
        }
      });

      // Animar items del dropdown
      const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
      dropdownItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'translateX(5px)';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'translateX(0)';
        });
      });
    }
  }

  // ========= TARJETAS DE ARCHIVOS =========
  function initializeFileCards() {
    const fileCards = document.querySelectorAll('.file-card');
    
    fileCards.forEach(card => {
      // Efecto hover mejorado
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.boxShadow = 'var(--shadow-primary)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = 'var(--shadow-secondary)';
      });

      // Botones de acción
      const viewBtn = card.querySelector('.file-btn:first-child');
      const downloadBtn = card.querySelector('.file-btn:last-child');

      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          createRippleEffect(viewBtn);
          showNotification('Vista previa del archivo', 'info');
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          createRippleEffect(downloadBtn);
          simulateDownload(card);
        });
      }
    });

    // Botón descargar todo
    const downloadAllBtn = document.querySelector('.download-all-btn');
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        createRippleEffect(downloadAllBtn);
        simulateDownloadAll();
      });
    }
  }

  // ========= FUNCIONES AUXILIARES =========
  
  // Crear efecto ripple
  function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.zIndex = '9999';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';

    element.style.position = 'relative';
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Simular descarga
  function simulateDownload(fileCard) {
    const progressBar = fileCard.querySelector('.progress-fill');
    const fileName = fileCard.querySelector('h3').textContent;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        showNotification(`${fileName} descargado exitosamente`, 'success');
      }
      progressBar.style.width = progress + '%';
    }, 100);
  }

  // Simular descarga de todos los archivos
  function simulateDownloadAll() {
    const fileCards = document.querySelectorAll('.file-card');
    fileCards.forEach((card, index) => {
      setTimeout(() => {
        simulateDownload(card);
      }, index * 500);
    });
  }

  // Mostrar notificaciones
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      max-width: 350px;
      font-size: 0.9rem;
    `;

    switch (type) {
      case 'success':
        notification.style.background = 'var(--success-gradient)';
        break;
      case 'error':
        notification.style.background = 'var(--accent-gradient)';
        break;
      default:
        notification.style.background = 'var(--primary-gradient)';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Eliminar después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // ========= EFECTOS ADICIONALES =========
  
  // Parallax suave en scroll
  let ticking = false;
  function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.particle');
    
    parallaxElements.forEach((element, index) => {
      const speed = (index + 1) * 0.1;
      element.style.transform = `translateY(${scrolled * speed}px)`;
    });
    
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });

  // Efecto de glow en hover para botones importantes
  const glowButtons = document.querySelectorAll('.download-all-btn, .action-btn, .nav-class-btn');
  glowButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (btn.classList.contains('prev-btn')) {
        btn.style.boxShadow = '0 0 30px rgba(5, 150, 105, 0.6)';
      } else if (btn.classList.contains('next-btn')) {
        btn.style.boxShadow = '0 0 30px rgba(220, 38, 38, 0.6)';
      } else {
        btn.style.boxShadow = '0 0 30px rgba(37, 99, 235, 0.6)';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.boxShadow = '';
    });
  });

  // Efecto de loading para navegación entre clases
  function showClassLoadingEffect() {
    const videoContainer = document.querySelector('.video-container');
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(37, 99, 235, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius-xl);
      backdrop-filter: blur(10px);
      z-index: 1000;
    `;
    
    const loader = document.createElement('div');
    loader.innerHTML = `
      <div style="
        width: 60px;
        height: 60px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem auto;
      "></div>
      <p style="color: white; font-weight: 600; text-align: center;">Cargando clase...</p>
    `;
    
    overlay.appendChild(loader);
    videoContainer.appendChild(overlay);
    
    // Remover después de 1.5 segundos
    setTimeout(() => {
      if (videoContainer.contains(overlay)) {
        videoContainer.removeChild(overlay);
      }
    }, 1500);
  }

  // Agregar estilos de animación CSS dinámicamente
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: translate(-50%, -50%) scale(4);
        opacity: 0;
      }
    }
    
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .fade-in-scale {
      animation: fadeInScale 0.5s ease-out;
    }
  `;
  document.head.appendChild(style);

  // Funcionalidad de búsqueda en tiempo real
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.toLowerCase();
        if (query.length > 2) {
          showNotification(`Buscando: "${query}"`, 'info');
          // Aquí implementarías la lógica de búsqueda real
        }
      }, 500);
    });
  }

  // Gestión de teclado para accesibilidad
  document.addEventListener('keydown', (e) => {
    // Espaciadora para play/pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (playBtn) playBtn.click();
    }
    
    // Escape para cerrar dropdown
    if (e.key === 'Escape') {
      if (dropdownMenu && dropdownMenu.classList.contains('active')) {
        dropdownMenu.classList.remove('active');
      }
      if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
    }
    
    // Flechas para navegación entre clases
    if (e.key === 'ArrowLeft') {
      const prevBtn = document.getElementById('prevClass');
      if (prevBtn && !prevBtn.disabled) {
        prevBtn.click();
      }
    }
    
    if (e.key === 'ArrowRight') {
      const nextBtn = document.getElementById('nextClass');
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
      }
    }
  });

  // Detectar cambios en el tamaño de ventana para responsive
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Actualizar sidebar en dispositivos móviles
      if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
    }, 250);
  });

  // Inicialización de tooltips (opcional)
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  });

  function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    tooltip.style.cssText = `
      position: absolute;
      background: var(--bg-glass);
      border: var(--border-glass);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.8rem;
      color: var(--text-primary);
      backdrop-filter: blur(10px);
      z-index: 10001;
      pointer-events: none;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      white-space: nowrap;
      box-shadow: var(--shadow-secondary);
    `;

    document.body.appendChild(tooltip);

    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.bottom + 10 + 'px';

    setTimeout(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    }, 100);

    e.target._tooltip = tooltip;
  }

  function hideTooltip(e) {
    const tooltip = e.target._tooltip;
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 300);
    }
  }

  // Funciones para futuras integraciones
  window.classUtils = {
    showNotification,
    createRippleEffect,
    showClassLoadingEffect
  };

  console.log('🚀 Plataforma de clases cargada con éxito - Versión actualizada');
});