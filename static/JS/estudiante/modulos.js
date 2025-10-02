// ../assets/JS/modulos.js
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Helpers ---------- */
  const storageKey = 'techscript_course_progress_v1';

  function safeGetSaved() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch (err) {
      return null;
    }
  }
  function safeSetSaved(obj) {
    try { localStorage.setItem(storageKey, JSON.stringify(obj)); }
    catch (err) { /* ignore */ }
  }

  function setLessonState(lesson, state) {
    if (!lesson) return;
    const statusDiv = lesson.querySelector('.lesson-status');

    lesson.classList.remove('completed','in-progress','pending');
    if (state === 'completed') lesson.classList.add('completed');
    else if (state === 'in-progress') lesson.classList.add('in-progress');
    else lesson.classList.add('pending');

    if (statusDiv) {
      if (state === 'completed') statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Completado';
      else if (state === 'in-progress') statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> En progreso';
      else statusDiv.innerHTML = '<i class="fas fa-clock"></i> Pendiente';

      const icon = statusDiv.querySelector('i');
      if (icon) {
        if (state === 'completed') icon.style.color = '#10b981';
        else if (state === 'in-progress') icon.style.color = '#f59e0b';
        else icon.style.color = '#94a3b8';
      }
    }
  }
// Botón de compra
const buyBtn = document.querySelector('.buy-course-btn');

if(buyBtn){
    buyBtn.addEventListener('click', () => {
        const courseTitle = document.getElementById('course-title').innerText;
        const coursePrice = 29; // O el precio dinámico si lo tienes

        // Guardamos el curso seleccionado
        localStorage.setItem('selectedCourse', JSON.stringify({ title: courseTitle, price: coursePrice }));

        // Redirigimos a pagos
        window.location.href = 'pagos.html';
    });
}

  /* ---------- Restaurar progreso guardado (si hay) ---------- */
  const saved = safeGetSaved();
  if (saved && saved.firstLessonId) {
    const savedEl = document.getElementById(saved.firstLessonId);
    if (savedEl) setLessonState(savedEl, saved.status || 'in-progress');
  }

  /* ---------- Accordion (módulos) ---------- */
  const headerSelector = '.module-header, .module-title, .collapsible';
  const headers = Array.from(document.querySelectorAll(headerSelector));

  headers.forEach(header => {
    if (!header.getAttribute('role')) header.setAttribute('role', 'button');

    header.addEventListener('click', () => {
      let content = header.nextElementSibling && header.nextElementSibling.classList.contains('lesson-list')
        ? header.nextElementSibling
        : header.parentElement ? header.parentElement.querySelector('.lesson-list') : null;
      const toggleIcon = header.querySelector('.toggle-icon');
      if (!content) return;

      // Ya NO cerramos otros; permitimos múltiples abiertos
      const willOpen = !content.classList.contains('open') && !content.classList.contains('active');
      content.classList.toggle('open', willOpen);
      content.classList.toggle('active', willOpen);

      if (willOpen) {
        // set exact height para animación suave
        content.style.maxHeight = content.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
        if (toggleIcon) toggleIcon.classList.add('rotated');
      } else {
        content.style.maxHeight = null;
        header.setAttribute('aria-expanded', 'false');
        if (toggleIcon) toggleIcon.classList.remove('rotated');
      }
    });

    // inicializar si ya tenía aria-expanded="true"
    if (header.getAttribute('aria-expanded') === 'true') {
      let content = header.nextElementSibling && header.nextElementSibling.classList.contains('lesson-list')
        ? header.nextElementSibling
        : header.parentElement ? header.parentElement.querySelector('.lesson-list') : null;
      if (content) {
        content.classList.add('open','active');
        content.style.maxHeight = content.scrollHeight + 'px';
        const toggleIcon = header.querySelector('.toggle-icon');
        if (toggleIcon) toggleIcon.classList.add('rotated');
      }
    }
  });

  /* ---------- Colorear icons de stats ---------- */
  const statsColorMap = {
    'fa-signal': '#7c3aed',
    'fa-video':  '#ef4444',
    'fa-clock':  '#3b82f6',
    'fa-bolt':   '#f59e0b'
  };
  document.querySelectorAll('.course-stats .stat i').forEach(icon => {
    Object.keys(statsColorMap).forEach(cls => {
      if (icon.classList.contains(cls)) icon.style.color = statsColorMap[cls];
    });
  });

  /* ---------- Normalizar estados de lecciones en la carga ---------- */
  document.querySelectorAll('.lesson-item').forEach(lesson => {
    // si el HTML trae data-status lo respetamos, si no inferimos por clases
    const status = lesson.dataset.status
      || (lesson.classList.contains('completed') ? 'completed'
        : (lesson.classList.contains('in-progress') ? 'in-progress' : 'pending'));
    setLessonState(lesson, status);
  });

  /* ---------- Botón "Empezar Curso" (start-course-btn) ---------- */
  const startBtn = document.getElementById('start-course-btn');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      // marca la primera lección como "en progreso" y guarda en localStorage
      const firstLesson = document.querySelector('.lesson-item');
      if (firstLesson) {
        // actualizamos visualmente
        setLessonState(firstLesson, 'in-progress');

        // guardamos para que la vista siguiente pueda restaurarlo
        safeSetSaved({
          firstLessonId: firstLesson.id || null,
          status: 'in-progress',
          timestamp: Date.now()
        });
      }

      // Si es <a> con href permitimos la navegación normal para que el navegador
      // vaya a clases.html inmediatamente (no hacemos preventDefault).
      if (startBtn.tagName === 'A' && startBtn.getAttribute('href')) {
        return;
      }

      // Si fuera <button> (sin href), hacemos redirect manual
      e.preventDefault();
      window.location.href = startBtn.getAttribute('href') || 'clases.html';
    });
  }

  /* ---------- Botón "Continuar sin costo" (si existiera) ---------- */
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', (e) => {
      // si existe, guardamos progreso opcionalmente y permitimos navegación si es <a>
      const firstLesson = document.querySelector('.lesson-item');
      if (firstLesson) {
        setLessonState(firstLesson, 'in-progress');
        safeSetSaved({ firstLessonId: firstLesson.id || null, status: 'in-progress', timestamp: Date.now() });
      }

      if (continueBtn.tagName === 'A' && continueBtn.getAttribute('href')) return;

      e.preventDefault();
      window.location.href = continueBtn.getAttribute('href') || 'clases.html';
    });
  }

  /* ---------- Ajuste de alturas al redimensionar ---------- */
  window.addEventListener('resize', () => {
    document.querySelectorAll('.lesson-list.open, .lesson-list.active').forEach(list => {
      list.style.maxHeight = list.scrollHeight + 'px';
    });
  });
});