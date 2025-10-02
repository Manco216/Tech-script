document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });
    
    // Animate stats on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }
    
    function animateStats() {
        const statItems = document.querySelectorAll('.stat-item strong');
        statItems.forEach(stat => {
            const finalValue = stat.textContent;
            const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));
            const suffix = finalValue.replace(/[\d,]/g, '');
            let currentValue = 0;
            const increment = numericValue / 50;
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= numericValue) {
                    stat.textContent = finalValue;
                    clearInterval(timer);
                } else {
                    const displayValue = Math.floor(currentValue);
                    if (displayValue >= 1000) {
                        stat.textContent = (displayValue / 1000).toFixed(1) + 'k' + suffix.replace(/k/g, '').replace(/\+/g, '+');
                    } else {
                        stat.textContent = displayValue + suffix;
                    }
                }
            }, 50);
        });
    }
    
    // Category cards hover effect
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Testimonials carousel (if you want to add auto-slide)
    let currentTestimonial = 0;
    const testimonials = document.querySelectorAll('.testimonial-card');
    
    function rotateTestimonials() {
        testimonials.forEach((testimonial, index) => {
            testimonial.style.opacity = index === currentTestimonial ? '1' : '0.7';
            testimonial.style.transform = index === currentTestimonial ? 'scale(1.05)' : 'scale(1)';
        });
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    }
    
    if (testimonials.length > 0) {
        setInterval(rotateTestimonials, 4000);
        rotateTestimonials(); // Initial call
    }
    
    // Add loading animation for cards
    const cards = document.querySelectorAll('.category-card, .info-card, .testimonial-card');
    const cardObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        cardObserver.observe(card);
    });
});

// Utility function for smooth scrolling to sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Form handling (for future contact forms)
function handleFormSubmit(event) {
    event.preventDefault();
    // Add your form handling logic here
    console.log('Form submitted');
}

// Add some interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Floating elements animation
    const floatingElements = document.querySelectorAll('.float-element');
    floatingElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 2}s`;
    });
    
    // Add click handlers for job cards
    const jobCards = document.querySelectorAll('.job-card');
    jobCards.forEach(card => {
        card.addEventListener('click', function() {
            // Here you would typically redirect to job details
            console.log('Job card clicked:', this);
        });
    });
});