const tabsDiv = document.getElementById("tabs");
const contentDiv = document.getElementById("content");

// Load JSON from relative path
fetch("./data/times.json")
  .then(response => {
    if (!response.ok) throw new Error("Cannot find times.json");
    return response.json();
  })
  .then(data => {
    const sessions = data.sessions;
    if (!sessions || sessions.length === 0) {
      contentDiv.innerHTML = "<p>No lap times found.</p>";
      return;
    }

    // Get unique drivers
    const drivers = [...new Set(sessions.map(s => s.driver))];

    // Create tabs
    drivers.forEach((driver, i) => {
      const tab = document.createElement("div");
      tab.className = "tab" + (i === 0 ? " active" : "");
      tab.textContent = driver;
      tab.onclick = () => showDriver(driver, tab);
      tabsDiv.appendChild(tab);
    });

    // Show first driver by default
    showDriver(drivers[0], tabsDiv.firstChild);
  })
  .catch(err => {
    contentDiv.innerHTML = `<p style="color:red;">Error loading times.json: ${err}</p>`;
  });

// Show lap times for a driver
function showDriver(driver, tabElement) {
  // Highlight tab
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList.add("active");

  fetch("./data/times.json")
    .then(res => res.json())
    .then(data => {
      const driverSessions = data.sessions.filter(s => s.driver === driver);
      if (driverSessions.length === 0) {
        contentDiv.innerHTML = "<p>No lap times for this driver.</p>";
        return;
      }

      let html = `<table>
        <tr><th>Car</th><th>Track</th><th>Date</th><th>Best Lap</th></tr>`;

      driverSessions.forEach(s => {
        html += `<tr>
          <td>${s.car}</td>
          <td>${s.track}</td>
          <td>${s.date}</td>
          <td>${s.best_lap}</td>
        </tr>`;
      });

      html += "</table>";
      contentDiv.innerHTML = html;
    })
    .catch(err => {
      contentDiv.innerHTML = `<p style="color:red;">Error loading times.json: ${err}</p>`;
    });
}
