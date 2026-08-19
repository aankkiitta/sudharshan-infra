
    // ============================================================
    // LOAD PORTFOLIO PROJECTS
    // ============================================================
    async function loadPortfolio() {
        try {
            const response = await fetch("./projects.json");
            const projects = await response.json();
            console.log(projects);

            const grid = document.getElementById("portfolioGrid");
            if (!grid) return;

            grid.innerHTML = "";

            projects.slice(0, 6).forEach(project => {
                grid.innerHTML += `
                    <div class="portfolio-item" data-category="${project.category}">
                        <img src="${project.image}" alt="${project.title}">
                        <div class="portfolio-overlay">
                            <h3>${project.title}</h3>
                            <p>${project.category}</p>
                        </div>
                    </div>
                `;
            });

        } catch (err) {
            console.error("Portfolio Load Error:", err);
        }
    }

    // ============================================================
    // LOADER
    // ============================================================
    window.addEventListener('load', function() {
        const loader = document.getElementById('loader');
        if (loader) {
            setTimeout(function() {
                loader.style.opacity = '0';
                loader.style.visibility = 'hidden';
            }, 400);
        }
        initReveal();
        initPortfolioFilters();
        initTestimonialSlider();
        initMobilePortfolio();
        checkLoginState();
        loadPortfolio();
       
    });



async function loadTestimonials() {
    const response = await fetch("testimonials.html");
    const html = await response.text();

    const container = document.getElementById("testimonials");
    container.innerHTML = html;

    // Run scripts
    container.querySelectorAll("script").forEach(oldScript => {
        const script = document.createElement("script");

        if (oldScript.src) {
            script.src = oldScript.src;
        } else {
            script.textContent = oldScript.textContent;
        }

        document.body.appendChild(script);
        oldScript.remove();
    });
}

loadTestimonials();

    // ============================================================
    // SCROLL REVEAL
    // ============================================================
    function initReveal() {
        const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        els.forEach(function(el) {
            observer.observe(el);
        });
    }

    // ============================================================
    // HEADER SCROLL
    // ============================================================
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add('scrolled');
            if (scrollY > lastScrollY && scrollY > 200) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
        } else {
            header.classList.remove('scrolled');
            header.classList.remove('hidden');
        }
        lastScrollY = scrollY;
    });

    // ============================================================
    // MOBILE MENU — slides from left
    // ============================================================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const icon = hamburger ? hamburger.querySelector('i') : null;

    if (hamburger && icon) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.nav-links a').forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
                document.body.style.overflow = '';
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
                document.body.style.overflow = '';
            }
        });
    }

    // ============================================================
    // ACTIVE NAV LINK
    // ============================================================
    const sections = document.querySelectorAll('section[id]');
    const allNavLinks = document.querySelectorAll('.nav-links a');

    function updateActiveNav() {
        let current = 'hero';
        sections.forEach(function(section) {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.id;
            }
        });
        allNavLinks.forEach(function(link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    window.addEventListener('load', updateActiveNav);

    // ============================================================
    // PORTFOLIO FILTERS
    // ============================================================
    function initPortfolioFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const portfolioItems = document.querySelectorAll('.portfolio-item');

        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');

                const filter = this.getAttribute('data-filter');

                portfolioItems.forEach(function(item) {
                    const category = item.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        item.style.display = 'block';
                        item.classList.remove('show-overlay');
                        setTimeout(function() {
                            item.classList.add('visible');
                        }, 80);
                    } else {
                        item.classList.remove('visible', 'show-overlay');
                        setTimeout(function() {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });

        portfolioItems.forEach(function(item, index) {
            setTimeout(function() {
                item.classList.add('visible');
            }, index * 80);
        });
    }

    // ============================================================
    // MOBILE PORTFOLIO — tap to toggle overlay
    // ============================================================
    function initMobilePortfolio() {
        const items = document.querySelectorAll('.portfolio-item');

        items.forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.overlay-btn')) return;
                items.forEach(function(other) {
                    if (other !== this) {
                        other.classList.remove('show-overlay');
                    }
                });
                this.classList.toggle('show-overlay');
            });
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.portfolio-item')) {
                items.forEach(function(item) {
                    item.classList.remove('show-overlay');
                });
            }
        });
    }


  
  
    // ============================================================
    // CONTACT FORM
    // ============================================================
    window.handleContact = function(e) {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        if (!btn) return;

        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(function() {
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Sent!';
            btn.style.background = '#2c5530';
            setTimeout(function() {
                btn.innerHTML = original;
                btn.style.background = '';
                btn.disabled = false;
                const form = document.getElementById('contactForm');
                if (form) form.reset();
            }, 2000);
        }, 1500);
    };

    // ============================================================
    // NEWSLETTER
    // ============================================================
    window.handleNewsletter = function() {
        const input = document.getElementById('newsletterEmail');
        if (!input) return;

        const email = input.value.trim();
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }
        const original = input.placeholder;
        input.placeholder = '✓ Subscribed!';
        input.value = '';
        setTimeout(function() {
            input.placeholder = original;
        }, 2500);
    };

    // ============================================================
    // SMOOTH SCROLL
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
                history.pushState(null, null, targetId);
            }
        });
    });

    // ============================================================
    // CHAT WIDGET
    // ============================================================
    const chat = document.getElementById('chatWidget');
    if (chat) {
        chat.onclick = function() {
            alert('Open Chatbot');
        };
    }

    // ============================================================
    // LOGIN / LOGOUT FUNCTIONALITY
    // ============================================================
    function checkLoginState() {
        const loginBtn = document.getElementById("loginBtn");
        const welcomeUser = document.getElementById("welcomeUser");
        const userNameDisplay = document.getElementById("userNameDisplay");

        const userName = localStorage.getItem("userName");
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (loginBtn && welcomeUser && userNameDisplay) {
            if (isLoggedIn && userName) {
                loginBtn.style.display = "none";
                welcomeUser.style.display = "flex";
                userNameDisplay.textContent = userName;
            } else {
                loginBtn.style.display = "inline-flex";
                welcomeUser.style.display = "none";
            }
        }
    }

    // Logout on click
    const welcomeUserEl = document.getElementById('welcomeUser');
    if (welcomeUserEl) {
        welcomeUserEl.addEventListener('click', function() {
            if (confirm('Logout?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                const loginBtn = document.getElementById('loginBtn');
                const welcomeEl = document.getElementById('welcomeUser');
                if (loginBtn) loginBtn.style.display = 'inline-flex';
                if (welcomeEl) welcomeEl.style.display = 'none';
                location.reload();
            }
        });
    }

    // Listen for storage changes (if user logs in from another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn' || e.key === 'userName') {
            checkLoginState();
        }
    });


     createTestimonials("testimonial-section");