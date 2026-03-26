const UserManagementModule = {

  editingUserId: null,

  init() {

    // OPEN USER MANAGEMENT PAGE
    const btn = document.getElementById("btnUserManagement");

    if (btn) {
      btn.addEventListener("click", () => {

        document.querySelector(".app-shell").style.display = "none";
        document.getElementById("userManagementPage").style.display = "block";

        this.loadUsers();

      });
    }

    // BACK BUTTON
    const backBtn = document.getElementById("btnBackToTasks");

    if (backBtn) {
      backBtn.addEventListener("click", () => {

        document.getElementById("userManagementPage").style.display = "none";
        document.querySelector(".app-shell").style.display = "block";

      });
    }

    // SEARCH
    this.bindUserSearch();

    // ✅ FIX: Bind actions ONLY ONCE here
    this.bindActions();

    // ADD USER BUTTON
    const addBtn = document.getElementById("btnAddUser");

    if (addBtn) {
      addBtn.addEventListener("click", () => {

        this.editingUserId = null;

        document.getElementById("userModalTitle").innerText = "Add User";

        document.getElementById("formAddUser").reset();

        document.querySelectorAll('#rolesTab input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });

        this.resetTabs();

        const modal = document.getElementById("modalAddUser");
        modal.style.display = "flex";
        modal.classList.add("show");

      });
    }

    // SAVE USER
    const form = document.getElementById("formAddUser");

    if (form) {

      form.addEventListener("submit", (e) => {

        e.preventDefault();

        const name = document.getElementById("userName").value;
        const email = document.getElementById("userEmail").value;

        const roles = [];

        document.querySelectorAll('#rolesTab input[type="checkbox"]:checked')
          .forEach(cb => roles.push(cb.value));

        const role = roles.join(", ");

        const status = document.getElementById("userStatus").value;

        if (this.editingUserId) {

          const user = DataStore.users.find(u => u.id == this.editingUserId);

          if (user) {
            user.name = name;
            user.email = email;
            user.role = role;
            user.status = status;
          }

          this.editingUserId = null;

        } else {

          DataStore.users.push({
            id: Date.now(),
            name,
            email,
            role,
            status
          });

        }

        localStorage.setItem("users", JSON.stringify(DataStore.users));

        const modal = document.getElementById("modalAddUser");
        modal.classList.remove("show");
        modal.style.display = "none";

        form.reset();

        this.renderUsers();

      });

    }

    // CLOSE MODALS
  document.querySelectorAll("[data-modal-close]").forEach(btn => {

  btn.addEventListener("click", () => {

    const modalId = btn.getAttribute("data-modal-close");
    const modal = document.getElementById(modalId);

    if (modal) {
      modal.classList.remove("show");
      modal.style.display = "none"; // ✅ FIX
    }

    this.editingUserId = null;

  });

});

    // TAB SWITCHING
    document.querySelectorAll(".edit-tab").forEach(tab => {

      tab.addEventListener("click", () => {

        const target = tab.dataset.tab;

        document.querySelectorAll(".edit-tab")
          .forEach(t => t.classList.remove("active"));

        document.querySelectorAll(".edit-tab-content")
          .forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(target).classList.add("active");

      });

    });

  },

  resetTabs(){

    document.querySelectorAll(".edit-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".edit-tab-content").forEach(c => c.classList.remove("active"));

    document.querySelector('[data-tab="generalTab"]').classList.add("active");
    document.getElementById("generalTab").classList.add("active");

  },

  // LOAD USERS
  async loadUsers() {

    try {

      const res = await fetch("/api/users");

      if (!res.ok) throw new Error("Failed to load users");

      const users = await res.json();

      DataStore.users = users.map(u => ({
        id: u.id,
        name: u.displayName,
        email: u.email,
        role: "Staff",
        status: "Active"
      }));

      this.renderUsers();

    } catch (err) {

      console.error("Error loading users:", err);

    }

  },

  // RENDER USERS TABLE
  renderUsers() {

    const tbody = document.getElementById("userTableBody");

    if (!tbody) return;

    tbody.innerHTML = "";

    DataStore.users.forEach(user => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <input type="checkbox" class="user-checkbox" data-id="${user.id}">
        </td>
        
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.status}</td>

        <td class="user-actions">
          <button type="button" class="icon-btn edit-user" data-id="${user.id}" title="Edit User">✏️</button>
          <button type="button" class="icon-btn delete-user" data-id="${user.id}" title="Delete User">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);

    });

    this.bindSelectAll(); // ✅ keep this (separate logic)

  },

  // ACTION BUTTONS (EVENT DELEGATION)
  bindActions() {

    const table = document.getElementById("userTableBody");

    if (!table) return;

    table.addEventListener("click", (e) => {

      const editBtn = e.target.closest(".edit-user");
      const deleteBtn = e.target.closest(".delete-user");

      if (editBtn) {

        const id = editBtn.dataset.id;

        const user = DataStore.users.find(u => u.id == id);
        if (!user) return;

        document.getElementById("userName").value = user.name;
        document.getElementById("userEmail").value = user.email;

        document.querySelectorAll('#rolesTab input[type="checkbox"]').forEach(cb => {
          cb.checked = user.role && user.role.includes(cb.value);
        });

        document.getElementById("userStatus").value = user.status;

        this.editingUserId = id;

        document.getElementById("userModalTitle").innerText = "Edit User";

        this.resetTabs();

        const modal = document.getElementById("modalAddUser");
        modal.style.display = "flex";
        modal.classList.add("show");

      }

      if (deleteBtn) {

        const id = deleteBtn.dataset.id;

        if (!confirm("Delete this user?")) return;

        DataStore.users = DataStore.users.filter(u => u.id != id);

        localStorage.setItem("users", JSON.stringify(DataStore.users));

        this.renderUsers();

      }

    });

  },

  // SELECT ALL USERS
  bindSelectAll() {

    const selectAll = document.getElementById("selectAllUsers");

    if (!selectAll) return;

    selectAll.addEventListener("change", () => {

      document.querySelectorAll(".user-checkbox").forEach(cb => {
        cb.checked = selectAll.checked;
      });

    });

  },

  // SEARCH USERS
  bindUserSearch(){

    const searchInput = document.getElementById("userSearchInput");

    if(!searchInput) return;

    searchInput.addEventListener("input", () => {

      const searchText = searchInput.value.toLowerCase();

      document.querySelectorAll("#userTableBody tr").forEach(row => {

        const name = row.children[1].innerText.toLowerCase();
        const email = row.children[2].innerText.toLowerCase();

        row.style.display = (name.includes(searchText) || email.includes(searchText)) ? "" : "none";

      });

    });

  }

};

UserManagementModule.init();
