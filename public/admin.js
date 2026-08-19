
    (function() {
      // sidebar toggle
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('sidebarOverlay');
      const toggleBtn = document.getElementById('sidebarToggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          sidebar.classList.toggle('open');
          overlay.classList.toggle('active');
          document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
        });
      }
      if (overlay) {
        overlay.addEventListener('click', function() {
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        });
      }

      // sidebar navigation
      document.querySelectorAll('.sidebar-nav a[data-section]').forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const sectionId = this.getAttribute('data-section');
          document.querySelectorAll('.sidebar-nav a[data-section]').forEach(l => l.classList.remove('active'));
          this.classList.add('active');
          document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
          const target = document.getElementById('section-' + sectionId);
          if (target) target.classList.add('active');
          const titles = { dashboard:'Dashboard', projects:'Projects', clients:'Clients', services:'Services', inquiries:'Inquiries', users:'Users', settings:'Settings' };
          const titleEl = document.getElementById('pageTitle');
          if (titleEl && titles[sectionId]) titleEl.textContent = titles[sectionId];
          // close mobile
          if (window.innerWidth <= 992) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
          }
        });
      });

      // mobile menu (header)
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.getElementById('navLinks');
      if (hamburger) {
        hamburger.addEventListener('click', function(e) {
          e.stopPropagation();
          navLinks.classList.toggle('active');
        });
      }
      document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { navLinks.classList.remove('active'); } });

      // resize
      window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });









      
      async function loadUsers(){

    try{

        const response = await fetch("/api/users");

        const data = await response.json();

        const tbody = document.getElementById("usersTable");

        tbody.innerHTML = "";

        if(!data.success){

            tbody.innerHTML =
            "<tr><td colspan='5'>No Users Found</td></tr>";

            return;

        }

 data.users.forEach(user => {

    tbody.innerHTML += `
        <tr>

            <td>
                <img
                    src="/uploads/avatars/${user.avatar}"
                    onerror="this.src='/uploads/avatars/default.png'"
                    style="
                        width:50px;
                        height:50px;
                        border-radius:50%;
                        object-fit:cover;
                    ">
            </td>

            <td><strong>${user.full_name}</strong></td>

            <td>${user.email}</td>

            <td>${new Date(user.created_at).toLocaleDateString()}</td>

            <td>

                <div class="action-btns">

                    <button class="view-btn" data-id="${user.id}">
                        View
                    </button>

                    <button class="delete-btn" data-id="${user.id}">
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

});

    }

    catch(err){

        console.log(err);

    }

}

document.addEventListener("click", async function(e){

    // Delete
    if(e.target.classList.contains("delete-btn")){

        const id = e.target.dataset.id;

        if(!confirm("Delete this user?")) return;

        try{

            const response = await fetch(`/api/users/${id}`,{
                method:"DELETE"
            });

            const data = await response.json();

            if(data.success){

                alert("User deleted successfully.");

                loadUsers();

            }else{

                alert("Delete failed.");

            }

        }catch(err){

            console.error(err);

            alert("Server Error");

        }

    }

    // View
    if(e.target.classList.contains("view-btn")){

        const id = e.target.dataset.id;

        alert("User ID : " + id);

    }

});
function searchUsers(){

    let input=document.getElementById("searchUser").value.toLowerCase();

    let rows=document.querySelectorAll("#usersTable tr");

    rows.forEach(row=>{

        row.style.display=row.innerText.toLowerCase().includes(input)
        ?"":"none";

    });

}



loadUsers();


// add project



    })();
