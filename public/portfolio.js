document.addEventListener("DOMContentLoaded", async () => {

    const response = await fetch("projects.json");
    const projects = await response.json();

    const grid = document.getElementById("portfolioGrid");

    grid.innerHTML = projects.map(project => `
        <div class="portfolio-item" data-category="${project.category}">
            <img src="${project.image}" alt="${project.title}">

            <span class="card-badge">${project.category}</span>

            <div class="portfolio-overlay">
                <h3>${project.title}</h3>

                <p><i class="fas fa-map-marker-alt"></i> ${project.location}</p>

                <p><i class="fas fa-calendar-alt"></i> ${project.year}</p>

                <p class="portfolio-desc">${project.description}</p>

                <div class="portfolio-tags">
                    ${project.tags.map(tag => `<span>${tag}</span>`).join("")}
                </div>

                <a href="${project.link}" class="overlay-btn">
                    View Project
                </a>
            </div>
        </div>
    `).join("");

});