const NewEngagementModule = {

  init() {

    const btn = document.getElementById("btnNewEngagement");

    if (btn) {
      btn.addEventListener("click", () => {
        App.openModal("modalNewEngagement");
      });
    }

    const form = document.getElementById("formNewEngagement");

    if (form) {

      form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const entity = document.getElementById("engEntityName").value.trim();
        const name = document.getElementById("engName").value.trim();
        const jobCode = document.getElementById("engJobCode").value.trim();
        const clientCode = document.getElementById("engClientCode").value.trim();
        const serviceLine = document.getElementById("engServiceLine").value;
        
        const partner = document.getElementById("partnerSelect").value;
        const status = document.getElementById("engStatus").value;

        if (!partner) {
        alert("Please select Partner.");
        return;
        }

        // Check duplicate Job Code
        const duplicate = DataStore.engagements.some(e =>
        e.jobCode && e.jobCode.trim().toLowerCase() === jobCode.trim().toLowerCase()
        );

        if (duplicate) {
        alert("This NetSuite Job Code already exists for another engagement.");
        return;
        }

        if (!entity || !name) {
          alert("Entity and Engagement name are required.");
          return;
        }

        const id = "eng" + Date.now();

        const engagement = {
          id,
          entity,
          name,
          jobCode,
          clientCode,
          serviceLine,
          partner,
          status
        };

        await fetch("/api/engagements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(engagement)
        });
        
        await DataStore.loadEngagements();
 
        EngagementModule.renderEngagementSelects();
        EngagementListModule.renderTable();
        TaskModule.renderTasks();

        App.closeModal("modalNewEngagement");

        form.reset();

        alert("Engagement created successfully.");

      });

    }

  }

};

