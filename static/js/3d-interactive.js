/* ========== 3D INTERACTIVE EFFECTS SCRIPT ========== */

document.addEventListener('DOMContentLoaded', function() {
    // Enable 3D perspective mouse tracking on cards
    const cards3D = document.querySelectorAll('.card-3d, .card-3d-deep, .stat-card, .budget-input-card');
    
    cards3D.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            
            // Calculate rotation based on mouse position
            const rotateX = (yPercent - 50) / 5;
            const rotateY = (xPercent - 50) / -5;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
            this.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
        
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'none';
        });
    });
    
    // Parallax effect on page scroll
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        const elements = document.querySelectorAll('[data-parallax]');
        
        elements.forEach(element => {
            const speed = element.getAttribute('data-parallax') || 0.5;
            element.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
    
    // Add stagger animation to elements
    const staggerElements = document.querySelectorAll('.animation-stagger-1, .animation-stagger-2, .animation-stagger-3, .animation-stagger-4, .animation-stagger-5');
    
    staggerElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Smooth page transitions
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href*="/"]');
        if (link && !link.target && !link.hasAttribute('data-no-transition')) {
            e.preventDefault();
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                window.location.href = link.href;
            }, 300);
        }
    });
    
    // Window load animation
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
        mainContainer.style.opacity = '0';
        mainContainer.style.animation = 'fadeIn 0.6s ease-out forwards';
    }
    
    // Enhanced button click feedback
    const buttons = document.querySelectorAll('.btn, .button-3d, .btn-primary, .btn-submit');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.position = 'absolute';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '1';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation if not exists
    if (!document.querySelector('style[data-ripple]')) {
        const style = document.createElement('style');
        style.setAttribute('data-ripple', 'true');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

/* 3D Parallax background effect */
document.addEventListener('DOMContentLoaded', function() {
    const parallaxBg = document.querySelector('[data-parallax-bg]');
    if (parallaxBg) {
        document.addEventListener('mousemove', function(e) {
            const x = (e.clientX / window.innerWidth) * 10 - 5;
            const y = (e.clientY / window.innerHeight) * 10 - 5;
            
            parallaxBg.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg)`;
        });
        
        document.addEventListener('mouseleave', function() {
            parallaxBg.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }
});

// Enhanced form validation with visual feedback
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', function(e) {
        const inputs = this.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ef4444';
                input.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
                isValid = false;
                
                setTimeout(() => {
                    input.style.borderColor = '';
                    input.style.boxShadow = '';
                }, 3000);
            }
        });
        
        if (!isValid) {
            e.preventDefault();
        }
    });
});

console.log('3D Interactive Effects loaded successfully!');
