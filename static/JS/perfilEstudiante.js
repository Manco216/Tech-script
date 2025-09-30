document.addEventListener('DOMContentLoaded', function() {
    // Configuración del círculo de progreso
    const circle = document.getElementById('progressCircle');
    const totalPointsElement = document.getElementById('totalPoints');
    
    // Datos de puntos
    const pointsData = {
        total: 2450,
        maxPoints: 3000, // Máximo para el círculo completo
        breakdown: [
            { course: 'UX/UI Design - Básico', points: 500 },
            { course: 'UX/UI Design - Intermedio', points: 750 },
            { course: 'UX/UI Design - Avanzado', points: 1200 }
        ]
    };
    
    // Configurar el círculo de progreso
    function setupProgressCircle() {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference;
        
        // Calcular el progreso
        const progress = (pointsData.total / pointsData.maxPoints) * 100;
        const offset = circumference - (progress / 100) * circumference;
        
        // Animar el círculo
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 500);
    }
    
    // Animar contador de puntos
    function animatePointsCounter() {
        const duration = 2000; // 2 segundos
        const start = 0;
        const end = pointsData.total;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Función de easing
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);
            
            totalPointsElement.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    // Efectos hover para elementos interactivos
    function setupHoverEffects() {
        const courseItems = document.querySelectorAll('.course-item');
        const achievementItems = document.querySelectorAll('.achievement-item');
        const navItems = document.querySelectorAll('.nav-item');
        
        // Agregar efectos a los elementos del curso
        courseItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(10px)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(0)';
            });
        });
        
        // Agregar efectos a los logros
        achievementItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                const icon = this.querySelector('.achievement-icon');
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            });
            
            item.addEventListener('mouseleave', function() {
                const icon = this.querySelector('.achievement-icon');
                icon.style.transform = 'scale(1) rotate(0deg)';
            });
        });
        
        // Efectos para navegación
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remover active de todos los elementos
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Agregar active al elemento clickeado
                this.classList.add('active');
                
                // Efecto de ripple
                const ripple = document.createElement('div');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.3);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
    
    // Agregar animación de aparición
    function setupScrollAnimations() {
        const cards = document.querySelectorAll('.profile-card, .points-card, .courses-card, .achievements-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(card);
        });
    }
    
    // Función para actualizar puntos (simulación)
    function updatePoints(newPoints) {
        pointsData.total = newPoints;
        totalPointsElement.textContent = newPoints.toLocaleString();
        setupProgressCircle();
    }
    
    // Agregar CSS para animación de ripple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar todas las funciones
    setupProgressCircle();
    animatePointsCounter();
    setupHoverEffects();
    setupScrollAnimations();
    
    // Ejemplo de actualización de puntos (puedes llamar esto desde eventos)
    // setTimeout(() => updatePoints(2650), 5000);
});