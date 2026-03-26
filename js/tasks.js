// js/tasks.js

function initExcelMultiSelect(el, selected = [], onSave) {
  const users = DataStore.users || [];

  const display = el.querySelector('.selected-display');
  const dropdown = el.querySelector('.dropdown');
  const options = el.querySelector('.options');

  let tempSelected = [...selected];

  options.innerHTML = users.map(u => `
  <label style="display:flex; align-items:center; gap:6px;">
    <input type="checkbox" value="${u.displayName}"
      ${selected.includes(u.displayName) ? 'checked' : ''}>
    <span>${u.displayName}</span>
  </label>
`).join('');

  display.innerHTML = selected.length
  ? selected.map(name => `<div>${name}</div>`).join('')
  : 'Select';

  display.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.add('active');
  };

  options.querySelectorAll('input').forEach(cb => {
    cb.addEventListener('change', () => {
      tempSelected = [...options.querySelectorAll('input:checked')]
        .map(i => i.value);
    });
  });

  el.querySelector('.okBtn').onclick = (e) => {
  e.stopPropagation();

  const selected = [...options.querySelectorAll('input:checked')]
    .map(i => i.value);

  el.setAttribute('data-value', JSON.stringify(selected));

  display.innerText = selected.length
    ? selected.join(', ')
    : 'Select';

  dropdown.classList.remove('active');

  if (onSave) onSave(selected);
};
  
  el.querySelector('.cancelBtn').onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.remove('active');
  };
}

function openUserPopup(anchorEl, selected = [], onSave) {
  const users = DataStore.users || [];
  let tempSelected = [...selected];

  const popup = document.createElement('div');
  popup.classList.add('popup-user');

  popup.innerHTML = `
    <div class="user-list">
      ${users.map(u => `
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" value="${u.displayName}"
            ${tempSelected.includes(u.displayName) ? 'checked' : ''}
            style="margin:0;">
          <span>${u.displayName}</span>
        </label>
      `).join('')}
    </div>
  
    <div style="margin-top:8px; display:flex; gap:6px;">
      <button class="ok-btn">OK</button>
      <button class="cancel-btn">Cancel</button>
    </div>
  `;

  document.body.appendChild(popup);

  const rect = anchorEl.getBoundingClientRect();
  popup.style.position = 'absolute';
  popup.style.top  = (rect.bottom + window.scrollY) + 'px';
  popup.style.left = (rect.left   + window.scrollX) + 'px';
  popup.style.background = '#fff';
  popup.style.border = '1px solid #ccc';
  popup.style.padding = '8px';

  popup.style.width = '220px';         // ✅ consistent width
  popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  popup.style.zIndex = '9999';         // ✅ stays above table

  popup.querySelectorAll('input').forEach(cb => {
    cb.addEventListener('change', () => {
      tempSelected = [...popup.querySelectorAll('input:checked')].map(i => i.value);
    });
  });

  popup.querySelectorAll('label').forEach(label => {
  label.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    popup.remove(); // ONLY CLOSE
  });
});

  popup.querySelector('.ok-btn').onclick = () => {
    onSave(tempSelected);
    popup.remove();
  };

  popup.querySelector('.cancel-btn').onclick = () => popup.remove();
}

const TaskModule = {
  init() {
    this.bindSortingHeaders();
    this.bindInlineEditing();
    this.bindRowMenu();
    this.bindBulkActions();
    this.bindColumnResize();
    this.renderTasks();
  },

  bindSortingHeaders() {
    const map = {
      sortEntity: 'entity',
      sortEngagement: 'engagement',
      sortJobCode: 'jobCode',
      sortTask: 'task',
      sortPreparer: 'preparer',
      sortPrepStatus: 'prepStatus',
      sortReviewer: 'reviewer',
      sortRevStatus: 'revStatus',
      sortDue: 'dueDate'
    };
    Object.entries(map).forEach(([id, col]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => FiltersContext.toggleSort(col));
    });
  },

  bindInlineEditing() {
    const body = document.getElementById('taskTableBody');
    if (!body) return;

    body.addEventListener('change', (e) => {
      const el = e.target;

      if (el.classList.contains('row-select')) {
        this.updateBulkBar();
        return;
      }

      const tr = el.closest('tr');
      if (!tr) return;
      const taskId = tr.dataset.taskId;
      const task = DataStore.tasks.find(t => t.id === taskId);
      if (!task) return;

      const changes = {};

      if (el.classList.contains('inline-preparer')) {
        const oldVal = task.preparer || '';
        const newVal = el.value.trim();
        if (oldVal !== newVal) {
          task.preparer = newVal;
          changes.preparer = { old: oldVal, new: newVal };
        }
      }

      if (el.classList.contains('inline-reviewer')) {
        const oldVal = task.reviewer || '';
        const newVal = el.value.trim();
        if (oldVal !== newVal) {
          task.reviewer = newVal;
          changes.reviewer = { old: oldVal, new: newVal };
        }
      }

      if (el.classList.contains('inline-prep-status')) {
        const oldVal = task.prepStatus || '';
        const newVal = el.value;
        if (oldVal !== newVal) {
          task.prepStatus = newVal;
          changes.prepStatus = { old: oldVal, new: newVal };
        }
      }

      if (el.classList.contains('inline-rev-status')) {
        const oldVal = task.revStatus || '';
        const newVal = el.value;
        if (oldVal !== newVal) {
          task.revStatus = newVal;
          changes.revStatus = { old: oldVal, new: newVal };
        }
      }

      if (el.classList.contains('add-prep-dropdown')) {

  const taskId = el.dataset.taskId;
  const task = DataStore.tasks.find(t => t.id === taskId);
  if (!task) return;

  const name = el.value;
  if (!name) return;

  let existing = [];

  if (Array.isArray(task.preparers)) {
    existing = task.preparers;
  } else if (Array.isArray(task.preparer)) {
    existing = task.preparer.map(p => ({
      name: p,
      status: task.prepStatus || 'Assigned to preparer'
    }));
  } else if (typeof task.preparer === 'string' && task.preparer) {
    existing = [{
      name: task.preparer,
      status: task.prepStatus || 'Assigned to preparer'
    }];
  }

  if (!existing.some(p => p.name === name)) {
    existing.push({
      name,
      status: 'Assigned to preparer'
    });
  }

  task.preparers = existing;
  task.preparer = existing.map(p => p.name);

  DataStore.saveTask(task);
  TaskModule.renderTasks();
  return;
}

      if (el.classList.contains('prep-status-dropdown')) {
    
      const index = el.dataset.index;
    
      if (!task.preparers) {
        task.preparers = (task.preparer || []).map(p => ({
          name: p,
          status: task.prepStatus || ''
        }));
      }
    
      const oldVal = task.preparers[index].status;
      const newVal = el.value;
    
      if (oldVal !== newVal) {
        task.preparers[index].status = newVal;
    
        changes.preparerStatus = {
          user: task.preparers[index].name,
          old: oldVal,
          new: newVal
        };
      }
    }    

      if (Object.keys(changes).length > 0) {
        DataStore.addAuditEntry(task, changes, 'Inline edit from grid');
        DataStore.saveTask(task);
        FiltersContext.renderStats(FiltersContext.getFilteredTasks());
      }
    });

    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const checked = selectAll.checked;
        document.querySelectorAll('.row-select').forEach(cb => cb.checked = checked);
        this.updateBulkBar();
      });
    }
  },

  bindRowMenu() {
    const body = document.getElementById('taskTableBody');
    if (!body) return;

    body.addEventListener('click', (e) => {

      if (e.target.classList.contains('remove-prep')) {

  const taskId = e.target.dataset.taskId;
  const index = parseInt(e.target.dataset.index, 10);

  const task = DataStore.tasks.find(t => t.id === taskId);
  if (!task || !task.preparers) return;

  task.preparers.splice(index, 1);

  DataStore.saveTask(task);
  TaskModule.renderTasks();

  return;
}
      const moreBtn      = e.target.closest('.btn-more');
      const updateBtn    = e.target.closest('.action-update');
      const duplicateBtn = e.target.closest('.action-duplicate');
      const deleteBtn    = e.target.closest('.action-delete');

      if (moreBtn) {
  e.stopPropagation();
  const menu = moreBtn.closest('.action-menu');
  const dropdown = menu.querySelector('.action-menu-dropdown');

  document.querySelectorAll('.action-menu-dropdown.show').forEach(d => {
    if (d !== dropdown) d.classList.remove('show');
  });

  dropdown.classList.toggle('show');
  return; 
}

      if (updateBtn)    this.openUpdateModal(updateBtn);
      if (duplicateBtn) this.duplicateTask(duplicateBtn);
      if (deleteBtn)    this.deleteTask(deleteBtn);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-menu')) {
        document.querySelectorAll('.action-menu-dropdown.show').forEach(d => d.classList.remove('show'));
      }
    });

    const form = document.getElementById('formUpdateStatus');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUpdateModal();
      });
    }
  },

  bindBulkActions() {
    const bulkDelete = document.getElementById('bulkDelete');

if (bulkDelete) {

  bulkDelete.addEventListener('click', async () => {

    const ids = [...document.querySelectorAll('.row-select:checked')]
      .map(cb => cb.dataset.id);

    if (!ids.length) return;

    if (!confirm(`Delete ${ids.length} tasks?`)) return;

    for (const id of ids) {

      const task = DataStore.tasks.find(t => t.id === id);
      if (!task) continue;

      await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}&engagementId=${encodeURIComponent(task.engagementId)}`, {
        method: "DELETE"
      });

    }

    await loadTasks();

  });

}

    const bulkArchiveJobs = document.getElementById('bulkArchiveJobs');
    if (bulkArchiveJobs) {
      bulkArchiveJobs.addEventListener('click', () => {
        const ids = [...document.querySelectorAll('.row-select:checked')].map(cb => cb.dataset.id);
        if (!ids.length) {
          alert('Please select at least one task.');
          return;
        }
        const selectedTasks = DataStore.tasks.filter(t => ids.includes(t.id));
        const jobCodes = new Set();
        selectedTasks.forEach(t => {
          const eng = DataStore.engagements.find(e => e.id === t.engagementId);
          if (eng && eng.jobCode) jobCodes.add(eng.jobCode);
        });
        if (!jobCodes.size) {
          alert('No Job Codes found for selected tasks.');
          return;
        }
        if (!confirm(`Archive jobs for ${jobCodes.size} Job Code(s)? This will move all their tasks to Archive.`)) return;

        ArchiveModule.archiveJobs(Array.from(jobCodes));
      });
    }
  },

  updateBulkBar() {
    const selected = [...document.querySelectorAll('.row-select:checked')];
    const bar = document.getElementById('bulkBar');
    if (!bar) return;

    if (!selected.length) {
      bar.style.display = 'none';
    } else {
      bar.style.display = 'block';
      const lbl = document.getElementById('bulkCount');
      if (lbl) lbl.textContent = `${selected.length} selected`;
    }
  },

  bindColumnResize() {
    const tables = document.querySelectorAll('.card-table table');
    tables.forEach(table => {
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      const ths = headerRow.querySelectorAll('th');
      let startX = 0;
      let startWidth = 0;
      let currentTh = null;

      const onMouseMove = (e) => {
        if (!currentTh) return;
        const dx = e.clientX - startX;
        const newWidth = Math.max(60, startWidth + dx);
        currentTh.style.width = newWidth + 'px';
        const index = Array.from(currentTh.parentNode.children).indexOf(currentTh);
        if (index >= 0) {
          table.querySelectorAll('tbody tr').forEach(row => {
            const td = row.children[index];
            if (td) {
              td.style.width = newWidth + 'px';
            }
          });
        }
      };

      const onMouseUp = () => {
        currentTh = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      ths.forEach(th => {
        th.style.position = 'relative';

        th.addEventListener('mousemove', (e) => {
          const rect = th.getBoundingClientRect();
          const offset = rect.right - e.clientX;
          if (offset >= 0 && offset <= 8) {
            th.style.cursor = 'col-resize';
          } else if (!currentTh) {
            th.style.cursor = 'pointer';
          }
        });

        th.addEventListener('mousedown', (e) => {
          const rect = th.getBoundingClientRect();
          const offset = rect.right - e.clientX;
          if (offset < 0 || offset > 8) return;
          e.preventDefault();
          startX = e.clientX;
          startWidth = th.offsetWidth;
          currentTh = th;
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });
      });
    });
  },

 renderTasks() {
  const tbody = document.getElementById('taskTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = FiltersContext
    .getFilteredTasks()
    .filter(t => !t.archived);

  filtered.forEach(task => {
    const engagement = DataStore.engagements.find(e => e.id === task.engagementId) || {};
    const tr = document.createElement('tr');
    tr.dataset.taskId = task.id;

    // ✅ SAFE PREPARER ARRAY
    const preparerArray = Array.isArray(task.preparer)
      ? task.preparer
      : task.preparer
        ? [task.preparer]
        : [];

    const preparers = task.preparers || preparerArray.map(p => ({
      name: p,
      status: task.prepStatus || 'Assigned to preparer'
    }));

    // ✅ SAFE REVIEWER ARRAY
    const reviewerArray = Array.isArray(task.reviewer)
      ? task.reviewer
      : task.reviewer
        ? [task.reviewer]
        : [];

    tr.innerHTML = `
      <td><input type="checkbox" class="row-select" data-id="${task.id}"></td>
      <td>${engagement.entity || '—'}</td>
      <td>
        ${engagement.name || '—'}<br />
        <span class="text-muted">${engagement.serviceLine || ''}</span>
      </td>
      <td><code>${engagement.jobCode || '—'}</code></td>
      <td><code>${engagement.clientCode || '—'}</code></td>
      
      <td>${DataStore.getUserName(engagement.partner)}</td>
      <td>${task.taskName}</td>

      <!-- PREPARER -->
      <td style="vertical-align: top;">
        <div class="prep-container">
          ${preparers.map((p, i) => `
            <div class="prep-row">
           <span class="preparer-pill">${p.name}</span>
           </div>
          `).join('')}

          <select class="add-prep-dropdown" data-task-id="${task.id}">
            <option value="">+ Add Preparer</option>
            ${(DataStore.users || []).map(u => `
              <option value="${u.displayName}">${u.displayName}</option>
            `).join('')}
          </select>
        </div>
      </td>

      <!-- PREPARER STATUS -->
      <td style="vertical-align: top;">
        <div class="prep-container">
          ${preparers.map((p, i) => `
            <div class="prep-row">
              <select class="prep-status-dropdown"
                      data-task-id="${task.id}"
                      data-index="${i}">
                <option ${p.status === 'Assigned to preparer' ? 'selected' : ''}>Assigned to preparer</option>
                <option ${p.status === 'Data asked from client' ? 'selected' : ''}>Data asked from client</option>
                <option ${p.status === 'Work in progress' ? 'selected' : ''}>Work in progress</option>
                <option ${p.status === 'Queries asked' ? 'selected' : ''}>Queries asked</option>
                <option ${p.status === 'Submitted to reviewer' ? 'selected' : ''}>Submitted to reviewer</option>
              </select>

              <button class="remove-prep"
                data-task-id="${task.id}"
                data-index="${i}">
                ✕
              </button>
            </div>
          `).join('')}
        </div>
      </td>

      <!-- REVIEWER -->
      <td class="reviewer-cell">
        ${reviewerArray.map(r => {
          const user = DataStore.users.find(u => u.displayName === r || u.email === r);
          return user ? user.displayName : r;
        }).join(', ') || 'Select'}
      </td>

      <!-- REVIEWER STATUS -->
      <td>
        <select class="inline-select inline-rev-status" data-task-id="${task.id}">
          <option ${task.revStatus === 'Assigned to reviewer' ? 'selected' : ''}>Assigned to reviewer</option>
          <option ${task.revStatus === 'Review in progress' ? 'selected' : ''}>Review in progress</option>
          <option ${task.revStatus === 'Queries returned to preparer' ? 'selected' : ''}>Queries returned to preparer</option>
          <option ${task.revStatus === 'Sent to client for review' ? 'selected' : ''}>Sent to client for review</option>
          <option ${task.revStatus === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>

      <td>${task.createdAt ? DataStore.formatDateDisplay(task.createdAt) : '—'}</td>
      <td>${DataStore.formatDateDisplay(task.dueDate)}</td>

      <td>
        <div class="action-menu">
          <button class="btn-xs btn-more" type="button">⋯</button>
          <div class="action-menu-dropdown">
            <button class="action-item action-update" type="button">Update</button>
            <button class="action-item action-duplicate" type="button">Duplicate</button>
            <button class="action-item action-delete" type="button">Delete</button>
          </div>
        </div>
      </td>
    `;

    tbody.appendChild(tr);

    // reviewer popup
    const revCell = tr.querySelector('.reviewer-cell');
    if (revCell) {
      revCell.onclick = (e) => {
        e.stopPropagation();
        openUserPopup(revCell, reviewerArray, (updated) => {
          task.reviewer = updated;
          DataStore.saveTask(task);
          TaskModule.renderTasks();
        });
      };
    }
  });

  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.checked = false;

  this.updateBulkBar();
  FiltersContext.renderStats(filtered);
},

  duplicateTask(btn) {
    const tr = btn.closest('tr');
    const taskId = tr.dataset.taskId;
    const original = DataStore.tasks.find(t => t.id === taskId);
    if (!original) return;

    const id = 't' + (DataStore.tasks.length + DataStore.archivedTasks.length + 1);
    const copy = {
      id,
      engagementId: original.engagementId,
      taskName: original.taskName + ' (copy)',
      preparer: original.preparer,
      prepStatus: original.prepStatus,
      reviewer: original.reviewer,
      revStatus: original.revStatus,
      dueDate: original.dueDate,
      createdAt: original.createdAt,
      auditLog: []
    };
    DataStore.addAuditEntry(copy, {}, `Task created by duplicating "${original.taskName}".`);
    DataStore.tasks.push(copy);

    this.renderTasks();
    const scroll = document.getElementById('tableScroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
    btn.closest('.action-menu-dropdown').classList.remove('show');
    alert('Task duplicated in this demo.');
  },

  async deleteTask(btn) {

  const tr = btn.closest('tr');
  const taskId = tr.dataset.taskId;

  const task = DataStore.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!confirm("Are you sure you want to delete this task?")) return;

  try {

    const res = await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}&engagementId=${encodeURIComponent(task.engagementId)}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("Delete API error:", msg);
      alert("Failed to delete task from server.");
      return;
    }

    await loadTasks();   

  } catch (err) {
    console.error("Delete error:", err);
    alert("Delete request failed.");
  }

},
  
  openUpdateModal(btn) {
  
    const tr = btn.closest('tr');
    const taskId = tr.dataset.taskId;
  
    const task = DataStore.tasks.find(t => t.id === taskId);
    if (!task) return;
  
    document.getElementById('updateTaskNameLabel').textContent = task.taskName;
  
    document.getElementById('updateTaskName').value = task.taskName || '';
    document.getElementById('updatePrepStatus').value = task.prepStatus || '';
    document.getElementById('updateRevStatus').value = task.revStatus || '';
    document.getElementById('updateDueDate').value = task.dueDate || '';
  
    // Copy dropdown options FIRST
    document.getElementById("updateEngagementSelect").innerHTML =
      document.getElementById("taskEngagement").innerHTML;
  
    document.getElementById("updatePreparer").innerHTML =
      document.getElementById("preparerSelect").innerHTML;
  
    document.getElementById("updateReviewer").innerHTML =
      document.getElementById("reviewerSelect").innerHTML;
  
    // THEN set selected values
    document.getElementById("updatePreparer").value = task.preparer || '';
    document.getElementById("updateReviewer").value = task.reviewer || '';
    document.getElementById("updateEngagementSelect").value = task.engagementId || '';
  
    this.currentTaskId = taskId;
  
    App.openModal('modalUpdateStatus');
  },
  
  saveUpdateModal() {

    const task = DataStore.tasks.find(t => t.id === this.currentTaskId);
    if (!task) return;

    task.taskName = document.getElementById('updateTaskName').value;
    task.preparer = document.getElementById('updatePreparer').value;
    task.reviewer = document.getElementById('updateReviewer').value;
    task.prepStatus = document.getElementById('updatePrepStatus').value;
    task.revStatus = document.getElementById('updateRevStatus').value;
    task.dueDate = document.getElementById('updateDueDate').value;

    this.renderTasks();

    App.closeModal('modalUpdateStatus');
  }
}; 
