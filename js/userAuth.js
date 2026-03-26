// ===============================
// Load Logged-in User from Azure Auth
// ===============================

async function loadLoggedInUser() {

    try {

        const response = await fetch("/.auth/me");
        const data = await response.json();

        const principal = data.clientPrincipal;

        if (!principal) {

            const nameEl = document.getElementById("loggedInUserName");
            const roleEl = document.getElementById("loggedInUserRole");

            if (nameEl) nameEl.textContent = "Unknown";
            if (roleEl) roleEl.textContent = "";

            return null;
        }

        const email = principal.userDetails;

        // Convert email to readable name
        const name = email
            .split("@")[0]
            .replaceAll(".", " ")
            .replace(/\b\w/g, l => l.toUpperCase());

        const nameElement = document.getElementById("loggedInUserName");

        if (nameElement) {
            nameElement.textContent = name;
        }

        return {
            name,
            email
        };

    } catch (err) {

        console.log("Error loading logged-in user:", err);

        const nameEl = document.getElementById("loggedInUserName");

        if (nameEl) nameEl.textContent = "Unknown";

        return null;
    }
}


// ===============================
// Fetch All Azure AD Users
// ===============================

async function fetchAllUsers() {

    try {

        const res = await fetch("/api/users");

        if (!res.ok) {
            throw new Error("Failed to fetch users");
        }

        const users = await res.json();

        return users;

    } catch (err) {

        console.log("Error loading Azure AD users:", err);
        return [];
    }
}


// ===============================
// Populate Dropdown
// ===============================

function populateUserDropdown(selectId, users) {

    const dropdown = document.getElementById(selectId);

    if (!dropdown) return;

    dropdown.innerHTML = `<option value="">Select User</option>`;

    users.forEach(user => {

        const option = document.createElement("option");

        option.value = user.email;
        option.textContent = user.displayName;

        dropdown.appendChild(option);

    });

}


// ===============================
// Initialize Users in Planner
// ===============================

async function initializePlannerUsers() {

    const loggedInUser = await loadLoggedInUser();

    if (!loggedInUser) return;

    try {

        const users = await fetchAllUsers();

        const matchedUser = users.find(
            u => u.email.toLowerCase() === loggedInUser.email.toLowerCase()
        );

        if (matchedUser) {

            const nameEl = document.getElementById("loggedInUserName");
            const roleEl = document.getElementById("loggedInUserRole");

            if (nameEl) nameEl.textContent = matchedUser.displayName;
            if (roleEl) roleEl.textContent = matchedUser.role || "";

        }

    } catch (err) {

        console.log("Error initializing planner users:", err);

    }

}


// ===============================
// Logout Function
// ===============================

function logout() {

    if (confirm("Are you sure you want to logout?")) {

        window.location.href =
            "/.auth/logout?post_logout_redirect_uri=/login.html";

    }

}


// ===============================
// Populate Engagement Dropdown Users
// ===============================

async function populateEngagementUsers() {

    try {

        const users = await fetchAllUsers();

        const ownerSelect = document.getElementById("engOwner");
        const teamLeadSelect = document.getElementById("engTeamLeader");
        const partnerSelect = document.getElementById("engPartner");

        if (!ownerSelect || !teamLeadSelect || !partnerSelect) return;

        ownerSelect.innerHTML = `<option value="">Select owner</option>`;
        teamLeadSelect.innerHTML = `<option value="">Select team lead</option>`;
        partnerSelect.innerHTML = `<option value="">Select partner</option>`;

        users.forEach(user => {

            const option1 = new Option(user.displayName, user.displayName);
            const option2 = new Option(user.displayName, user.displayName);
            const option3 = new Option(user.displayName, user.displayName);

            ownerSelect.appendChild(option1);
            teamLeadSelect.appendChild(option2);
            partnerSelect.appendChild(option3);

        });

    } catch (err) {

        console.error("Failed loading engagement users:", err);

    }

}


// ===============================
// Initialize on Page Load
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    initializePlannerUsers();
    populateEngagementUsers();

});
