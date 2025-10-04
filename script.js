const tabsDiv = document.getElementById("tabs");
const contentDiv = document.getElementById("content");

// Load times
fetch("data/times.json")
  .then(res => res.json())
  .then(data => {
    const sessions = data.sessions;

    // Unique drivers
    const drivers = [...new Set(sessions.map(s => s.driver))];

    // Create driver tabs
    drivers.forEach((driver, i) => {
      const tab = document.createElement("div");
      tab.className = "tab" + (i === 0 ? " active" : "");
      tab.textContent = driver;
      tab.onclick = () => showDriver(driver, tab);
      tabsDiv.appendChild(tab);
    });

    // Track leaderboard tab
    const lbTab = document.createElement("div");
    lbTab.className = "tab";
    lbTab.textContent = "Track Leaderboard";
    lbTab.onclick = () => showLeaderboard(lbTab, sessions);
    tabsDiv.appendChild(lbTab);

    // Show first driver by default
    showDriver(drivers[0], tabsDiv.firstChild);
  });

// Show driver laps
function showDriver(driver, tabElement) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList.add("active");

  fetch("data/times.json")
    .then(res => res.json())
    .then(data => {
      const driverSessions = data.sessions.filter(s => s.driver === driver);
      if (!driverSessions.length) {
        contentDiv.innerHTML = "<p>No lap times for this driver.</p>";
        return;
      }

      let html = `<table>
        <tr><th>Car</th><th>Track</th><th>Date</th><th>Best Lap</th></tr>`;

      driverSessions.forEach(s => {
        html += `<tr>
          <td>${cleanName(s.car)}</td>
          <td>${cleanName(s.track)}</td>
          <td>${s.date}</td>
          <td>${s.best_lap}</td>
        </tr>`;
      });

      html += "</table>";
      contentDiv.innerHTML = html;
    });
}

// Show leaderboard with track + car filter
function showLeaderboard(tabElement, sessions) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList
