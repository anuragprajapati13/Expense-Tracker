// landing.js - Landing page interactive features

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll to sections
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add scroll effect to navbar
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.7)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Animate stat numbers on scroll
    const animateNumbers = (element) => {
        const target = parseInt(element.textContent);
        const increment = target / 50;
        let current = 0;

        const step = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                setTimeout(step, 30);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        step();
    };

    // Intersection Observer for stat animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('stat-box')) {
                const h3 = entry.target.querySelector('h3');
                if (h3 && h3.textContent.match(/\d/)) {
                    animateNumbers(h3);
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-box').forEach(box => {
        observer.observe(box);
    });

    // Parallax effect for background elements
    window.addEventListener('mousemove', function(e) {
        const cards = document.querySelectorAll('.dashboard-preview');
        const x = (window.innerWidth - e.clientX * 2) / 100;
        const y = (window.innerHeight - e.clientY * 2) / 100;

        cards.forEach(card => {
            card.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg)`;
        });
    });

    // Reset perspective on mouse leave
    document.addEventListener('mouseleave', function() {
        const cards = document.querySelectorAll('.dashboard-preview');
        cards.forEach(card => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    });
});