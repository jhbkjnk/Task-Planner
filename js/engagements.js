const EngagementModule = {

  // ===============================
  // RENDER DROPDOWNS
  // ===============================
  renderEngagementSelects() {

    const filterEntity = document.getElementById('filterEntity');
    const taskEngagement = document.getElementById('taskEngagement');

    const entities = Array.from(
      new Set(DataStore.engagements.map(e => e.entity).filter(Boolean))
    );

    // Entity filter
    if (filterEntity) {
      filterEntity.innerHTML =
        '<option value="All">All entities</option>' +
        entities.map(en => `<option value="${en}">${en}</option>`).join('');
    }

    // Engagement dropdown
    if (taskEngagement) {
      taskEngagement.innerHTML = DataStore.engagements.length
        ? DataStore.engagements.map(e =>
            `<option value="${e.id}">
              ${e.entity || ''} – ${e.engagementName || e.name || ''}
            </option>`
          ).join('')
        : '<option value="">No engagements yet</option>';
    }
  },

  // ===============================
  // MOVE TASK DROPDOWN
  // ===============================
  populateMoveTaskDropdown(currentTask) {

    const select = document.getElementById('updateEngagementSelect');
    if (!select) return;

    select.innerHTML = DataStore.engagements.map(e => {
      const label = `${e.entity || ''} – ${e.engagementName || e.name || ''}`;
      return `<option value="${e.id}">${label}</option>`;
    }).join('');

    select.value = currentTask.engagementId;
  },

  // ===============================
  // APPLY EDITS (LEGACY SUPPORT)
  // ===============================
  applyEngagementEdits(engagement, { newEntity, newName, newJobCode, newPartner }, changes) {

    if (!engagement) return;

    if ((engagement.entity || '') !== newEntity) {
      changes.entity = { old: engagement.entity || '', new: newEntity };
      engagement.entity = newEntity;
    }

    if ((engagement.engagementName || engagement.name || '') !== newName) {
      changes.engagement = {
        old: engagement.engagementName || engagement.name || '',
        new: newName
      };
      engagement.engagementName = newName;
    }

    if ((engagement.jobCode || '') !== newJobCode) {
      changes.jobCode = { old: engagement.jobCode || '', new: newJobCode };
      engagement.jobCode = newJobCode;
    }

    if ((engagement.partner || '') !== newPartner) {
      changes.partner = { old: engagement.partner || '', new: newPartner };
      engagement.partner = newPartner;
    }

    console.log('Engagement updated:', engagement, changes);
  },

  // ===============================
  // ✅ OPEN EDIT MODAL
  // ===============================
  openEditModal(id) {

    console.log("Edit clicked:", id);

    const eng = DataStore.engagements.find(
      e => String(e.id) === String(id)
    );

    if (!eng) {
      alert("Engagement not found");
      return;
    }

    // Fill modal fields
    document.getElementById("editEngId").value = eng.id;
    document.getElementById("editEntity").value = eng.entity || '';
    document.getElementById("editEngagementName").value = eng.engagementName || eng.name || '';
    document.getElementById("editJobCode").value = eng.jobCode || '';
    document.getElementById("editClientCode").value = eng.clientCode || '';
    document.getElementById("editServiceLine").value = eng.serviceLine || '';
    document.getElementById("editPartner").value = eng.partner || '';

    App.openModal('modalEditEngagement');
  },

  // ===============================
  // ✅ SAVE EDIT
  // ===============================
  bindEditSave() {

    const btn = document.getElementById("btnUpdateEngagement");

    if (!btn) return;

    btn.addEventListener("click", async () => {

      const id = document.getElementById("editEngId").value;

      const updated = {
        id: id,
        entity: document.getElementById("editEntity").value,
        engagementName: document.getElementById("editEngagementName").value,
        jobCode: document.getElementById("editJobCode").value,
        clientCode: document.getElementById("editClientCode").value,
        serviceLine: document.getElementById("editServiceLine").value,
        partner: document.getElementById("editPartner").value
      };

      console.log("Updating engagement:", updated);

      await DataStore.updateEngagement(updated);

      App.closeModal('modalEditEngagement');

      // Refresh UI
      if (typeof EngagementListModule !== "undefined") {
        EngagementListModule.renderTable();
      }

      this.renderEngagementSelects();
    });
  }

};


// ===============================
// INIT (VERY IMPORTANT)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  EngagementModule.renderEngagementSelects();
  EngagementModule.bindEditSave();
});
