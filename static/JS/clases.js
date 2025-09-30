document.addEventListener("DOMContentLoaded", () => {
  // ========= ELEMENTOS =========
  const progressFill = document.querySelector(".progress-fill");
  const playBtn = document.querySelector(".control-btn");
  const video = document.querySelector("video");
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const toggleSidebarTop = document.getElementById("toggleSidebarTop");
  const overlay = document.getElementById("overlay");

  // ========= VIDEO =========
  // Simulación de progreso
  let progress = 0;
  setInterval(() => {
    if (progress < 100) {
      progress += 1;
      progressFill.style.width = progress + "%";
    }
  }, 2000);

  // Play/Pause
  playBtn.addEventListener("click", () => {
    if (video.paused) {
      video.play();
      playBtn.textContent = "⏸";
    } else {
      video.pause();
      playBtn.textContent = "▶️";
    }
  });

  // ========= SIDEBAR =========
  function toggleSidebarState() {
    sidebar.classList.toggle("collapsed");
    if (!sidebar.classList.contains("collapsed")) {
      overlay.classList.add("active");
    } else {
      overlay.classList.remove("active");
    }
  }

  if (toggleSidebar) toggleSidebar.addEventListener("click", toggleSidebarState);
  if (toggleSidebarTop) toggleSidebarTop.addEventListener("click", toggleSidebarState);
  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.add("collapsed");
      overlay.classList.remove("active");
    });
  }
});
