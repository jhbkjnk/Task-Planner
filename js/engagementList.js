const EngagementListModule = {

  init() {

    const btn = document.getElementById('btnEngagements');

    if (btn) {
      btn.addEventListener('click', () => {
        this.renderTable();
        App.openModal('modalEngagements');
      });
    }

    // ✅ Select all checkbox
    document.addEventListener('change', (e) => {
      if (e.target.id === 'selectAllEng') {
        const checked = e.target.checked;
        document.querySelectorAll('.engCheckbox')
          .forEach(cb => cb.checked = checked);
      }
    });

    // ✅ Bulk delete
    const bulkBtn = document.getElementById('btnBulkDeleteEng');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => {
        const selected = [...document.querySelectorAll('.engCheckbox:checked')]
          .map(cb => cb.dataset.id);

        if (selected.length === 0) {
          alert("Select at least one engagement.");
          return;
        }

        if (confirm("Delete selected engagements?")) {
          selected.forEach(id => DataStore.deleteEngagement(id));
          this.renderTable();
          EngagementModule.renderEngagementSelects();
        }
      });
    }

    // ✅ 3-dot menu click handling
    document.addEventListener('click', (e) => {

      // Toggle menu
      if (e.target.classList.contains('menuToggle')) {
        const menu = e.target.nextElementSibling;
        document.querySelectorAll('.menuDropdown').forEach(m => m.style.display = 'none');
        menu.style.display = 'block';
      }

      // Delete
      if (e.target.classList.contains('menuDelete')) {
        const id = e.target.dataset.id;
      
        if (confirm('Delete this engagement?')) {
          DataStore.deleteEngagement(id);
      
          // ✅ FORCE reload from storage
          DataStore.engagements = JSON.parse(localStorage.getItem("engagements")) || [];
      
          this.renderTable();
          EngagementModule.renderEngagementSelects();
        }
      }
      // Edit
      if (e.target.classList.contains('menuEdit')) {
        const id = e.target.dataset.id;
        EngagementModule.openEditModal(id); // ensure this exists
      }

      // Close menu when clicking outside
      if (!e.target.closest('.menuContainer')) {
        document.querySelectorAll('.menuDropdown')
          .forEach(m => m.style.display = 'none');
      }
    });
  },

  renderTable() {

    const body = document.getElementById('engagementTableBody');
    if (!body) return;

    body.innerHTML = '';

    DataStore.engagements.forEach(e => {

      const row = document.createElement('tr');

      row.innerHTML = `
        <td>
          <input type="checkbox" class="engCheckbox" data-id="${e.id}">
        </td>

        <td>${e.entity || ''}</td>
        <td>${e.engagementName || ''}</td>
        <td>${e.jobCode || ''}</td>
        <td>${e.clientCode || ''}</td>
        <td>${e.serviceLine || ''}</td>
        <td>${e.partner || ''}</td>

        <td>
          <span class="status-badge active">Active</span>
        </td>

        <td>
          <div class="menuContainer">
            <button class="menuToggle">⋮</button>

            <div class="menuDropdown">
              <div class="menuItem menuEdit" data-id="${e.id}">Edit</div>
              <div class="menuItem menuDelete" data-id="${e.id}">Delete</div>
            </div>
          </div>
        </td>
      `;

      body.appendChild(row);
    });
  }
};
