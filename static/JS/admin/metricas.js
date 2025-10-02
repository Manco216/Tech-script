document.addEventListener('DOMContentLoaded', function() {
  // Estados y datos
  let autoRefresh = true;
  let refreshInterval;

  // Datos simulados (en una aplicación real vendrían de una API)
  const metricas = {
    sistema: {
      uptime: 99.8,
      latencia: 145,
      errores: 0.2,
      carga: 67,
    },
    usuarios: {
      online: 234,
      dau: 1247,
      wau: 5678,
      mau: 18934,
    },
    engagement: {
      sesiones: 8934,
      duracionPromedio: 24.5,
      paginasPorSesion: 5.7,
      tasaRebote: 23.4,
    },
    conversiones: {
      visitantes: 12456,
      registros: 1247,
      compras: 234,
      tasaConversion: 1.88,
    },
  };

  const alertas = [
    {
      id: 1,
      tipo: "warning",
      mensaje: "Latencia alta en servidor de base de datos",
      tiempo: "5 min ago",
      severidad: "Media",
    },
    {
      id: 2,
      tipo: "info",
      mensaje: "Nuevo pico de usuarios conectados",
      tiempo: "12 min ago",
      severidad: "Baja",
    },
    {
      id: 3,
      tipo: "success",
      mensaje: "Backup automático completado exitosamente",
      tiempo: "1 hora ago",
      severidad: "Info",
    },
  ];

  const datosContenido = [
    { tipo: "Videos", valor: 45678, engagement: 78.5, unidad: "vistas" },
    { tipo: "Documentos", valor: 12345, engagement: 65.2, unidad: "descargas" },
    { tipo: "Quizzes", valor: 8901, engagement: 82.1, unidad: "completados" },
    { tipo: "Proyectos", valor: 3456, engagement: 71.8, unidad: "enviados" },
  ];

  const datosDispositivos = [
    { dispositivo: "Desktop", usuarios: 8934, porcentaje: 67.2, icono: "fas fa-desktop" },
    { dispositivo: "Mobile", usuarios: 3456, porcentaje: 26.0, icono: "fas fa-mobile-alt" },
    { dispositivo: "Tablet", usuarios: 901, porcentaje: 6.8, icono: "fas fa-tablet-alt" },
  ];

  const datosGeograficos = [
    { pais: "Colombia", usuarios: 8934, porcentaje: 71.7 },
    { pais: "México", usuarios: 1234, porcentaje: 9.9 },
    { pais: "Argentina", usuarios: 987, porcentaje: 7.9 },
    { pais: "Chile", usuarios: 654, porcentaje: 5.2 },
    { pais: "Otros", usuarios: 678, porcentaje: 5.4 },
  ];

  // Elementos del DOM
  const autoRefreshToggle = document.getElementById('autoRefresh');
  const refreshBtn = document.getElementById('refreshBtn');
  const lastUpdateTime = document.getElementById('lastUpdateTime');

  // Inicializar
  init();

  function init() {
    setupEventListeners();
    renderAlerts();
    renderEngagementMetrics();
    renderConversionFunnel();
    renderContentAnalysis();
    renderDeviceDistribution();
    renderGeographicDistribution();
    updateLastUpdateTime();
    setupAutoRefresh();
  }

  function setupEventListeners() {
    autoRefreshToggle.addEventListener('change', function() {
      autoRefresh = this.checked;
      setupAutoRefresh();
    });

    refreshBtn.addEventListener('click', function() {
      refreshData();
      // Animación del botón
      const icon = this.querySelector('i');
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        icon.style.transform = 'rotate(0deg)';
      }, 600);
    });
  }

  function setupAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        refreshData();
      }, 30000); // 30 segundos
    }
  }

  function refreshData() {
    // Simular pequeños cambios en los datos
    simulateDataChanges();
    updateMetrics();
    updateLastUpdateTime();
  }

  function simulateDataChanges() {
    // Simular cambios pequeños en las métricas
    metricas.usuarios.online += Math.floor(Math.random() * 10) - 5;
    metricas.sistema.latencia += Math.floor(Math.random() * 20) - 10;
    metricas.sistema.carga += Math.floor(Math.random() * 6) - 3;
    
    // Mantener valores en rangos razonables
    metricas.usuarios.online = Math.max(200, Math.min(300, metricas.usuarios.online));
    metricas.sistema.latencia = Math.max(100, Math.min(200, metricas.sistema.latencia));
    metricas.sistema.carga = Math.max(50, Math.min(90, metricas.sistema.carga));
  }

  function updateMetrics() {
    // Actualizar valores en tiempo real
    document.getElementById('usersOnline').textContent = metricas.usuarios.online;
    document.getElementById('latenciaValue').textContent = metricas.sistema.latencia + 'ms';
    document.getElementById('cargaValue').textContent = metricas.sistema.carga + '%';
    
    // Actualizar barra de progreso de carga
    const cargaProgress = document.querySelector('.progress-fill');
    if (cargaProgress) {
      cargaProgress.style.width = metricas.sistema.carga + '%';
    }
  }

  function updateLastUpdateTime() {
    const now = new Date();
    lastUpdateTime.textContent = now.toLocaleTimeString();
  }

  function renderAlerts() {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    alertas.forEach(alerta => {
      const alertItem = document.createElement('div');
      alertItem.className = 'alert-item';
      
      const iconClass = getAlertIcon(alerta.tipo);
      const badgeClass = getAlertBadgeClass(alerta.severidad);
      
      alertItem.innerHTML = `
        <div class="alert-info">
          <i class="${iconClass} alert-icon"></i>
          <div>
            <div class="alert-message">${alerta.mensaje}</div>
            <div class="alert-time">${alerta.tiempo}</div>
          </div>
        </div>
        <div class="alert-badge ${badgeClass}">${alerta.severidad}</div>
      `;
      
      alertsList.appendChild(alertItem);
    });
  }

  function renderEngagementMetrics() {
    const container = document.getElementById('engagementMetrics');
    container.innerHTML = `
      <div class="engagement-item">
        <span class="item-label">Sesiones totales</span>
        <span class="item-value">${metricas.engagement.sesiones.toLocaleString()}</span>
      </div>
      <div class="engagement-item">
        <span class="item-label">Duración promedio</span>
        <span class="item-value">${metricas.engagement.duracionPromedio} min</span>
      </div>
      <div class="engagement-item">
        <span class="item-label">Páginas por sesión</span>
        <span class="item-value">${metricas.engagement.paginasPorSesion}</span>
      </div>
      <div class="engagement-item">
        <div>
          <div class="item-label">Tasa de rebote</div>
          <div class="progress-bar" style="margin-top: 0.5rem;">
            <div class="progress-fill" style="width: ${metricas.engagement.tasaRebote}%"></div>
          </div>
        </div>
        <span class="item-value">${metricas.engagement.tasaRebote}%</span>
      </div>
    `;
  }

  function renderConversionFunnel() {
    const container = document.getElementById('conversionFunnel');
    const visitantesPercent = 100;
    const registrosPercent = (metricas.conversiones.registros / metricas.conversiones.visitantes) * 100;
    const comprasPercent = (metricas.conversiones.compras / metricas.conversiones.visitantes) * 100;

    container.innerHTML = `
      <div class="conversion-item">
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="item-label">Visitantes</span>
            <span class="item-value">${metricas.conversiones.visitantes.toLocaleString()}</span>
          </div>
          <div class="progress-bar">
          <div class="progress-fill" style="width: 100%"></div>
          </div>
        </div>
      </div>
      <div class="conversion-item">
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="item-label">Registros</span>
            <span class="item-value">${metricas.conversiones.registros.toLocaleString()}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${registrosPercent}%"></div>
          </div>
        </div>
      </div>
      <div class="conversion-item">
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="item-label">Compras</span>
            <span class="item-value">${metricas.conversiones.compras}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${comprasPercent}%"></div>
          </div>
        </div>
      </div>
      <div class="conversion-item" style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
        <span class="item-label">Tasa de conversión total</span>
        <span class="item-value text-success">${metricas.conversiones.tasaConversion}%</span>
      </div>
    `;
  }

  function renderContentAnalysis() {
    const container = document.getElementById('contentAnalysis');
    let html = '';

    datosContenido.forEach(item => {
      html += `
        <div class="content-item">
          <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span class="item-label">${item.tipo}</span>
              <div style="text-align: right;">
                <div class="item-value">${item.valor.toLocaleString()}</div>
                <div class="item-description">${item.engagement}% engagement</div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.engagement}%"></div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderDeviceDistribution() {
    const container = document.getElementById('deviceDistribution');
    let html = '';

    datosDispositivos.forEach(item => {
      html += `
        <div class="device-item">
          <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="${item.icono} device-icon"></i>
                <span class="item-label">${item.dispositivo}</span>
              </div>
              <span class="item-value">${item.usuarios.toLocaleString()}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.porcentaje}%"></div>
            </div>
            <div class="item-description" style="text-align: right; margin-top: 0.25rem;">
              ${item.porcentaje}% del total
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderGeographicDistribution() {
    const container = document.getElementById('geographicDistribution');
    let html = '';

    datosGeograficos.forEach(dato => {
      html += `
        <div class="geo-item">
          <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center;">
                <div class="geo-dot"></div>
                <span class="item-label">${dato.pais}</span>
              </div>
              <span class="item-value">${dato.usuarios.toLocaleString()} usuarios</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${dato.porcentaje}%"></div>
            </div>
            <div class="item-description" style="text-align: right; margin-top: 0.25rem;">
              ${dato.porcentaje}% del tráfico total
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function getAlertIcon(tipo) {
    switch (tipo) {
      case "warning":
        return "fas fa-exclamation-triangle text-warning";
      case "error":
        return "fas fa-exclamation-triangle text-danger";
      case "success":
        return "fas fa-check-circle text-success";
      default:
        return "fas fa-info-circle text-primary";
    }
  }

  function getAlertBadgeClass(severidad) {
    switch (severidad) {
      case "Alta":
        return "high";
      case "Media":
        return "medium";
      case "Baja":
        return "low";
      case "Info":
        return "info";
      default:
        return "info";
    }
  }

  // Cleanup al salir de la página
  window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // Funciones para simular datos en tiempo real más realistas
  function generateRealisticData() {
    const now = new Date();
    const hour = now.getHours();
    
    // Simular patrones de uso según la hora del día
    let baseUsers = 200;
    if (hour >= 9 && hour <= 17) {
      baseUsers = 300; // Horario laboral, más usuarios
    } else if (hour >= 19 && hour <= 22) {
      baseUsers = 250; // Horario vespertino
    }
    
    // Agregar variación aleatoria
    metricas.usuarios.online = baseUsers + Math.floor(Math.random() * 100) - 50;
    
    // Simular latencia variable
    metricas.sistema.latencia = 120 + Math.floor(Math.random() * 80);
    
    // Simular carga del sistema
    metricas.sistema.carga = 50 + Math.floor(Math.random() * 40);
  }

  // Efectos visuales adicionales
  function addVisualEffects() {
    // Animación de números que cambian
    const animateNumber = (element, newValue, suffix = '') => {
      const currentValue = parseInt(element.textContent.replace(/[^\d]/g, ''));
      const increment = (newValue - currentValue) / 20;
      let current = currentValue;
      
      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= newValue) || (increment < 0 && current <= newValue)) {
          element.textContent = newValue.toLocaleString() + suffix;
          clearInterval(timer);
        } else {
          element.textContent = Math.round(current).toLocaleString() + suffix;
        }
      }, 50);
    };
    
    // Aplicar animaciones a elementos específicos
    const usersOnlineEl = document.getElementById('usersOnline');
    if (usersOnlineEl) {
      const newValue = metricas.usuarios.online;
      animateNumber(usersOnlineEl, newValue);
    }
  }

  // Notification system para alertas importantes
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Agregar estilos para notificaciones si no existen
    if (!document.querySelector('.notification-styles')) {
      const style = document.createElement('style');
      style.className = 'notification-styles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border-left: 4px solid;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 300px;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        }
        .notification.warning { border-left-color: #f59e0b; }
        .notification.info { border-left-color: #3b82f6; }
        .notification.success { border-left-color: #10b981; }
        .notification-content { display: flex; align-items: center; gap: 0.5rem; }
        .notification-close { background: none; border: none; cursor: pointer; padding: 0.25rem; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Monitoreo de thresholds críticos
  function checkCriticalThresholds() {
    if (metricas.sistema.latencia > 180) {
      showNotification('Latencia alta detectada: ' + metricas.sistema.latencia + 'ms', 'warning');
    }
    
    if (metricas.sistema.carga > 85) {
      showNotification('Carga del sistema crítica: ' + metricas.sistema.carga + '%', 'warning');
    }
    
    if (metricas.usuarios.online > 280) {
      showNotification('Nuevo pico de usuarios: ' + metricas.usuarios.online + ' online', 'info');
    }
  }

  // Integrar verificación de thresholds con refresh
  const originalRefreshData = refreshData;
  refreshData = function() {
    originalRefreshData();
    checkCriticalThresholds();
    addVisualEffects();
  };

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R para refresh manual
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      refreshData();
    }
    
    // Ctrl/Cmd + Space para toggle auto-refresh
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      autoRefreshToggle.checked = !autoRefreshToggle.checked;
      autoRefresh = autoRefreshToggle.checked;
      setupAutoRefresh();
    }
  });

  // Touch gestures para móviles
  let touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
  });

  document.addEventListener('touchend', function(e) {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    
    // Pull to refresh - swipe down desde la parte superior
    if (diff < -100 && touchStartY < 100) {
      refreshData();
      showNotification('Datos actualizados', 'success');
    }
  });

  // Inicialización final
  console.log('Dashboard de Métricas inicializado correctamente');
  showNotification('Dashboard cargado correctamente', 'success');
});