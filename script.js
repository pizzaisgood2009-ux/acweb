// Fetch and display lap times
async function loadLapTimes() {
  try {
    // Fetch times.json (must be in same repo root as index.html)
    const response = await fetch("times.json");
    if (!response.ok) {
      throw new Error("Failed to load times.json");
    }

    const data = await response.json();
    const container = document.getElementById("lap-times");

    if (!data.sessions || data.sessions.length === 0) {
      container.innerHTML = "<p>No lap times available.</p>";
      return;
    }

    // Build HTML for each session
    container.innerHTML = data.sessions.map(session => `
      <div class="session">
        <h3>${session.track} - ${session.car}</h3>
        <p><strong>Driver:</strong> ${session.driver}</p>
        <p><strong>Date:</strong> ${session.date}</p>
        <p><strong>Best Lap:</strong> ${session.best_lap}</p>
      </div>
    `).join("");

  } catch (error) {
    console.error("Error loading lap times:", error);
    document.getElementById("lap-times").innerHTML =
      "<p style='color:red;'>Error loading lap times.</p>";
  }
}

loadLapTimes();
