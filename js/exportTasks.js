// js/exportTasks.js
const ExportModule = {
  init() {
    const btnActive = document.getElementById('btnExport');
    if (btnActive) {
      btnActive.addEventListener('click', () => {
        console.log('Export Active CSV button clicked');
        this.exportActiveCSV();
      });
    }

    const btnArchive = document.getElementById('btnExportArchive');
    if (btnArchive) {
      btnArchive.addEventListener('click', () => {
        console.log('Export Archived CSV button clicked');
        this.exportArchiveCSV();
      });
    }

    const btnEng = document.getElementById('btnExportEngagements');
    if (btnEng) {
      btnEng.addEventListener('click', () => {
        console.log('Export Engagements CSV button clicked');
        this.exportEngagementsCSV();
      });
    }
  },

  exportActiveCSV() {
    const filtered = FiltersContext.getFilteredTasks(); // Ensure you have a proper filtering context
    if (!filtered || filtered.length === 0) {
      alert("No active tasks to export.");
      return;
    }

    const rows = [];
    rows.push([
      'Entity', 'Engagement name', 'Job code', 'Partner', 'Task',
      'Preparer', 'Preparer status', 'Reviewer', 'Reviewer status', 'Due date'
    ]);

    filtered.forEach(t => {
      const eng = DataStore.engagements.find(e => e.id === t.engagementId) || {};
      rows.push([
        eng.entity || '',
        eng.name || '',
        eng.jobCode || '',
        eng.partner || '',
        t.taskName || '',
        (t.preparers||[]).map(p=>p.name).join("; "),
        t.prepStatus || '',
        (t.reviewers||[]).map(r=>r.name).join("; "),
        t.revStatus || '',
        t.dueDate || ''
      ]);
    });

    this.downloadCSV(rows, 'tasks_active_export.csv');
  },

  exportArchiveCSV() {
    const rows = [];
    rows.push([
      'Entity', 'Engagement name', 'Job code', 'Partner', 'Task',
      'Preparer', 'Preparer status', 'Reviewer', 'Reviewer status', 'Due date'
    ]);

    const archivedTasks = DataStore.tasks.filter(t => t.archived); // Ensure you're checking the 'archived' flag
    if (!archivedTasks || archivedTasks.length === 0) {
      alert("No archived tasks to export.");
      return;
    }

    archivedTasks.forEach(t => {
      const eng = DataStore.engagements.find(e => e.id === t.engagementId) || {};
      rows.push([
        eng.entity || '',
        eng.name || '',
        eng.jobCode || '',
        eng.partner || '',
        t.taskName || '',
        (t.preparers||[]).map(p=>p.name).join("; "),
        t.prepStatus || '',
        (t.reviewers||[]).map(r=>r.name).join("; "),
        t.revStatus || '',
        t.dueDate || ''
      ]);
    });

    this.downloadCSV(rows, 'tasks_archived_export.csv');
  },

  exportEngagementsCSV() {
    const rows = [];
    rows.push([
      'Entity', 'Engagement name', 'Partner', 'Owner', 'Job code', 'Service line', 'Status'
    ]);

    if (!DataStore.engagements || DataStore.engagements.length === 0) {
      alert("No engagements to export.");
      return;
    }

    DataStore.engagements.forEach(e => {
      rows.push([
        e.entity || '',
        e.name || '',
        e.partner || '',
        e.owner || '',
        e.jobCode || '',
        e.serviceLine || '',
        e.status || ''
      ]);
    });

    this.downloadCSV(rows, 'engagements_export.csv');
  },

  downloadCSV(rows, filename) {
    const csv = rows
      .map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Initialize export module
ExportModule.init();
