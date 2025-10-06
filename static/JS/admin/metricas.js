document.addEventListener('DOMContentLoaded', function() {
  // Estados
  let autoRefresh = true;
  let refreshInterval;

  // Elementos del DOM

  const autoRefreshToggle = document.getElementById('autoRefresh');
  const refreshBtn = document.getElementById('refreshBtn');
  const lastUpdateTime = document.getElementById('lastUpdateTime');

  // Inicializar
  init();

  function init() {
    setupEventListeners();
    loadMetrics(); // Carga inicial
    setupAutoRefresh();
  }

  function setupEventListeners() {
    autoRefreshToggle.addEventListener('change', function() {
      autoRefresh = this.checked;
      setupAutoRefresh();
    });

    refreshBtn.addEventListener('click', function() {
      loadMetrics();
      // Animación del botón
      const icon = this.querySelector('i');
      icon.style.transition = 'transform 0.6s ease';
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
        loadMetrics();
      }, 10000); // 10 segundos
    }
  }

  // Función principal: cargar métricas desde el backend
  async function loadMetrics() {
    try {
      const response = await fetch('/admin/metricas/data');
      if (!response.ok) throw new Error('Error al cargar métricas');
      
      const data = await response.json();
      
      // Actualizar todas las secciones
      updateSystemMetrics(data.sistema);
      updateUserMetrics(data.usuarios);
      updateEngagementMetrics(data.engagement);
      updateConversionFunnel(data.conversiones);
      updateContentAnalysis(data.contenido);
      updateAlerts(data.alertas);
      updateLastUpdateTime();
      
      console.log('Métricas actualizadas correctamente');
    } catch (error) {
      console.error('Error cargando métricas:', error);
      showNotification('Error al cargar métricas', 'error');
    }
  }




  function updateSystemMetrics(sistema) {
    // Actualizar métricas del sistema
    document.getElementById('errorValue').textContent = sistema.errores + '%';
    document.getElementById('cargaValue').textContent = sistema.carga + '%';
    
    // Actualizar barra de progreso de carga
    const cargaProgress = document.querySelector('.metric-card:nth-child(2) .progress-fill');
    if (cargaProgress) {
      cargaProgress.style.width = sistema.carga + '%';
    }
  }

  function updateUserMetrics(usuarios) {
    // Actualizar métricas de usuarios con animación
    animateValue('usersOnline', usuarios.online);
    animateValue('dauValue', usuarios.dau);
    animateValue('wauValue', usuarios.wau);
    animateValue('mauValue', usuarios.mau);
  }

  function updateEngagementMetrics(engagement) {
    const container = document.getElementById('engagementMetrics');
    container.innerHTML = `
      <div class="engagement-item">
        <span class="item-label">Sesiones totales</span>
        <span class="item-value">${engagement.sesiones.toLocaleString()}</span>
      </div>
      <div class="engagement-item">
        <span class="item-label">Duración promedio</span>
        <span class="item-value">${engagement.duracionPromedio} min</span>
      </div>
      <div class="engagement-item">
        <span class="item-label">Páginas por sesión</span>
        <span class="item-value">${engagement.paginasPorSesion}</span>
      </div>
      <div class="engagement-item">
        <div>
          <div class="item-label">Tasa de rebote</div>
          <div class="progress-bar" style="margin-top: 0.5rem;">
            <div class="progress-fill" style="width: ${engagement.tasaRebote}%"></div>
          </div>
        </div>
        <span class="item-value">${engagement.tasaRebote}%</span>
      </div>
    `;
  }

  function updateConversionFunnel(conversiones) {
    const container = document.getElementById('conversionFunnel');
    const visitantesPercent = 100;
    const registrosPercent = (conversiones.registros / conversiones.visitantes) * 100 || 0;
    const comprasPercent = (conversiones.compras / conversiones.visitantes) * 100 || 0;

    container.innerHTML = `
      <div class="conversion-item">
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="item-label">Visitantes</span>
            <span class="item-value">${conversiones.visitantes.toLocaleString()}</span>
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
            <span class="item-value">${conversiones.registros.toLocaleString()}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${registrosPercent.toFixed(1)}%"></div>
          </div>
        </div>
      </div>
      <div class="conversion-item">
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="item-label">Compras</span>
            <span class="item-value">${conversiones.compras}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${comprasPercent.toFixed(1)}%"></div>
          </div>
        </div>
      </div>
      <div class="conversion-item" style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
        <span class="item-label">Tasa de conversión total</span>
        <span class="item-value text-success">${conversiones.tasaConversion}%</span>
      </div>
    `;
  }

function updateContentAnalysis(contenido) {
  const container = document.getElementById('contentAnalysis');
  if (!container) return;

  let html = '';

  contenido.forEach(item => {
    html += `
      <div class="content-item">
        <div class="content-header">
          <span class="item-label">${item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</span>
          <div class="item-stats">
            <span class="item-value">${item.valor}</span>
            <span class="item-description">${item.engagement}% engagement</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${item.engagement}%"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}


  function updateAlerts(alertas) {
    const alertsList = document.getElementById('alertsList');
    
    if (!alertas || alertas.length === 0) {
      alertsList.innerHTML = '<p class="no-alerts">✅ No hay alertas críticas en este momento</p>';
      return;
    }

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

  function updateLastUpdateTime() {
    const now = new Date();
    lastUpdateTime.textContent = now.toLocaleTimeString('es-ES');
  }

  // Utilidades
  function animateValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
    const increment = (newValue - currentValue) / 20;
    let current = currentValue;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= newValue) || (increment < 0 && current <= newValue)) {
        element.textContent = newValue.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current).toLocaleString();
      }
    }, 30);
  }

  function getAlertIcon(tipo) {
    switch (tipo) {
      case "warning":
        return "fas fa-exclamation-triangle text-warning";
      case "error":
        return "fas fa-times-circle text-danger";
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

  function showNotification(message, type = 'info') {
    // Sistema de notificaciones simple
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-left: 4px solid ${type === 'error' ? '#ef4444' : '#3b82f6'};
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Cleanup al salir de la página
  window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R para refresh manual
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      loadMetrics();
    }
  });

  console.log('Dashboard de Métricas inicializado correctamente');
});