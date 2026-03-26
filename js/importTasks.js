// js/importTasks.js
const ImportModule = {
  init() {
    const btnImport = document.getElementById('btnImport');
    if (btnImport) {
     btnImport.addEventListener('click', () => {
      document.getElementById("modalImport").style.display = "flex";
        console.log("Import button clicked. File input opened.");
      });
    }

// STEP 4 — show Step 2 when radio selected
  const importRadios = document.querySelectorAll('input[name="importType"]');
  const step2 = document.getElementById("importActions");

  importRadios.forEach(r => {
    r.addEventListener("change", () => {
      if (step2) step2.style.display = "flex";
    });
  });

  // STEP 5 — Drag & Drop upload
  const dropZone = document.getElementById("dropZone");

  if (dropZone) {

    dropZone.addEventListener("dragover", e => {
      e.preventDefault();
      dropZone.style.background = "#eee";
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.background = "#fafafa";
    });

    dropZone.addEventListener("drop", e => {
      e.preventDefault();

      const files = e.dataTransfer.files;
      const input = document.getElementById("excelFileInput");

      input.files = files;
      input.dispatchEvent(new Event("change"));
    });

  }    
    
// Download Excel Template
const btnDownload = document.getElementById('btnDownloadImportTemplate');

if (btnDownload) {
  btnDownload.addEventListener('click', () => {

    const selected = document.querySelector('input[name="importType"]:checked');

if(!selected){
  alert("Please select Import Tasks or Import Engagements first.");
  return;
}

const type = selected.value;

let headers;

if(type === "tasks"){
  headers = [["Entity","Engagement","Job Code","Task","Preparer","Preparer Status","Reviewer","Reviewer Status","Due Date"]];
  fileName = "tasks_import_template.xlsx";
} else{
  headers = [["Entity","Engagement Name","Job Code","Service Line","Team Leader","Partner","Status"]];
  fileName = "engagements_import_template.xlsx";
}

    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Template");

    XLSX.writeFile(wb, fileName);

  });
}
    
    const fileInput = document.getElementById('excelFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        console.log("File selected:", file.name); // Log selected file

        const name = file.name.toLowerCase();
        const reader = new FileReader();

        if (name.endsWith('.csv')) {
          console.log("Processing CSV file.");
          reader.onload = ev => this.handleCSV(ev.target.result); // Handle CSV file
          reader.readAsText(file);
        } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
          console.log("Processing Excel file.");
          reader.onload = ev => this.handleExcelArrayBuffer(ev.target.result); // Handle Excel file
          reader.readAsArrayBuffer(file);
        } else {
          alert('Unsupported file format. Please select a CSV or Excel file.');
        }
      });
    }
  },

  normalizeHeader(h) {
    return (h || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
  },

  handleCSV(text) {
    console.log("Handling CSV data...");
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const rows = lines.map(line =>
      line.split(',').map(cell => cell.replace(/^"|"$/g, '')) // Remove extra quotes from cells
    );
    this.importRows(rows); // Pass the rows to be processed
  },

  handleExcelArrayBuffer(arrayBuffer) {
    console.log("Handling Excel data...");
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0]; // Use the first sheet
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get rows as an array
    this.importRows(rows); // Pass the rows to be processed
  },

  importRows(rows) {
    if (!rows || !rows.length) {
      alert('No rows found.');
      return;
    }

    const headerRow = rows[0];
    const headers = headerRow.map(h => this.normalizeHeader(h)); // Normalize headers (make them lowercase)

    const colIndex = (names) => {
      for (const cand of names) {
        const idx = headers.indexOf(cand);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idxEntity = colIndex(['entity', 'entity name']);
    const idxEngagement = colIndex(['engagement']);
    const idxJobCode = colIndex(['job code', 'jobcode', 'job']);
    const idxTask = colIndex(['task']);
    const idxPrep = colIndex(['preparer']);
    const idxPrepStat = colIndex(['preparer status', 'preparerstatus']);
    const idxRev = colIndex(['reviewer']);
    const idxRevStat = colIndex(['reviewer status', 'reviewerstatus']);
    const idxDue = colIndex(['due', 'due date', 'duedate']);

    if (idxEngagement === -1 || idxTask === -1) {
      alert('At minimum, columns "Engagement" and "Task" are required.');
      return;
    }

    let createdTasks = 0;
    let updatedTasksCount = 0;
    let importedEngagements = 0;

    // Process each row after header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.length) continue;

      const entityName = idxEntity !== -1 && row[idxEntity] ? row[idxEntity].toString().trim() : 'Imported';
      const engagementName = row[idxEngagement]?.toString().trim() || '';
      const jobCode = idxJobCode !== -1 && row[idxJobCode] ? row[idxJobCode].toString().trim() : '';
      const taskName = row[idxTask]?.toString().trim() || '';
      if (!engagementName || !taskName) continue;

      const preparer = idxPrep !== -1 && row[idxPrep] ? row[idxPrep].toString().trim() : '';
      const prepStatus = idxPrepStat !== -1 && row[idxPrepStat] ? row[idxPrepStat].toString().trim() : 'Assigned to preparer';
      const reviewer = idxRev !== -1 && row[idxRev] ? row[idxRev].toString().trim() : '';
      const revStatus = idxRevStat !== -1 && row[idxRevStat] ? row[idxRevStat].toString().trim() : 'Assigned to reviewer';
      const dueRaw = idxDue !== -1 && row[idxDue] ? row[idxDue].toString().trim() : '';
      const dueISO = DataStore.toISODate(dueRaw);

      let engagement = null;
      if (jobCode) {
        engagement = DataStore.engagements.find(e => e.jobCode === jobCode);
      }
      if (!engagement) {
        engagement = DataStore.engagements.find(e =>
          e.name === engagementName && e.entity === entityName
        );
      }

      if (!engagement) {
        const id = 'eng' + (DataStore.engagements.length + 1);
        engagement = {
          id,
          entity: entityName,
          name: engagementName,
          jobCode,
          serviceLine: '',
          owner: reviewer || '',
          status: 'Active'
        };
        DataStore.engagements.push(engagement);
        importedEngagements++;
      } else {
        if (!engagement.jobCode && jobCode) engagement.jobCode = jobCode;
        if (!engagement.entity && entityName) engagement.entity = entityName;
      }

      let existingTask = null;
      if (jobCode) {
        existingTask = DataStore.tasks.find(t => {
          const eng = DataStore.engagements.find(e => e.id === t.engagementId);
          return eng && eng.jobCode === jobCode && t.taskName === taskName;
        });
      } else {
        existingTask = DataStore.tasks.find(t => {
          const eng = DataStore.engagements.find(e => e.id === t.engagementId);
          return eng && eng.name === engagementName && t.taskName === taskName;
        });
      }

      if (existingTask) {
        existingTask.preparer = preparer;
        existingTask.prepStatus = prepStatus || existingTask.prepStatus;
        existingTask.reviewer = reviewer;
        existingTask.revStatus = revStatus || existingTask.revStatus;
        if (dueISO) existingTask.dueDate = dueISO;
        existingTask.engagementId = engagement.id;
        if (!existingTask.auditLog) existingTask.auditLog = [];
        updatedTasksCount++;
      } else {
        const id = 't' + (DataStore.tasks.length + DataStore.archivedTasks.length + 1);
        DataStore.tasks.push({
          id,
          engagementId: engagement.id,
          taskName,
          preparer,
          prepStatus,
          reviewer,
          revStatus,
          dueDate: dueISO,
          auditLog: []
        });
        createdTasks++;
      }
    }

    EngagementModule.renderEngagementSelects();
    TaskModule.renderTasks();
    ArchiveModule.renderArchive();

    alert(
      `Imported from Excel/CSV (demo only):\n` +
      `- New tasks: ${createdTasks}\n` +
      `- Updated tasks: ${updatedTasksCount}\n` +
      `- New engagements: ${importedEngagements}`
    );
  }
};

ImportModule.init(); // Initialize ImportModule and bind event listeners
