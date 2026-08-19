document.addEventListener("DOMContentLoaded", async () => {

    const response = await fetch("projects.json");
    const projects = await response.json();

    const grid = document.getElementById("projectsGrid");

    grid.innerHTML = projects.map(project => `
        <div class="project-card" data-category="${project.category}">

            <div class="card-image"
                 style="background-image:url('${project.image}')">

                <span class="card-badge">${project.category}</span>

            </div>

            <div class="card-body">

                <h3>${project.title}</h3>

                <div class="card-meta">
                    <span>${project.location}</span>
                    <span>${project.year}</span>
                </div>

                <p class="card-excerpt">${project.description}</p>

                <div class="card-tags">
                    ${project.tags.map(tag => `<span>${tag}</span>`).join("")}
                </div>

                <a href="${project.link}" class="card-link">
                    View Project
                </a>

            </div>

        </div>
    `).join("");

});



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
        // MOBILE MENU
        // ============================================================
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        const icon = hamburger.querySelector('i');

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

  

