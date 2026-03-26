// js/templates.js
const TemplatesModule = {
  selectedTemplateId: null,

  init() {
    // Handle "Manage Templates" button click (open modal)
    const btn = document.getElementById('btnManageTemplates');
    if (btn) {
      btn.addEventListener('click', () => {
        this.renderTemplatesList();
        this.renderTemplateDropdown();
        this.selectedTemplateId = null; // Reset selected template ID
        document.getElementById('templateNameInput').value = '';
        document.getElementById('templateTasksInput').value = '';
        App.openModal('modalTemplates');
      });
    }

    // Handle "Clear" button click (reset input fields)
    const btnClear = document.getElementById('btnTemplateClear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.selectedTemplateId = null;
        document.getElementById('templateNameInput').value = '';
        document.getElementById('templateTasksInput').value = '';
      });
    }

    // Handle "Save" button click (save new or edit existing template)
    const btnSave = document.getElementById('btnTemplateSave');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const name = document.getElementById('templateNameInput').value.trim();
        const lines = document.getElementById('templateTasksInput').value
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(Boolean); // Remove empty lines

        if (!name) { alert('Template name is required.'); return; }
        if (!lines.length) { alert('Please enter at least one task line.'); return; }

        // Save the template (either create new or update existing)
        if (this.selectedTemplateId) {
          const template = DataStore.taskTemplates.find(t => t.id === this.selectedTemplateId);
          if (template) {
            template.name = name;
            template.tasks = lines;
          }
        } else {
          const id = 'tmpl_' + Date.now() + '_' + Math.floor(Math.random() * 1000); // Unique ID for the new template
          DataStore.taskTemplates.push({ id, name, tasks: lines });
          this.selectedTemplateId = id;
        }

        // Re-render the templates list and dropdown
        this.renderTemplatesList();
        this.renderTemplateDropdown();
        alert('Template saved in this demo (in-memory only).');
      });
    }

    // Handle clicks on the templates list (edit or delete)
    const list = document.getElementById('templatesList');
    if (list) {
      list.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.tmpl-edit');
        const deleteBtn = e.target.closest('.tmpl-delete');
        if (editBtn) this.editTemplate(editBtn.dataset.id); // Edit template
        if (deleteBtn) this.deleteTemplate(deleteBtn.dataset.id); // Delete template
      });
    }
  },

  // Render the template dropdown for task selection
  renderTemplateDropdown() {
    const select = document.getElementById('taskTemplate');
    if (!select) return;

    // Populate dropdown with templates from DataStore
    select.innerHTML =
      '<option value="">None – enter tasks manually</option>' +
      DataStore.taskTemplates
        .map(t => `<option value="${t.id}">${t.name}</option>`)
        .join('');
  },

  // Render the list of available templates in the modal
  renderTemplatesList() {
    const container = document.getElementById('templatesList');
    if (!container) return;

    // If no templates exist, show a message
    if (!DataStore.taskTemplates.length) {
      container.innerHTML = 'No templates yet. Use the form below to add one.';
      return;
    }

    // Render templates as rows with Edit and Delete buttons
    container.innerHTML = DataStore.taskTemplates
      .map(t => `
        <div class="tmpl-row">
          <div>
            <strong>${t.name}</strong><br/>
            <span class="text-muted">${t.tasks.length} task(s)</span>
          </div>
          <div>
            <button class="btn-xs tmpl-edit" type="button" data-id="${t.id}">Edit</button>
            <button class="btn-xs tmpl-delete" type="button" data-id="${t.id}" style="color:#b91c1c;">Delete</button>
          </div>
        </div>
      `)
      .join('');
  },

  // Pre-fill the form for editing an existing template
  editTemplate(id) {
    const template = DataStore.taskTemplates.find(t => t.id === id);
    if (!template) return;

    // Set selected template ID
    this.selectedTemplateId = id;

    // Populate form fields with the existing template data
    document.getElementById('templateNameInput').value = template.name;
    document.getElementById('templateTasksInput').value = template.tasks.join('\n');
  },

  // Delete a template after confirmation
  deleteTemplate(id) {
    const template = DataStore.taskTemplates.find(t => t.id === id);
    if (!template) return;

    // Ask for confirmation before deleting the template
    if (!confirm(`Delete template "${template.name}"?`)) return;

    // Remove template from DataStore
    DataStore.taskTemplates = DataStore.taskTemplates.filter(t => t.id !== id);

    // Clear the form if the deleted template was selected
    if (this.selectedTemplateId === id) {
      this.selectedTemplateId = null;
      document.getElementById('templateNameInput').value = '';
      document.getElementById('templateTasksInput').value = '';
    }

    // Re-render the templates list and dropdown
    this.renderTemplatesList();
    this.renderTemplateDropdown();
  }
};

// Initialize TemplatesModule when the page is ready
TemplatesModule.init();
