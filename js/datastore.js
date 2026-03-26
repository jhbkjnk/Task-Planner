// js/datastore.js

const DataStore = {

  engagements: [],
  tasks: [],
  archivedTasks: [],
  users: JSON.parse(localStorage.getItem("users")) || [],
  taskTemplates: [],
  activeStatusFilter: 'All',
  sortConfig: { column: null, direction: null },

  async init() {

    await this.loadUsers();
    await this.loadEngagements();
    await this.loadTasks();

    this.seedTemplates();

    if (typeof EngagementModule !== "undefined") {
      EngagementModule.renderEngagementSelects();
    }

    if (typeof EngagementListModule !== "undefined") {
      EngagementListModule.renderTable();
    }

    if (typeof TaskModule !== "undefined") {
      TaskModule.renderTasks();
    }

  },

  // ===============================
  // Load Users
  // ===============================

  async loadUsers() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");

      const data = await res.json();
      this.users = Array.isArray(data) ? data : [];

      localStorage.setItem("users", JSON.stringify(this.users));

    } catch (err) {
      console.error("Error loading users:", err);
      this.users = [];
    }
  },

  // ===============================
  // Resolve Email → Display Name
  // ===============================

  getUserName(email) {

    if (!email) return '—';

    const user = this.users.find(u => {
      const userEmail =
        (u.email || u.mail || u.userPrincipalName || "").toLowerCase();

      return userEmail === email.toLowerCase();
    });

    return user ? user.displayName : email;

  },

  // ===============================
  // Load Engagements
  // ===============================

  async loadEngagements() {

    try {

      const res = await fetch("/api/engagements");
      if (!res.ok) throw new Error("Failed to load engagements");

      const data = await res.json();

      this.engagements = Array.isArray(data) ? data : [];

      localStorage.setItem("engagements", JSON.stringify(this.engagements));

      if (typeof EngagementModule !== "undefined") {
        EngagementModule.renderEngagementSelects();
      }

      if (typeof EngagementListModule !== "undefined") {
        EngagementListModule.renderTable();
      }

    } catch (err) {

      console.error("Error loading engagements:", err);

      // fallback to local
      this.engagements = JSON.parse(localStorage.getItem("engagements")) || [];

    }

  },

  // ===============================
  // Load Tasks
  // ===============================

  async loadTasks(engagementId = null) {

    try {

      let url = "/api/tasks";
      if (engagementId) url += `?engagementId=${engagementId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load tasks");

      const data = await res.json();

      const allTasks = (Array.isArray(data) ? data : []).map(t => ({
        ...t,
        engagementId: String(t.engagementId), // ✅ normalize ID
        preparer: t.preparer || [],
        reviewer: t.reviewer || [],
        prepStatus: t.prepStatus || "",
        revStatus: t.revStatus || "",
        createdAt: t.createdAt || new Date().toISOString(),
        archived: String(t.archived).toLowerCase() === "true"
      }));

      this.tasks = allTasks.filter(t => !t.archived);
      this.archivedTasks = allTasks.filter(t => t.archived);

      if (typeof TaskModule !== "undefined") {
        TaskModule.renderTasks();
      }

      if (typeof ArchiveModule !== "undefined") {
        ArchiveModule.renderArchive();
      }

    } catch (err) {

      console.error("Error loading tasks:", err);
      this.tasks = [];

    }

  },

  // ===============================
  // Save Task
  // ===============================

  async saveTask(task) {
    try {
      const payload = {
        ...task,
        archived: task.archived || false
      };

      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

    } catch (err) {
      console.error("Error saving task:", err);
    }
  },

  // ===============================
  // Delete Task
  // ===============================

  async deleteTask(taskId, engagementId) {

    try {

      const res = await fetch(`/api/engagements/${id}`, {
        method: "DELETE"
      });
      

      await this.loadTasks();

    } catch (err) {
      console.error("Error deleting task:", err);
    }

  },

  // ===============================
  // 🚀 FIXED DELETE ENGAGEMENT
  // ===============================

    async deleteEngagement(id) {
    
      id = String(id);
    
      console.log("Deleting engagement:", id);
    
      try {
    
        const res = await fetch(`/api/engagements`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id }) // ✅ THIS IS THE KEY FIX
        });
    
        const text = await res.text();
    
        console.log("DELETE RESPONSE:", res.status, text);
    
        if (!res.ok) {
          alert("Server delete failed.");
          return;
        }
    
        // ✅ remove locally AFTER success
        this.engagements = this.engagements.filter(e => String(e.id) !== id);
    
        localStorage.setItem("engagements", JSON.stringify(this.engagements));
    
        if (typeof EngagementListModule !== "undefined") {
          EngagementListModule.renderTable();
        }
    
        if (typeof EngagementModule !== "undefined") {
          EngagementModule.renderEngagementSelects();
        }
    
      } catch (err) {
        console.error("DELETE ERROR:", err);
        alert("Delete failed due to API error.");
      }
    },
  
  // ===============================
  // 🚀 UPDATE ENGAGEMENT
  // ===============================

  async updateEngagement(updated) {

    const id = String(updated.id);
  
    try {
  
      // ✅ API call
      await fetch(`/api/engagements`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updated)
      });
  
      // ✅ Update locally
      this.engagements = this.engagements.map(e =>
        String(e.id) === id ? { ...e, ...updated } : e
      );
  
      localStorage.setItem("engagements", JSON.stringify(this.engagements));
  
      console.log("Engagement updated:", updated);
  
    } catch (err) {
      console.error("Error updating engagement:", err);
    }
  },

  // ===============================
  // Task Templates
  // ===============================

  seedTemplates() {

    this.taskTemplates = [
      {
        id: 'tmpl_audit_basic',
        name: 'Audit – core workflow',
        tasks: [
          'Engagement setup & kickoff',
          'PBC list – send to client',
          'Trial balance tie-out',
          'Revenue testing',
          'Expense testing',
          'Analytical review',
          'Final partner review',
          'Wrap-up & documentation'
        ]
      },
      {
        id: 'tmpl_ustax_basic',
        name: 'U.S. Corporate Tax – 1120',
        tasks: [
          'Collect TB & trial balance mapping',
          'Compute book–tax differences',
          'Prepare draft Form 1120',
          'State apportionment & returns – planning',
          'Final 1120 & e-file package',
          'Client review & sign-off'
        ]
      }
    ];

  },

  // ===============================
  // Current User
  // ===============================

  getCurrentUser() {

    const el = document.getElementById('loggedInUserName');
    if (!el) return "User";

    return el.textContent || "User";

  },

  // ===============================
  // Audit Log
  // ===============================

  addAuditEntry(task, changes, comment) {

    if (!task.auditLog) task.auditLog = [];

    task.auditLog.push({
      timestamp: new Date().toISOString(),
      user: this.getCurrentUser(),
      changes: changes || {},
      comment: comment || ''
    });

  },

  // ===============================
  // Date Formatting
  // ===============================

  formatDateDisplay(iso) {

    if (!iso) return '—';

    const date = new Date(iso);
    if (isNaN(date)) return iso;

    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = names[date.getMonth()];

    return `${day}-${month}-${year}`;
  },

  toISODate(val) {

    if (!val) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    const parsed = new Date(val);

    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return '';
  }

};
