document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const toggleSidebarTop = document.getElementById("toggleSidebarTop");

  // ====== ABRIR / CERRAR SIDEBAR ======
  function openSidebar() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  });

  toggleSidebarTop.addEventListener("click", () => {
    openSidebar();
  });

  overlay.addEventListener("click", () => {
    closeSidebar();
  });

  // ====== ANIMACIÓN DE TARJETA ======
  const weeklyCard = document.querySelector(".weekly-position-card");
  weeklyCard.style.opacity = "0";
  weeklyCard.style.transform = "translateY(30px)";
  
  setTimeout(() => {
    weeklyCard.style.transition = "all 0.8s ease";
    weeklyCard.style.opacity = "1";
    weeklyCard.style.transform = "translateY(0)";
  }, 400);

  // ====== ANIMACIÓN DE CONTADOR ======
  const counter = document.querySelector(".counter-number");
  const finalValue = parseInt(counter.textContent, 10);
  let current = 0;

  const interval = setInterval(() => {
    current++;
    counter.textContent = current;
    if (current >= finalValue) clearInterval(interval);
  }, 200);
});

