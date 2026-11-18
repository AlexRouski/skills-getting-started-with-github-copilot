document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        const participantsList = activityCard.querySelector(".participants-list");
        details.participants.forEach((participant) => {
          const listItem = document.createElement("li");
          const participantName = document.createElement("span");
          participantName.textContent = participant;

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "participant-delete-button";
          deleteButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
          deleteButton.innerHTML = `
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M8 6V4h8v2"></path>
              <path d="m19 6-1 14H6L5 6"></path>
              <path d="M10 11v5M14 11v5"></path>
            </svg>
          `;

          deleteButton.addEventListener("click", async () => {
            deleteButton.disabled = true;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Failed to unregister participant.");
              }

              listItem.remove();
              const remainingParticipants = participantsList.children.length;
              const availability = activityCard.querySelector(".activity-availability");
              availability.innerHTML = `<strong>Availability:</strong> ${
                details.max_participants - remainingParticipants
              } spots left`;
              showMessage(result.message, "success");
            } catch (error) {
              const errorMessage = error instanceof Error
                ? error.message
                : "Failed to unregister participant.";
              showMessage(errorMessage, "error");
              deleteButton.disabled = false;
              console.error("Error unregistering participant:", error);
            }
          });

          listItem.append(participantName, deleteButton);
          participantsList.appendChild(listItem);
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
