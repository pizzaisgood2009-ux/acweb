// ===== Helper Functions =====
function cleanName(name) {
  return name.replace(/_/g, ' ');
}

const trackNames = {
  "KS_NURBURGRING-LAYOUT_GP_A": "Nürburgring GP",
  "KS_SILVERSTONE-NATIONAL": "Silverstone National",
  "AA_IMS-INDY500": "Indianapolis 500",
  "KS_VALLELUNGA-CLUB_CIRCUIT": "Vallelunga Club Circuit"
};

function getTrackDisplayName(trackFileName) {
  return trackNames[trackFileName] || cleanName(trackFileName);
}

// ===== DOM Elements =====
const tabsDiv = document.getElementById("tabs");
const contentDiv = document.getElementById("content");

// ===== Load Driver Tabs =====
fetch("data/times_flat.json")
  .then(res => res.json())
  .then(data => {
    const sessions = data.sessions;
    const drivers = [...new Set(sessions.map(s => s.driver))];

    drivers.forEach((driver, i) => {
      const tab = document.createElement("div");
      tab.className = "tab" + (i === 0 ? " active" : "");
      tab.textContent = driver;
      tab.onclick = () => showDriver(driver, tab);
      tabsDiv.appendChild(tab);
    });

    const lbTab = document.createElement("div");
    lbTab.className = "tab";
    lbTab.textContent = "Track Leaderboard";
    lbTab.onclick = () => showLeaderboard(lbTab, sessions);
    tabsDiv.appendChild(lbTab);

    showDriver(drivers[0], tabsDiv.firstChild);
  });

// ===== Show Driver Lap Times =====
function showDriver(driver, tabElement) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList.add("active");

  fetch("./data/times.json")
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
          <td>${getTrackDisplayName(s.track)}</td>
          <td>${s.date}</td>
          <td>${s.best_lap}</td>
        </tr>`;
      });

      html += "</table>";
      contentDiv.innerHTML = html;
    });
}

// ===== Track Leaderboard =====
function showLeaderboard(tabElement, sessions) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList.add("active");

  let html = `<label>Select Track: </label>
              <select id="trackSelect"></select>
              <div id="leaderboardContent" style="margin-top:10px;"></div>`;
  contentDiv.innerHTML = html;

  const trackSelect = document.getElementById("trackSelect");
  const lbContent = document.getElementById("leaderboardContent");

  const tracks = [...new Set(sessions.map(s => s.track))];
  tracks.forEach(track => {
    const option = document.createElement("option");
    option.value = track;
    option.textContent = getTrackDisplayName(track);
    trackSelect.appendChild(option);
  });

  trackSelect.onchange = () => renderLeaderboard(trackSelect.value, lbContent, sessions);
  renderLeaderboard(tracks[0], lbContent, sessions);
}

function renderLeaderboard(track, container, sessions) {
  const trackSessions = sessions
    .filter(s => s.track === track)
    .sort((a, b) => {
      const timeToSec = t => {
        if(t==="N/A") return Infinity;
        const parts = t.split(":");
        return parseInt(parts[0])*60 + parseFloat(parts[1]);
      };
      return timeToSec(a.best_lap) - timeToSec(b.best_lap);
    });

  if (!trackSessions.length) {
    container.innerHTML = "<p>No lap times for this track.</p>";
    return;
  }

  let html = `<table>
    <tr><th>Driver</th><th>Car</th><th>Best Lap</th><th>Date</th></tr>`;

  trackSessions.forEach(s => {
    html += `<tr>
      <td>${s.driver}</td>
      <td>${cleanName(s.car)}</td>
      <td>${s.best_lap}</td>
      <td>${s.date}</td>
    </tr>`;
  });

  html += "</table>";
  container.innerHTML = html;
}
