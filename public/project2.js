
        (function() {
            'use strict';
// ==========================================================
// GALLERY DATA
// ==========================================================
const galleryImages = [
     "https://i.ibb.co/d0JPzX0Y/delhi4.jpg",
       "https://i.ibb.co/zV9C6y8W/delhi5.jpg",
       "https://i.ibb.co/v6FqKNjh/delhi7.jpg",
  "https://i.ibb.co/VWzhRZw2/delhi8.jpg",
    "https://i.ibb.co/YTc4Lxjq/delhi6.jpg",
  
  "https://i.ibb.co/WWHpL11m/delhi9.jpg",
 
  "https://i.ibb.co/JRN5WwZM/delhi2.jpg",
  "https://i.ibb.co/B2Z5QZ7K/delhi3.jpg",
 



  "https://i.ibb.co/nFv9zp8/delhi10.jpg",
     "https://i.ibb.co/cKrP4p6j/dekhi8.jpg",
  "https://i.ibb.co/spWx6MFW/delhi1.jpg"
];

const grid = document.getElementById("galleryGrid");
const viewMoreBtn = document.getElementById("viewMoreBtn");

let expanded = false;

function renderGallery() {

    grid.innerHTML = "";

    const visibleImages = expanded
        ? galleryImages
        : galleryImages.slice(0, 6);

    visibleImages.forEach((url, index) => {

        const div = document.createElement("div");
        div.className = "gallery-item";
        div.style.backgroundImage = `url(${url})`;

        div.onclick = () => openLightbox(index);

        grid.appendChild(div);

    });

    if (galleryImages.length <= 6) {
        viewMoreBtn.style.display = "none";
        return;
    }

    if (expanded) {
        viewMoreBtn.innerHTML =
            '<i class="fas fa-chevron-up"></i> Show Less';
    } else {
        viewMoreBtn.innerHTML =
            `<i class="fas fa-images"></i> View More (${galleryImages.length-6})`;
    }

}

renderGallery();

viewMoreBtn.addEventListener("click", () => {

    expanded = !expanded;

    renderGallery();

    if (!expanded) {
        document.getElementById("projectGallery").scrollIntoView({
            behavior: "smooth"
        });
    }

});






    // ============================================================
            // TESTIMONIAL SLIDER
            // ============================================================
            function initTestimonialSlider() {
                const slides = document.querySelectorAll('.testimonial-slide');
                const dots = document.querySelectorAll('.dot');
                let current = 0;
                let interval;

                function showSlide(index) {
                    slides.forEach(function(s, i) {
                        s.classList.remove('active', 'prev');
                        if (i === index) {
                            s.classList.add('active');
                        } else if (i === (index - 1 + slides.length) % slides.length) {
                            s.classList.add('prev');
                        }
                    });
                    dots.forEach(function(d, i) {
                        d.classList.toggle('active', i === index);
                    });
                    current = index;
                }

                function nextSlide() {
                    showSlide((current + 1) % slides.length);
                }

                dots.forEach(function(dot) {
                    dot.addEventListener('click', function() {
                        clearInterval(interval);
                        const index = parseInt(this.getAttribute('data-slide'));
                        showSlide(index);
                        interval = setInterval(nextSlide, 5000);
                    });
                });

                interval = setInterval(nextSlide, 5000);

                const wrapper = document.querySelector('.testimonial-slider-wrapper');
                wrapper.addEventListener('mouseenter', function() {
                    clearInterval(interval);
                });
                wrapper.addEventListener('mouseleave', function() {
                    interval = setInterval(nextSlide, 5000);
                });
            }


            // ============================================================
// REVIEW MODAL FUNCTIONS
// ============================================================

let selectedRating = 0;

window.openReviewForm = function () {

    const modal = document.getElementById("reviewModal");

    modal.classList.add("show");

    document.body.style.overflow = "hidden";

};
window.closeReviewModal = function () {

    document.getElementById("reviewModal").classList.remove("show");

    document.body.style.overflow = "";

};

window.setRating = function(rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll('.stars-input i');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
    document.getElementById('ratingDisplay').textContent = `${rating}/5`;
}

window.submitReview = async function(e){

    e.preventDefault();

    const formData = new FormData();

    formData.append("name", reviewName.value);
    formData.append("email", reviewEmail.value);
    formData.append("review", reviewText.value);
    formData.append("rating", selectedRating);

    if(reviewImage.files.length){
        formData.append("image", reviewImage.files[0]);
    }

    const response = await fetch("/api/reviews",{

        method:"POST",

        body:formData

    });

    const data = await response.json();

    if(data.success){

        alert("Review Submitted");

        closeReviewModal();

        loadReviews();

    }

}



// Close modal on outside click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('reviewModal');
    if (modal && e.target === modal) {
        closeReviewModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeReviewModal();
    }
});


// load review

async function loadReviews() {

    try {

        const response = await fetch("/api/reviews");
        const data = await response.json();

        const container = document.getElementById("reviewsContainer");
        const dots = document.getElementById("reviewDots");

        container.innerHTML = "";
        dots.innerHTML = "";

        if (!data.success || data.reviews.length === 0) {

            container.innerHTML = `
                <div class="testimonial-slide active">
                    <p class="text">No reviews yet.</p>
                </div>
            `;

            return;
        }

        data.reviews.forEach((review, index) => {

            let stars = "";

            for (let i = 0; i < review.rating; i++) {
                stars += `<i class="fas fa-star"></i>`;
            }

            const image = review.image
                ? `/uploads/reviews/${review.image}`
                : "/uploads/avatars/default.png";

            container.innerHTML += `

                <div class="testimonial-slide ${index === 0 ? "active" : ""}">

                    <div class="stars">
                        ${stars}
                    </div>

                    <p class="text">
                        "${review.review}"
                    </p>

                    <div class="author">

                        <div class="avatar"
                             style="background-image:url('${image}')">
                        </div>

                        <div class="info">

                            <h5>${review.name}</h5>

                            <span>${review.email}</span>

                        </div>

                    </div>

                </div>

            `;

            dots.innerHTML += `
                <span class="dot ${index === 0 ? "active" : ""}"
                      data-slide="${index}">
                </span>
            `;

        });

        initTestimonialSlider();

    } catch (err) {

        console.log(err);

    }

}

loadReviews();



  var scrollContainer = document.getElementById('projectScroll');
    var scrollWrapper = document.getElementById('navScrollWrapper');
    var leftBtn = document.getElementById('scrollLeft');
    var rightBtn = document.getElementById('scrollRight');

    if (!scrollContainer) return;

    // Scroll by card width + gap
    var cardWidth = 180 + 20; // card width + gap
    var scrollAmount = cardWidth;

    function updateFadeIndicators() {
        if (!scrollWrapper) return;
        var scrollLeft = scrollContainer.scrollLeft;
        var maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        scrollWrapper.classList.toggle('show-left-fade', scrollLeft > 10);
        scrollWrapper.classList.toggle('show-right-fade', scrollLeft < maxScroll - 10);
    }

    function scrollCards(direction) {
        var currentScroll = scrollContainer.scrollLeft;
        var target = currentScroll + (direction * scrollAmount);
        scrollContainer.scrollTo({ left: target, behavior: 'smooth' });
    }

    if (leftBtn) {
        leftBtn.addEventListener('click', function(e) {
            e.preventDefault();
            scrollCards(-1);
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('click', function(e) {
            e.preventDefault();
            scrollCards(1);
        });
    }

    // Update fade indicators on scroll
    scrollContainer.addEventListener('scroll', updateFadeIndicators);

    // Also update on resize and after load
    window.addEventListener('resize', updateFadeIndicators);
    window.addEventListener('load', function() {
        setTimeout(updateFadeIndicators, 200);
    });

    // Initial check
    updateFadeIndicators();

    // Keyboard navigation (optional)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && scrollContainer.matches(':hover')) {
            scrollCards(-1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight' && scrollContainer.matches(':hover')) {
            scrollCards(1);
            e.preventDefault();
        }
    });
            // ==========================================================
            // LIGHTBOX LOGIC
            // ==========================================================
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightboxImg');
            const lightboxCounter = document.getElementById('lightboxCounter');
            const lightboxThumbs = document.getElementById('lightboxThumbs');
            const closeBtn = document.getElementById('lightboxClose');
            const prevBtn = document.getElementById('lightboxPrev');
            const nextBtn = document.getElementById('lightboxNext');

            let currentIndex = 0;

            galleryImages.forEach((url, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'thumb';
                thumb.style.backgroundImage = `url(${url})`;
                thumb.dataset.index = index;
                thumb.addEventListener('click', () => {
                    currentIndex = index;
                    updateLightbox();
                });
                lightboxThumbs.appendChild(thumb);
            });

            const thumbElements = lightboxThumbs.querySelectorAll('.thumb');

            function updateLightbox() {
                lightboxImg.src = galleryImages[currentIndex];
                lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
                thumbElements.forEach((thumb, i) => {
                    thumb.classList.toggle('active', i === currentIndex);
                    if (i === currentIndex) {
                        thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                });
            }

            function openLightbox(index) {
                currentIndex = index;
                updateLightbox();
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            function closeLightbox() {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }

            function changeImage(direction) {
                currentIndex += direction;
                if (currentIndex < 0) currentIndex = galleryImages.length - 1;
                if (currentIndex >= galleryImages.length) currentIndex = 0;
                updateLightbox();
            }

            closeBtn.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) closeLightbox();
            });
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeImage(-1);
            });
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeImage(1);
            });

            document.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('active')) return;
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') changeImage(-1);
                if (e.key === 'ArrowRight') changeImage(1);
            });

            // ==========================================================
            // HEADER SCROLL
            // ==========================================================
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

            // ==========================================================
            // MOBILE MENU
            // ==========================================================
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

            // ==========================================================
            // REVEAL ON SCROLL
            // ==========================================================
            const revealObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('.reveal').forEach(function(el) {
                revealObserver.observe(el);
            });

            // ==========================================================
            // FAQ ACCORDION
            // ==========================================================
            document.querySelectorAll('.faq-item').forEach(function(item) {
                const question = item.querySelector('.faq-question');

                function toggleFaq() {
                    const isActive = item.classList.contains('active');
                    // Close all others
                    document.querySelectorAll('.faq-item').forEach(function(i) {
                        i.classList.remove('active');
                    });
                    if (!isActive) {
                        item.classList.add('active');
                    }
                }

                if (question) {
                    question.addEventListener('click', function(e) {
                        // Don't toggle if clicking the arrow icon directly (it's already handled)
                        toggleFaq();
                    });
                }
            });

            // ==========================================================
            // NEWSLETTER
            // ==========================================================
            window.handleNewsletter = function() {
                const input = document.getElementById('newsletterEmail');
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

            // ==========================================================
            // CHAT WIDGET
            // ==========================================================
            document.getElementById('chatWidget').onclick = function() {
                alert('Open Chatbot – coming soon!');
            };



async function loadMoreProjects() {

    try {

        const response = await fetch("projects.json");
        const projects = await response.json();

        const scroll = document.getElementById("projectScroll");

        scroll.innerHTML = "";

        projects.forEach(project => {

            scroll.innerHTML += `
                <a href="${project.link}" class="nav-card">

                    <div class="nav-card-thumb"
                        style="background-image:url('${project.image}')">
                    </div>

                    <span class="nav-card-title">
                        ${project.title}
                    </span>

                    <span class="nav-card-tag">
                        ${project.category}
                    </span>

                </a>
            `;

        });

        // Last card
        scroll.innerHTML += `
            <a href="view-all-project.html" class="nav-card all-projects">

                <i class="fas fa-th-large"></i>

                <span class="nav-card-title">
                    All Projects
                </span>

                <span class="nav-card-tag">
                    View Full Portfolio →
                </span>

            </a>
        `;

    } catch (err) {

        console.error("Projects Load Error:", err);

    }

}

loadMoreProjects();


        })();
  