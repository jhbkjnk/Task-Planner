const App = {

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = "flex";
    }
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = "none";
    }
  }

};
async function loadLoggedInUser() {

    const res = await fetch("/.auth/me");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("loggedInUserName").textContent = "Not signed in";
        return;
    }

    const user = data[0];
    const email = user.userDetails;

    const niceName = email
        .split("@")[0]
        .replaceAll(".", " ")
        .replace(/\b\w/g, l => l.toUpperCase());

    document.getElementById("loggedInUserName").textContent = niceName;
}

async function fillDropdown(selectId, role) {

    const dropdown = document.getElementById(selectId);

    dropdown.innerHTML = `<option>Loading...</option>`;
try {

    const res = await fetch(`/api/users?role=${role}`);
    const users = await res.json();

    dropdown.innerHTML = `<option value="">Select ${role}</option>`;

    users.forEach(user => {

        const option = document.createElement("option");
        option.value = user.email;
        option.textContent = user.displayName;

        dropdown.appendChild(option);

    });
} catch (err) {

        dropdown.innerHTML = `<option>Error loading users</option>`;
        console.error(err);

    }
}

async function init() {
    DataStore.init();
  
    await loadLoggedInUser();

    await fillDropdown("preparerSelect","preparer");
    await fillDropdown("reviewerSelect","reviewer");
    
    await fillDropdown("partnerSelect","partner");

}
document.addEventListener("DOMContentLoaded", init);
document.addEventListener("click", function (e) {

  const closeBtn = e.target.closest("[data-modal-close]");

  if (closeBtn) {
    const modalId = closeBtn.getAttribute("data-modal-close");
    App.closeModal(modalId);
  }

});

async function loadTasks() {
  try {

    const res = await fetch("/api/tasks");

    if (!res.ok) {
      console.error("Failed to load tasks");
      return;
    }

    const tasks = await res.json();

    // Replace local demo tasks with cloud tasks
    DataStore.tasks = tasks;

    // Render table
    TaskModule.renderTasks();

  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTasks);
