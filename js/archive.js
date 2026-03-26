// js/archive.js
const ArchiveModule = {
  init() {
    // Event listener for "Archive Job" button
    const btn = document.getElementById('archiveJobBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const code = (document.getElementById('archiveJobCodeInput')?.value || '').trim();
        if (!code) {
          alert('Please enter a Job Code.');
          return;
        }
        this.archiveJobs([code]);
      });
    }

    // Toggle visibility of archived tasks section
    const toggle = document.getElementById('btnToggleArchive');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const sec = document.getElementById('archiveSection');
        if (sec) {
          sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
        }
      });
    }

    // Initial render of the archive section
    this.renderArchive();
  },

  async archiveJobs(jobCodes) {
  const input = jobCodes.map(c => String(c).trim());

  const allTasks = [...DataStore.tasks, ...DataStore.archivedTasks];

  for (const t of allTasks) {
    const eng = DataStore.engagements.find(e => e.id === t.engagementId);
    if (!eng) continue;

    const jobCode = String(eng.jobCode || "").trim();

if (!jobCodes.length || input.some(c => String(eng.jobCode).includes(c))) {
  t.archived = true;
  await DataStore.saveTask(t);
}
  }

  await DataStore.loadTasks();
    
  this.renderArchive();
  
},   
  
  // Render the list of archived tasks
  renderArchive() {
    const body = document.getElementById('archiveBody');
    if (!body) return;

    body.innerHTML = '';

    const archived = [...DataStore.tasks, ...DataStore.archivedTasks].filter(t => t.archived);

    if (archived.length === 0) {
      body.innerHTML = '<tr><td colspan="11">No archived tasks</td></tr>';
    } else {
      archived.forEach(t => {
        const e = DataStore.engagements.find(x => x.id === t.engagementId) || {};
        const tr = document.createElement('tr');

     tr.innerHTML = `
  <td>${e.entity || '—'}</td>

  <td>
    ${e.name || '—'}<br />
    <span class="text-muted">${e.serviceLine || ''}</span>
  </td>

  <td><code>${e.jobCode || '—'}</code></td>
  <td><code>${e.clientCode || '—'}</code></td>

  <td>${DataStore.getUserName(e.partner)}</td>

  <td>${t.taskName || ''}</td>

  <td>${(t.preparer || []).map(p => DataStore.getUserName(p)).join(', ') || '—'}</td>
  <td>${(t.reviewer || []).map(r => DataStore.getUserName(r)).join(', ') || '—'}</td>

  <td>${t.prepStatus || ''}</td>
  <td>${t.revStatus || ''}</td>

  <td>${DataStore.formatDateDisplay(t.createdAt)}</td>
  <td>${DataStore.formatDateDisplay(t.dueDate)}</td>

  <td>
    <button class="btn-xs restoreBtn" data-id="${t.id}" type="button">
      Restore
    </button>
  </td>
`;

        body.appendChild(tr);
      });
    }

    this.bindRestore();
  },

  // Add event listeners for restoring archived tasks
  bindRestore() {
    const body = document.getElementById('archiveBody');
    if (!body) return;

    body.addEventListener('click', async (e) => {   // ✅ FIXED (async)

      const btn = e.target.closest('.restoreBtn');
      if (!btn) return;

      const id = btn.dataset.id;
      const task = DataStore.archivedTasks.find(t => t.id === id);
      if (!task) return;

      task.archived = false;

      await DataStore.saveTask(task);

     await DataStore.loadTasks();

    this.renderArchive();
      
    });
  }
};

// Initialize the ArchiveModule on page load
ArchiveModule.init();
