// js/filters.js
const FiltersContext = {
  init() {
    this.bindStatusChips();
    this.bindFilterInputs();
  },

  bindStatusChips() {
    const chips = document.querySelectorAll('#statusChips .chip');
    const label = document.getElementById('activeFilterLabel');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        DataStore.activeStatusFilter = chip.dataset.status;
        if (label) label.textContent = DataStore.activeStatusFilter;
        TaskModule.renderTasks();
      });
    });
  },

  bindFilterInputs() {
    ['filterEntity','filterServiceLine'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => TaskModule.renderTasks());
    });
    ['filterPreparer','filterReviewer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => TaskModule.renderTasks());
    });
  },

  passesFilters(task) {
    const eList = DataStore.engagements;
    const engagement = eList.find(e => e.id === task.engagementId) || {};
    const entity = engagement.entity || '';
    const serviceLine = engagement.serviceLine || '';

    const filterEntityVal   = (document.getElementById('filterEntity')?.value) || 'All';
    const filterServiceVal  = (document.getElementById('filterServiceLine')?.value) || 'All';
    const filterReviewerVal = (document.getElementById('filterReviewer')?.value || '').trim().toLowerCase();
    const filterPreparerVal = (document.getElementById('filterPreparer')?.value || '').trim().toLowerCase();

    if (filterEntityVal !== 'All' && entity !== filterEntityVal) return false;
    if (filterServiceVal !== 'All' && serviceLine !== filterServiceVal) return false;

    if(filterReviewerVal && !(task.reviewers||[]).some(r=>r.name.toLowerCase().includes(filterReviewerVal))) return false;
    if(filterPreparerVal && !(task.preparers||[]).some(p=>p.name.toLowerCase().includes(filterPreparerVal))) return false;

    const st = DataStore.activeStatusFilter;
    if (st === 'All') return true;

    switch (st) {
      case 'Work in progress':
      case 'Queries asked':
      case 'Submitted to reviewer':
        return task.prepStatus === st;
      case 'Sent to client':
        return task.revStatus === 'Sent to client for review';
      case 'Completed':
        return task.revStatus === 'Completed';
      case 'Pending reviewer':
        return ['Assigned to reviewer','Review in progress'].includes(task.revStatus);
      default:
        return true;
    }
  },

  getFilteredTasks() {
    let list = DataStore.tasks.filter(t => !t.archived && this.passesFilters(t));

    const { column, direction } = DataStore.sortConfig;
    if (column && direction) {
      const engagements = DataStore.engagements;
      list.sort((a, b) => {
        const engA = engagements.find(e => e.id === a.engagementId) || {};
        const engB = engagements.find(e => e.id === b.engagementId) || {};
        let va = '', vb = '';

        switch (column) {
          case 'entity':     va = engA.entity || '';     vb = engB.entity || ''; break;
          case 'engagement': va = engA.name || '';       vb = engB.name || ''; break;
          case 'jobCode':    va = engA.jobCode || '';    vb = engB.jobCode || ''; break;
          case 'task':       va = a.taskName || '';      vb = b.taskName || ''; break;
          case 'preparer':   va = a.preparer || '';      vb = b.preparer || ''; break;
          case 'prepStatus': va = a.prepStatus || '';    vb = b.prepStatus || ''; break;
          case 'reviewer':   va = a.reviewer || '';      vb = b.reviewer || ''; break;
          case 'revStatus':  va = a.revStatus || '';     vb = b.revStatus || ''; break;
          case 'dueDate':    va = a.dueDate || '';       vb = b.dueDate || ''; break;
          default:           va = '';                    vb = '';
        }

        if (column !== 'dueDate') {
          va = va.toString().toLowerCase();
          vb = vb.toString().toLowerCase();
        }

        if (va < vb) return direction === 'asc' ? -1 : 1;
        if (va > vb) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  },

  toggleSort(columnKey) {
    const cfg = DataStore.sortConfig;
    if (cfg.column !== columnKey) {
      cfg.column = columnKey;
      cfg.direction = 'asc';
    } else if (cfg.direction === 'asc') {
      cfg.direction = 'desc';
    } else {
      cfg.column = null;
      cfg.direction = null;
    }
    TaskModule.renderTasks();
  },

  renderStats(filteredTasks) {
    const total = DataStore.tasks.length;
    const pendingPrep = DataStore.tasks.filter(t =>
      ['Assigned to preparer','Data asked from client','PBC list yet to be sent','Work in progress','Queries asked']
        .includes(t.prepStatus)
    ).length;
    const pendingRev = DataStore.tasks.filter(t =>
      ['Assigned to reviewer','Review in progress','Queries returned to preparer']
        .includes(t.revStatus)
    ).length;

    const sTotal = document.getElementById('statTotalTasks');
    const sPrep  = document.getElementById('statPendingPreparer');
    const sRev   = document.getElementById('statPendingReviewer');
    const pill   = document.getElementById('pillShowing');

    if (sTotal) sTotal.textContent = total;
    if (sPrep) sPrep.textContent  = pendingPrep;
    if (sRev)  sRev.textContent   = pendingRev;
    if (pill)  pill.textContent   = `Showing ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}`;
  }
};
document.addEventListener("DOMContentLoaded", () => {
  FiltersContext.init();
});
